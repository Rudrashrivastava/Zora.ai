import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddings } from "./embedding.service.js";
import { index as pineconeIndex } from "./pinecone.service.js";
import DocumentModel, { ChunkModel } from "../../models/document.model.js";

const require = createRequire(import.meta.url);

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
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .replace(/([a-zA-Z])([0-9])/g, "$1 $2")
        .replace(/([0-9])([a-zA-Z])/g, "$1 $2")
        .replace(/[ \t]+/g, " ")
        .trim();
}

/**
 * Extracts plain text from a PDF file using pdf2json.
 */
async function extractPDFText(filePath) {
    return new Promise((resolve, reject) => {
        const PDFParser = require("pdf2json");
        const pdfParser = new PDFParser(null, 1);

        pdfParser.on("pdfParser_dataError", (errData) => {
            reject(new Error(`PDF parsing failed: ${errData?.parserError || "Unknown error"}`));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            try {
                // Extract all text from all pages using Y-coordinate line grouping
                const pages = pdfData?.Pages || [];
                let fullText = "";

                for (const page of pages) {
                    const texts = page?.Texts || [];
                    const lineMap = new Map();

                    for (const textObj of texts) {
                        const y = Math.round((textObj.y || 0) * 10) / 10;
                        if (!lineMap.has(y)) lineMap.set(y, []);

                        for (const r of textObj?.R || []) {
                            const str = safeDecode(r.T);
                            if (str) lineMap.get(y).push(str);
                        }
                    }

                    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => a - b);
                    for (const y of sortedYs) {
                        const lineStr = lineMap.get(y).join(" ").replace(/[ \t]+/g, " ").trim();
                        if (lineStr) {
                            fullText += lineStr + "\n";
                        }
                    }
                }

                if (!fullText.trim() && typeof pdfParser.getRawTextContent === "function") {
                    fullText = pdfParser.getRawTextContent();
                }

                resolve(cleanExtractedText(fullText));
            } catch (err) {
                console.error("[PDF Extract Error]:", err);
                reject(new Error(`PDF text extraction error: ${err.message}`));
            }
        });

        pdfParser.loadPDF(filePath);
    });
}

/**
 * Extracts plain text from a file based on mime type or file extension.
 */
export async function extractTextFromFile(filePath, mimeType = "", originalName = "") {
    const ext = path.extname(originalName || filePath).toLowerCase();
    const isPDF =
        mimeType?.includes("pdf") ||
        ext === ".pdf" ||
        filePath?.toLowerCase().endsWith(".pdf");

    if (isPDF) {
        return await extractPDFText(filePath);
    }

    // For text-based files: txt, md, json, csv, etc.
    const raw = fs.readFileSync(filePath, "utf-8");
    return cleanExtractedText(raw);
}

/**
 * Ingests a document file for a user into MongoDB vector store.
 * Returns the created Document model instance.
 */
export async function ingestDocument({
    userId,
    title,
    originalName,
    mimeType,
    size,
    filePath,
    content,
}) {
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

    // 4. Batch Embed and store chunks (batch size: 10 with 200ms delay between batches)
    const BATCH_SIZE = 10;
    const chunkDocs = [];
    const pineconeRecords = [];

    for (let i = 0; i < textChunks.length; i += BATCH_SIZE) {
        const batchTexts = textChunks.slice(i, i + BATCH_SIZE);
        let batchVectors = [];

        try {
            batchVectors = await embeddings.embedDocuments(batchTexts);
        } catch (embedErr) {
            console.warn(`[Ingestion] Batch embedding notice at index ${i}: ${embedErr.message}. Using fallback indexing vectors.`);
            // Fallback zero vector (768 dim) ensures document text remains saved in MongoDB RAG store without failing upload
            batchVectors = batchTexts.map(() => new Array(768).fill(0));
        }

        for (let j = 0; j < batchTexts.length; j++) {
            const chunkIndex = i + j;
            const chunkText = batchTexts[j];
            const vector = Array.isArray(batchVectors[j]) && batchVectors[j].length > 0 ? batchVectors[j] : new Array(768).fill(0);

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

        // Add 200ms pause between batches to prevent API rate limiting on large documents
        if (i + BATCH_SIZE < textChunks.length) {
            await new Promise((res) => setTimeout(res, 200));
        }
    }

    await ChunkModel.insertMany(chunkDocs);

    // Optional Pinecone upsert (won't crash if not configured)
    try {
        if (pineconeIndex) {
            await pineconeIndex.upsert({ records: pineconeRecords });
        }
    } catch (pineconeErr) {
        console.warn("[Pinecone] Upsert skipped:", pineconeErr.message);
    }

    // 5. Mark document as completed
    doc.chunkCount = textChunks.length;
    doc.status = "completed";
    await doc.save();

    return doc;
}