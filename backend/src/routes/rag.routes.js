import { Router } from "express";
import multer from "multer";
import path from "path";
import os from "os";
import {
    uploadDocument,
    getDocuments,
    deleteDocument,
    queryKnowledgeBase,
} from "../controllers/rag.controller.js";
import { authUser } from "../middleware/auth.middleware.js";

const ragRouter = Router();

// Multer temporary disk storage
const upload = multer({
    dest: os.tmpdir(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = [".pdf", ".txt", ".md", ".json", ".csv", ".docx"];
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeOk =
            file.mimetype.includes("pdf") ||
            file.mimetype.includes("text") ||
            file.mimetype.includes("json") ||
            file.mimetype === "application/octet-stream" ||
            file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        if (allowedExtensions.includes(ext) || mimeOk) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype} (${ext}). Allowed: PDF, TXT, MD, JSON, CSV, DOCX.`));
        }
    },
});

// Middleware to handle Multer errors explicitly (otherwise they become 500)
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        console.error("[Multer] Error:", err.code, err.message);
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ success: false, message: "File too large. Max 20MB allowed." });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
        console.error("[Upload] Filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
}

// Upload and ingest document
ragRouter.post(
    "/upload",
    authUser,
    (req, res, next) => {
        upload.single("file")(req, res, (err) => {
            if (err) return handleMulterError(err, req, res, next);
            next();
        });
    },
    uploadDocument
);

// Get all uploaded documents
ragRouter.get("/documents", authUser, getDocuments);

// Delete document
ragRouter.delete("/documents/:docId", authUser, deleteDocument);

// Direct vector query / test endpoint
ragRouter.post("/query", authUser, queryKnowledgeBase);

export default ragRouter;
