import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true,
        },

        content: {
            type: String,
            required: true,
        },

        role: {
            type: String,
            enum: ["user", "ai"],
            required: true,
        },

        sources: [
            {
                title: { type: String, default: "" },
                url: { type: String, default: "" },
                snippet: { type: String, default: "" },
                type: { type: String, enum: ["web", "document"], default: "web" },
                source: { type: String, default: "" },
                score: { type: Number },
            },
        ],
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ chat: 1, createdAt: 1 });

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;