import fs from "fs";
import DocumentModel, { ChunkModel } from "../models/document.model.js";
import { ingestDocument } from "../services/rag/ingestion.service.js";
import { retrieveDocuments } from "../services/rag/retrieval.service.js";

// ======================================================
// UPLOAD & INGEST DOCUMENT
// ======================================================
export async function uploadDocument(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please upload a PDF or text file.",
            });
        }

        const { originalname, mimetype, size, path: tempPath } = req.file;
        const customTitle = req.body.title || originalname;

        console.log(`[RAG Upload] File: "${originalname}" | Mime: ${mimetype} | Size: ${size} bytes | TempPath: ${tempPath}`);

        // Ingest into Mongo + vector store
        const document = await ingestDocument({
            userId: req.user.id,
            title: customTitle,
            originalName: originalname,
            mimeType: mimetype,
            size,
            filePath: tempPath,
        });

        // Clean up temporary disk file
        try {
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        } catch (cleanupErr) {
            console.warn("Temp file cleanup failed:", cleanupErr.message);
        }

        console.log(`[RAG Upload] Success: docId=${document._id} chunks=${document.chunkCount}`);

        res.status(201).json({
            success: true,
            message: "Document uploaded and indexed successfully",
            document,
        });
    } catch (error) {
        console.error("[RAG Upload] FAILED:", error.message);
        console.error(error.stack);

        // Clean up on error
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
        }

        res.status(500).json({
            success: false,
            message: error.message || "Failed to process document",
        });
    }
}

// ======================================================
// GET USER DOCUMENTS
// ======================================================
export async function getDocuments(req, res) {
    try {
        const documents = await DocumentModel.find({
            user: req.user.id,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            documents,
        });
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve documents",
        });
    }
}

// ======================================================
// DELETE DOCUMENT
// ======================================================
export async function deleteDocument(req, res) {
    try {
        const { docId } = req.params;

        const doc = await DocumentModel.findOneAndDelete({
            _id: docId,
            user: req.user.id,
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        // Delete all associated chunks
        await ChunkModel.deleteMany({
            document: docId,
            user: req.user.id,
        });

        res.status(200).json({
            success: true,
            message: "Document and vector index deleted successfully",
        });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete document",
        });
    }
}

// ======================================================
// QUERY DOCUMENTS DIRECTLY (RAG Test/Search Endpoint)
// ======================================================
export async function queryKnowledgeBase(req, res) {
    try {
        const { query, topK = 4 } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Query parameter is required",
            });
        }

        const results = await retrieveDocuments(query, req.user.id, Number(topK) || 4);

        res.status(200).json({
            success: true,
            results,
        });
    } catch (error) {
        console.error("Query knowledge base error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to query knowledge base",
        });
    }
}
