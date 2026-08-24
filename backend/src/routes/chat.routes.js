import { Router } from "express";

import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat,
    renameChat,
    togglePinChat,
    shareChat,
    shareMessage,
    getSharedChat,
    getSharedMessage,
} from "../controllers/chat.controller.js";

import { authUser } from "../middleware/auth.middleware.js";

const chatRouter = Router();


// =====================================================
// SEND MESSAGE
// POST /api/chats/message
// =====================================================

chatRouter.post(
    "/message",
    authUser,
    sendMessage
);


// =====================================================
// GET ALL CHATS
// GET /api/chats
// =====================================================

chatRouter.get(
    "/",
    authUser,
    getChats
);


// =====================================================
// GET MESSAGES
// GET /api/chats/:chatId/messages
// =====================================================

chatRouter.get(
    "/:chatId/messages",
    authUser,
    getMessages
);


// =====================================================
// DELETE CHAT
// DELETE /api/chats/delete/:chatId
// =====================================================

chatRouter.delete(
    "/delete/:chatId",
    authUser,
    deleteChat
);


// =====================================================
// RENAME CHAT
// PATCH /api/chats/:chatId/rename
// =====================================================

chatRouter.patch(
    "/:chatId/rename",
    authUser,
    renameChat
);


// =====================================================
// PIN / UNPIN CHAT
// PATCH /api/chats/:chatId/pin
// =====================================================

chatRouter.patch(
    "/:chatId/pin",
    authUser,
    togglePinChat
);


// =====================================================
// SHARE COMPLETE CHAT
// POST /api/chats/:chatId/share
// =====================================================

chatRouter.post(
    "/:chatId/share",
    authUser,
    shareChat
);

// =====================================================
// SHARE SPECIFIC MESSAGE
// POST /api/chats/message/:messageId/share
// =====================================================
chatRouter.post(
    "/message/:messageId/share",
    authUser,
    shareMessage
);

// =====================================================
// GET SHARED SPECIFIC MESSAGE
// GET /api/chats/share/message/:messageId
// PUBLIC
// =====================================================

chatRouter.get(
    "/share/message/:messageId",
    getSharedMessage
);


// =====================================================
// GET SHARED CHAT
// GET /api/chats/share/:chatId
// PUBLIC
// =====================================================

chatRouter.get(
    "/share/:chatId",
    getSharedChat
);

export default chatRouter;