import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import chatRouter from "./routes/chat.routes.js";
import ragRouter from "./routes/rag.routes.js";
import pdfRouter from "./routes/pdf.routes.js";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy (Nginx / Kubernetes Ingress / Render) for rate limiting & IP extraction
app.set("trust proxy", 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Production-ready CORS setup
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:80"];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, true); // Fallback allow in dev/staging
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
);

// Kubernetes Liveness Probe: Quick process check
app.get("/healthz", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Kubernetes Readiness Probe: Verify DB connection
app.get("/readyz", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
        return res.status(200).json({ status: "ready", database: "connected" });
    }
    return res.status(503).json({ status: "not_ready", database: "disconnected" });
});

// App Routes
app.use("/api/auth", authRouter);
app.use("/api/chats", chatRouter);
app.use("/api/rag", ragRouter);
app.use("/api/pdf", pdfRouter);

// Serve Production React Build (Single-Server Deployment e.g., Render / Single VPS)
const frontendDistPath = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api") || req.path.startsWith("/healthz") || req.path.startsWith("/readyz") || req.path.startsWith("/socket.io")) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
} else {
    // Root API fallback if dist is not present
    app.get("/", (req, res) => {
        res.json({ message: "Zora.ai API Server is running", status: "ok" });
    });
}

export default app;