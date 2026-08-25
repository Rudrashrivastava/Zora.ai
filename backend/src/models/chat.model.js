import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            default: "New Chat",
            trim: true,
        },

        // Pin / Unpin chat
        pinned: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

chatSchema.index({ user: 1, pinned: -1, updatedAt: -1 });

const chatModel = mongoose.model("Chat", chatSchema);

export default chatModel;