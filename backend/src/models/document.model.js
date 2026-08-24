import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
    {
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            required: true,
        },
        chunkIndex: {
            type: Number,
            required: true,
        },
        metadata: {
            title: String,
            source: String,
            page: Number,
        },
    },
    { timestamps: true }
);

export const ChunkModel = mongoose.model("Chunk", chunkSchema);

const documentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            default: "text/plain",
        },
        size: {
            type: Number,
            default: 0,
        },
        chunkCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["processing", "completed", "failed"],
            default: "completed",
        },
    },
    { timestamps: true }
);

const DocumentModel = mongoose.model("Document", documentSchema);

export default DocumentModel;
