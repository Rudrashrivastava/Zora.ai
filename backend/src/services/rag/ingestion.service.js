import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddings } from "./embedding.service.js";
import { index as pineconeIndex } from "./pinecone.service.js";
import DocumentModel, { ChunkModel } from "../../models/document.model.js";

const require = createRequire(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeDecode(str) {
    if (!str) return "";
    try {
        return decodeURIComponent(str);
    } catch (_) {
        try {
            return decodeURIComponent(str.replace(/%(?![0-9a-fA-F]{2})/g, "%25"));
        } catch (_) {
            return str;
        }
    }
}

function cleanExtractedText(text) {
    if (!text) return "";
    return text
        .replace(/\r\n/g, "\n")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n\s*\n+/g, "\n\n")
        .trim();
}

/**
 * Detects if extracted PDF text is low-quality garbage:
 * - Scanned/image PDFs where pdf2json only finds watermarks ("AdarshChetan" × 73 pages)
 * - Near-empty documents
 */
function isGarbageText(text, pageCount = 1) {
    if (!text || !text.trim()) return true;

    const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length === 0) return true;

    const uniqueLines = new Set(lines);
    const uniqueRatio = uniqueLines.size / lines.length;
    const totalUniqueContent = [...uniqueLines].join(" ").length;

    // >80% identical lines AND <200 chars of unique content → watermark/header garbage
    if (uniqueRatio < 0.2 && totalUniqueContent < 200) {
        console.warn(
            `[Ingestion] Garbage text detected: ${uniqueLines.size} unique lines / ${lines.length} total. ` +
                `Unique content: "${[...uniqueLines].join(", ").slice(0, 100)}"`
        );
        return true;
    }

    // <50 chars per page on average → almost certainly a scanned/image PDF
    const avgCharsPerPage = text.length / Math.max(pageCount, 1);
    if (avgCharsPerPage < 50) {
        console.warn(`[Ingestion] Sparse text: ${avgCharsPerPage.toFixed(1)} chars/page — likely scanned PDF.`);
        return true;
    }

    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI VISION OCR  — fallback for scanned / handwritten PDFs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Uses Gemini 1.5 Flash's native multimodal vision to extract ALL text from
 * a scanned or image-based PDF (handwritten notes, photo-scans, etc.).
 * No external system dependencies — works on Render free tier.
 *
 * Strategy: try Flash → Pro → Mistral fallback (Mistral doesn't support PDF so
 * we skip it and throw clearly if all Gemini keys fail).
 */
