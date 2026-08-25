import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

// ======================================================
// SEND MESSAGE
// ======================================================
export async function sendMessage(req, res) {
    try {
        const { message, chat: chatId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Message content cannot be empty",
            });
        }

        let title = null;
        let chat = null;

        // ------------------------------------------
        // CREATE NEW CHAT IF NOT PROVIDED
        // ------------------------------------------
        if (!chatId) {
            title = await generateChatTitle(message);

            chat = await chatModel.create({
                user: req.user.id,
                title,
            });
        }

        const actualChatId = chatId || chat._id;

        // ------------------------------------------
        // CHECK CHAT OWNERSHIP
        // ------------------------------------------
        if (chatId) {
            chat = await chatModel.findOne({
                _id: chatId,
                user: req.user.id,
            });

            if (!chat) {
                return res.status(404).json({
                    message: "Chat not found",
                });
            }
        }

        // ------------------------------------------
        // USER MESSAGE
        // ------------------------------------------
        await messageModel.create({
            chat: actualChatId,
            content: message,
            role: "user",
        });

        // ------------------------------------------
        // GET PREVIOUS MESSAGES (for AI context)
        // ------------------------------------------
        const contextMessages = await messageModel
            .find({ chat: actualChatId })
            .sort({ createdAt: 1 });

        // ------------------------------------------
        // AI RESPONSE (with RAG + Web Search)
        // ------------------------------------------
        const { answer, sources } = await generateResponse(contextMessages, req.user.id);

        // ------------------------------------------
        // SAVE AI MESSAGE
        // ------------------------------------------
        await messageModel.create({
            chat: actualChatId,
            content: answer,
            role: "ai",
            sources: sources || [],
        });

        // ------------------------------------------
        // UPDATE CHAT TIMESTAMP
        // ------------------------------------------
        const updatedChat = await chatModel.findByIdAndUpdate(
            actualChatId,
            { updatedAt: new Date() },
            { new: true }
        );

        // ------------------------------------------
        // FETCH FULL MESSAGES (including AI reply & sources)
        // ------------------------------------------
        const allMessages = await messageModel
            .find({ chat: actualChatId })
            .sort({ createdAt: 1 });

        res.status(201).json({
            title,
            chat: updatedChat || chat,
            messages: allMessages,
        });
    } catch (error) {
        console.error("Send message error:", error);

        res.status(500).json({
            message: error.message || "Failed to send message",
        });
    }
}

// ======================================================
// GET ALL CHATS
// ======================================================
export async function getChats(req, res) {
    try {
        const chats = await chatModel
            .find({
                user: req.user.id,
            })
            .sort({
                pinned: -1,
                updatedAt: -1,
            });

        // Auto-repair legacy "New Chat" titles for chats that have user messages
        for (const chat of chats) {
            if (!chat.title || chat.title.toLowerCase() === "new chat" || chat.title.toLowerCase() === "new search") {
                const firstUserMsg = await messageModel
                    .findOne({ chat: chat._id, role: "user" })
                    .sort({ createdAt: 1 });
                if (firstUserMsg && firstUserMsg.content) {
                    const newTitle = await generateChatTitle(firstUserMsg.content);
                    if (newTitle && newTitle.toLowerCase() !== "new chat") {
                        chat.title = newTitle;
                        await chatModel.findByIdAndUpdate(chat._id, { title: newTitle });
                    }
                }
            }
        }

        res.status(200).json({
            message: "Chats retrieved successfully",
            chats,
        });
    } catch (error) {
        console.error("Get chats error:", error);

        res.status(500).json({
            message: "Failed to retrieve chats",
        });
    }
}

// ======================================================
// GET MESSAGES
// ======================================================
export async function getMessages(req, res) {
    try {
        const { chatId } = req.params;

        const chat = await chatModel.findOne({
            _id: chatId,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
            });
        }

        const messages = await messageModel
            .find({
                chat: chatId,
            })
            .sort({
                createdAt: 1,
            });

        res.status(200).json({
            message: "Messages retrieved successfully",
            messages,
        });
    } catch (error) {
        console.error("Get messages error:", error);

        res.status(500).json({
            message: "Failed to retrieve messages",
        });
    }
}

// ======================================================
// DELETE CHAT
// ======================================================
export async function deleteChat(req, res) {
    try {
        const { chatId } = req.params;

        const chat = await chatModel.findOneAndDelete({
            _id: chatId,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
            });
        }

        // Delete all messages
        await messageModel.deleteMany({
            chat: chatId,
        });

        res.status(200).json({
            message: "Chat deleted successfully",
        });
    } catch (error) {
        console.error("Delete chat error:", error);

        res.status(500).json({
            message: "Failed to delete chat",
        });
    }
}

