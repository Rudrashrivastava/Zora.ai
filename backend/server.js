import "dotenv/config";
import app from "./src/app.js";
import http from "http";
import mongoose from "mongoose";
import connectDB from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer(app);

initSocket(httpServer);

connectDB()
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });

const server = httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handling for Docker & Kubernetes
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        console.log("HTTP server closed.");
        try {
            await mongoose.connection.close(false);
            console.log("MongoDB connection closed.");
            process.exit(0);
        } catch (err) {
            console.error("Error closing MongoDB connection:", err);
            process.exit(1);
        }
    });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));