async function extractTextWithGeminiVision(filePath) {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiKey) {
        throw new Error("GEMINI_API_KEY not set — cannot perform OCR on scanned PDFs.");
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(geminiKey);

    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString("base64");

    // File size guard: Gemini inline_data limit is ~20 MB
    const fileSizeMB = pdfBuffer.length / (1024 * 1024);
    if (fileSizeMB > 18) {
        throw new Error(
            `PDF is too large for OCR (${fileSizeMB.toFixed(1)} MB). ` +
                `Please split it into smaller parts (max ~18 MB per upload).`
        );
    }

    const ocrPrompt =
        "You are an expert OCR system. Extract ALL text content from this PDF document — " +
        "including handwritten notes, printed text, equations, tables, bullet points, " +
        "headings, and any diagrams described in text. " +
        "Preserve the structure as closely as possible (use newlines for new lines, " +
        "use '## ' for major headings, '- ' for bullet points). " +
        "Output ONLY the raw extracted text. Do NOT add any commentary, explanation, " +
        "or preamble. Start directly with the document content.";

    const geminiModels = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-pro"
    ];

    let lastError = null;
    for (const modelName of geminiModels) {
        try {
            console.log(`[OCR] Attempting Gemini Vision OCR with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([
                {
                    inlineData: {
                        data: pdfBase64,
                        mimeType: "application/pdf",
                    },
                },
                ocrPrompt,
            ]);

            const text = result?.response?.text?.() || "";
            if (text && text.trim().length > 20) {
                console.log(
                    `[OCR] Gemini Vision (${modelName}) extracted ${text.length} chars from scanned PDF`
                );
                return cleanExtractedText(text);
            }

            lastError = new Error(`${modelName} returned empty OCR response`);
        } catch (err) {
            console.warn(`[OCR] ${modelName} failed: ${err.message}`);
            lastError = err;
        }
    }

    throw new Error(
        `Gemini Vision OCR failed after all models: ${lastError?.message || "Unknown error"}. ` +
            `Please check your GEMINI_API_KEY quota.`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY PDF EXTRACTION — pdf2json (fast, free, no API cost)
// ─────────────────────────────────────────────────────────────────────────────

async function extractPDFTextWithPdf2Json(filePath) {
    return new Promise((resolve, reject) => {
        const PDFParser = require("pdf2json");
        const pdfParser = new PDFParser(null, 1);

        pdfParser.on("pdfParser_dataError", (errData) => {
            reject(new Error(`pdf2json failed: ${errData?.parserError || "Unknown error"}`));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            try {
                const pages = pdfData?.Pages || [];
                const pageCount = pages.length;
                let fullText = "";

                for (const page of pages) {
                    const texts = page?.Texts || [];
                    const lineMap = new Map();

                    for (const textObj of texts) {
                        const y = Math.round((textObj.y || 0) * 10) / 10;
                        if (!lineMap.has(y)) lineMap.set(y, []);

                        for (const r of textObj?.R || []) {
                            const str = safeDecode(r.T);
                            if (str) {
                                const lineList = lineMap.get(y);
                                if (lineList.length === 0 || lineList[lineList.length - 1] !== str) {
                                    lineList.push(str);
                                }
                            }
                        }
                    }

                    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => a - b);
                    let prevLine = "";
                    for (const y of sortedYs) {
                        const lineStr = lineMap.get(y).join(" ").replace(/[ \t]+/g, " ").trim();
                        if (lineStr && lineStr !== prevLine) {
                            fullText += lineStr + "\n";
                            prevLine = lineStr;
                        }
                    }
                }

                if (!fullText.trim() && typeof pdfParser.getRawTextContent === "function") {
                    fullText = pdfParser.getRawTextContent();
                }

                const cleaned = cleanExtractedText(fullText);

                // Return garbage signal so caller can fall back to Gemini OCR
                resolve({ text: cleaned, pageCount, isGarbage: isGarbageText(cleaned, pageCount) });
            } catch (err) {
                console.error("[pdf2json Extract Error]:", err);
                reject(new Error(`pdf2json extraction error: ${err.message}`));
            }
        });

        pdfParser.loadPDF(filePath);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED PDF EXTRACTOR — pdf2json → Gemini Vision OCR fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts text from any PDF:
 * 1. Try pdf2json (instant, free — works for text-based PDFs)
 * 2. If garbage/image detected → Gemini 1.5 Flash Vision OCR
 *    (works for handwritten notes, scanned documents, image-only PDFs)
 */
async function extractPDFText(filePath) {
    let pdf2jsonResult;

    try {
        pdf2jsonResult = await extractPDFTextWithPdf2Json(filePath);
    } catch (parseErr) {
        // pdf2json itself crashed (corrupt file, encrypted, etc.) → go straight to Gemini
        console.warn(`[PDF] pdf2json crashed: ${parseErr.message} — falling back to Gemini Vision OCR`);
        pdf2jsonResult = { text: "", pageCount: 0, isGarbage: true };
    }

    if (!pdf2jsonResult.isGarbage) {
        // ✅ Clean text-based PDF — return directly (fast path)
        console.log(
            `[PDF] pdf2json extracted ${pdf2jsonResult.text.length} chars from ${pdf2jsonResult.pageCount} pages`
        );
        return pdf2jsonResult.text;
    }

    // ⚠️ Scanned / handwritten / image-based PDF detected
    // → Use Gemini 1.5 Flash Vision to OCR the document
    console.log(
        `[PDF] Scanned/image PDF detected (${pdf2jsonResult.pageCount} pages, ` +
            `garbage text from pdf2json). Starting Gemini Vision OCR...`
    );

    const ocrText = await extractTextWithGeminiVision(filePath);

    if (!ocrText || !ocrText.trim()) {
        throw new Error(
            "Could not extract any readable text from this PDF even with AI vision. " +
                "The document may be completely blank or corrupted."
        );
    }

    return ocrText;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts plain text from a file based on mime type or file extension.
 * Supports: PDF (text + scanned), TXT, MD, JSON, CSV, etc.
 */
export async function extractTextFromFile(filePath, mimeType = "", originalName = "") {
    const ext = path.extname(originalName || filePath).toLowerCase();
    const isPDF =
        mimeType?.includes("pdf") || ext === ".pdf" || filePath?.toLowerCase().endsWith(".pdf");

    if (isPDF) {
        return await extractPDFText(filePath);
    }

    // Plain text files
    const raw = fs.readFileSync(filePath, "utf-8");
    return cleanExtractedText(raw);
}

/**
 * Ingests a document file for a user into MongoDB + Pinecone vector store.
 * Returns the created Document model instance.
 *
 * Supports:
 * - Text-based PDFs (pdf2json, instant)
 * - Scanned / handwritten PDFs (Gemini Vision OCR, ~10-30s for large docs)
 * - Plain text files (TXT, MD, JSON, CSV)
 */
export async function ingestDocument({ userId, title, originalName, mimeType, size, filePath, content }) {
    // 1. Extract text
    let text = content;
    if (!text && filePath) {
        text = await extractTextFromFile(filePath, mimeType, originalName);
    }

    if (!text || !text.trim()) {
        throw new Error("No readable text found in the document.");
    }

    // 2. Create Document record in MongoDB
    const doc = await DocumentModel.create({
        user: userId,
        title: title || originalName || "Untitled Document",
        originalName: originalName || "document.txt",
        mimeType: mimeType || "text/plain",
        size: size || Buffer.byteLength(text),
        status: "processing",
    });

    // 3. Chunk the text
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 80,
    });

    const textChunks = await splitter.splitText(text);

    if (textChunks.length === 0) {
        doc.status = "failed";
        await doc.save();
        throw new Error("Document could not be split into chunks.");
    }

    // 4. Deduplicate chunks — prevent identical repeated blocks from poisoning the store
    const uniqueChunks = [...new Map(textChunks.map((t) => [t.trim(), t])).values()];
    console.log(`[Ingestion] ${textChunks.length} raw chunks → ${uniqueChunks.length} unique after dedup`);

    // 5. Batch Embed and store (batch size: 10 with 200ms delay between batches)
    const BATCH_SIZE = 10;
    const chunkDocs = [];
    const pineconeRecords = [];

    for (let i = 0; i < uniqueChunks.length; i += BATCH_SIZE) {
        const batchTexts = uniqueChunks.slice(i, i + BATCH_SIZE);
        let batchVectors = [];

        try {
            batchVectors = await embeddings.embedDocuments(batchTexts);
        } catch (embedErr) {
            // Do NOT use zero vectors — they poison retrieval
            console.error(`[Ingestion] Embedding failed at batch ${i}: ${embedErr.message}`);
            doc.status = "failed";
            await doc.save();
            throw new Error(
                `Document embedding failed: ${embedErr.message}. ` +
                    `This is usually caused by API quota limits. Please try again in a few minutes.`
            );
        }

        for (let j = 0; j < batchTexts.length; j++) {
            const chunkIndex = i + j;
            const chunkText = batchTexts[j];
            const vector = batchVectors[j];

            // Skip zero/null vectors — safety guard
            if (!Array.isArray(vector) || vector.length === 0 || vector.every((v) => v === 0)) {
                console.warn(`[Ingestion] Skipping chunk ${chunkIndex} — zero/null vector.`);
                continue;
            }

            chunkDocs.push({
                document: doc._id,
                user: userId,
                text: chunkText,
                embedding: vector,
                chunkIndex,
                metadata: {
                    title: doc.title,
                    source: doc.originalName,
                },
            });

            pineconeRecords.push({
                id: `doc-${doc._id}-${chunkIndex}`,
                values: vector,
                metadata: {
                    documentId: String(doc._id),
                    userId: String(userId),
                    text: chunkText,
                    title: doc.title,
                    source: doc.originalName,
                    chunkIndex,
                },
            });
        }

        // 200ms pause between batches — prevents API rate limiting on large documents
        if (i + BATCH_SIZE < uniqueChunks.length) {
            await new Promise((res) => setTimeout(res, 200));
        }
    }

    await ChunkModel.insertMany(chunkDocs);

    // Optional Pinecone upsert (gracefully skipped if not configured)
    try {
        if (pineconeIndex) {
            await pineconeIndex.upsert({ records: pineconeRecords });
        }
    } catch (pineconeErr) {
        console.warn("[Pinecone] Upsert skipped:", pineconeErr.message);
    }

    // 6. Mark document as completed
    doc.chunkCount = uniqueChunks.length;
    doc.status = "completed";
    await doc.save();

    return doc;
}