// ======================================================
// RENAME CHAT
// ======================================================
export async function renameChat(req, res) {
    try {
        const { chatId } = req.params;
        const { title } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Chat title is required",
            });
        }

        const chat = await chatModel.findOneAndUpdate(
            {
                _id: chatId,
                user: req.user.id,
            },
            {
                title: title.trim(),
                updatedAt: new Date(),
            },
            {
                new: true,
            }
        );

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
            });
        }

        res.status(200).json({
            message: "Chat renamed successfully",
            chat,
        });
    } catch (error) {
        console.error("Rename chat error:", error);

        res.status(500).json({
            message: "Failed to rename chat",
        });
    }
}

// ======================================================
// PIN / UNPIN CHAT
// ======================================================
export async function togglePinChat(req, res) {
    try {
        const { chatId } = req.params;

        const chat = await chatModel.findOne({
            _id: chatId,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
            });
        }

        chat.pinned = !chat.pinned;
        chat.updatedAt = new Date();

        await chat.save();

        res.status(200).json({
            message: chat.pinned ? "Chat pinned successfully" : "Chat unpinned successfully",
            chat,
        });
    } catch (error) {
        console.error("Toggle pin error:", error);

        res.status(500).json({
            message: "Failed to update pin",
        });
    }
}

// ======================================================
// SHARE CHAT
// ======================================================
export async function shareChat(req, res) {
    try {
        const { chatId } = req.params;

        const chat = await chatModel.findOne({
            _id: chatId,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found",
            });
        }

        const reqOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
        let frontendUrl = reqOrigin;
        if (!frontendUrl || frontendUrl.includes("localhost")) {
            if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost")) {
                frontendUrl = process.env.FRONTEND_URL;
            } else if (!frontendUrl) {
                frontendUrl = "https://zora-ai-jew7.onrender.com";
            }
        }
        const sharePath = `/shared/chat/${chat._id}`;
        const shareUrl = `${frontendUrl}${sharePath}`;

        res.status(200).json({
            message: "Chat share link created",
            shareUrl,
            sharePath,
        });
    } catch (error) {
        console.error("Share chat error:", error);

        res.status(500).json({
            message: "Failed to share chat",
        });
    }
}

// ======================================================
// SHARE SPECIFIC MESSAGE
// ======================================================
export async function shareMessage(req, res) {
    try {
        const { messageId } = req.params;

        const message = await messageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: "Message not found",
            });
        }

        const chat = await chatModel.findOne({
            _id: message.chat,
            user: req.user.id,
        });

        if (!chat) {
            return res.status(403).json({
                message: "You do not have permission to share this message",
            });
        }

        const reqOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
        let frontendUrl = reqOrigin;
        if (!frontendUrl || frontendUrl.includes("localhost")) {
            if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost")) {
                frontendUrl = process.env.FRONTEND_URL;
            } else if (!frontendUrl) {
                frontendUrl = "https://zora-ai-jew7.onrender.com";
            }
        }
        const sharePath = `/shared/message/${message._id}`;
        const shareUrl = `${frontendUrl}${sharePath}`;

        res.status(200).json({
            message: "Message share link created",
            shareUrl,
            sharePath,
        });
    } catch (error) {
        console.error("Share message error:", error);

        res.status(500).json({
            message: "Failed to share message",
        });
    }
}

// ======================================================
// GET SHARED CHAT (PUBLIC)
// ======================================================
export async function getSharedChat(req, res) {
    try {
        const { chatId } = req.params;

        if (!chatId) {
            return res.status(400).json({
                message: "Chat ID is required",
            });
        }

        const chat = await chatModel.findById(chatId).select("_id title createdAt updatedAt");

        if (!chat) {
            return res.status(404).json({
                message: "Shared conversation not found",
            });
        }

        const messages = await messageModel
            .find({
                chat: chatId,
            })
            .select("_id content role sources createdAt")
            .sort({
                createdAt: 1,
            });

        res.status(200).json({
            message: "Shared conversation retrieved successfully",
            chat: {
                _id: chat._id,
                title: chat.title,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                messages,
            },
        });
    } catch (error) {
        console.error("Get shared chat error:", error);

        res.status(500).json({
            message: "Failed to retrieve shared conversation",
        });
    }
}

// ======================================================
// GET SHARED MESSAGE (PUBLIC)
// ======================================================
export async function getSharedMessage(req, res) {
    try {
        const { messageId } = req.params;

        if (!messageId) {
            return res.status(400).json({
                message: "Message ID is required",
            });
        }

        const message = await messageModel.findById(messageId);

        if (!message) {
            return res.status(404).json({
                message: "Shared message not found",
            });
        }

        const chat = await chatModel.findById(message.chat).select("title");

        res.status(200).json({
            message: "Shared message retrieved successfully",
            chatTitle: chat ? chat.title : "Shared Message",
            sharedMessage: {
                _id: message._id,
                content: message.content,
                role: message.role,
                sources: message.sources || [],
                createdAt: message.createdAt,
            },
        });
    } catch (error) {
        console.error("Get shared message error:", error);
        res.status(500).json({
            message: "Failed to retrieve shared message",
        });
    }
}