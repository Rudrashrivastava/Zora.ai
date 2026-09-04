import { useRef, useCallback } from "react";
import { useDispatch } from "react-redux";

import {
    initializeSocketConnection,
} from "../service/chat.socket";

import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat,
    renameChat,
    togglePinChat,
    shareChat,
    shareMessage,
    uploadDocument,
    getDocuments,
    deleteDocument,
} from "../service/chat.api";

import {
    mergeChats,
    setCurrentChatId,
    setError,
    setLoading,
    createNewChat,
    addMessages,
    renameChatLocal,
    togglePinLocal,
    removeChat,
    setDocuments,
    addDocument,
    removeDocumentLocal,
    setUploading,
    setUploadProgress,
} from "../chat.slice";

export const useChat = () => {
    const dispatch = useDispatch();

    // Reference to hold current AbortController for stopping requests
    const abortControllerRef = useRef(null);

    // =====================================================
    // STOP GENERATION
    // =====================================================
    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            dispatch(setLoading(false));
            console.log("Message generation stopped by user.");
        }
    }, [dispatch]);

    // =====================================================
    // SEND MESSAGE
    // =====================================================
    const handleSendMessage = useCallback(
        async ({ message, chatId }) => {
            try {
                dispatch(setLoading(true));
                dispatch(setError(null));

                abortControllerRef.current = new AbortController();

                const data = await sendMessage({
                    message,
                    chatId,
                    signal: abortControllerRef.current.signal,
                });

                const { chat, messages } = data || {};
                const rawChatId = chatId || chat?._id || chat?.id;

                if (!rawChatId) {
                    throw new Error("Chat ID was not returned by server");
                }

                const actualChatId = String(rawChatId);

                // CREATE OR UPDATE CHAT IN REDUX
                dispatch(
                    createNewChat({
                        chatId: actualChatId,
                        title: chat?.title || data?.title || "New Search",
                    })
                );

                if (chat?.title || data?.title) {
                    dispatch(
                        renameChatLocal({
                            chatId: actualChatId,
                            title: chat?.title || data?.title,
                        })
                    );
                }

                // SYNC MESSAGES (including sources)
                if (messages && messages.length > 0) {
                    const formattedMessages = messages.map((msg) => ({
                        id: String(msg._id || msg.id),
                        content: msg.content,
                        role: msg.role,
                        sources: msg.sources || [],
                        createdAt: msg.createdAt,
                    }));

                    dispatch(
                        addMessages({
                            chatId: actualChatId,
                            messages: formattedMessages,
                        })
                    );
                }

                // OPEN CHAT
                dispatch(setCurrentChatId(actualChatId));

                return data;
            } catch (error) {
                if (error.name === "AbortError" || error.message === "canceled" || error.code === "ERR_CANCELED") {
                    console.log("Request was successfully aborted.");
                    return;
                }

                console.error("Send message error:", error);
                dispatch(
                    setError(
                        error.response?.data?.message ||
                        error.message ||
                        "Failed to send message"
                    )
                );
                throw error;
            } finally {
                dispatch(setLoading(false));
                abortControllerRef.current = null;
            }
        },
        [dispatch]
    );

    // =====================================================
    // GET ALL CHATS
    // =====================================================
    const handleGetChats = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));

            const data = await getChats();
            const chats = data?.chats || [];

            const chatList = chats.map((chat) => ({
                id: chat._id,
                title: chat.title || "New Chat",
                pinned: chat.pinned || false,
                lastUpdated: chat.updatedAt || chat.createdAt || new Date().toISOString(),
            }));

            dispatch(mergeChats(chatList));
        } catch (error) {
            console.error("Get chats error:", error);
            dispatch(
                setError(
                    error.response?.data?.message || "Failed to fetch chats"
                )
            );
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    // =====================================================
    // OPEN CHAT
    // =====================================================
    const handleOpenChat = useCallback(
        async (chatId, chats) => {
            try {
                if (!chatId) return;

                dispatch(setCurrentChatId(chatId));

                const existingMessages = chats?.[chatId]?.messages || [];

                if (existingMessages.length === 0) {
                    dispatch(setLoading(true));

                    const data = await getMessages(chatId);
                    const messages = data?.messages || [];

                    const formattedMessages = messages.map((msg) => ({
                        id: msg._id,
                        content: msg.content,
                        role: msg.role,
                        sources: msg.sources || [],
                        createdAt: msg.createdAt,
                    }));

                    dispatch(
                        addMessages({
                            chatId,
                            messages: formattedMessages,
                        })
                    );
                }
            } catch (error) {
                console.error("Open chat error:", error);
                dispatch(
                    setError(
                        error.response?.data?.message || "Failed to open chat"
                    )
                );
            } finally {
                dispatch(setLoading(false));
            }
        },
        [dispatch]
    );

    // =====================================================
    // CREATE NEW CHAT
    // =====================================================
    const handleCreateChat = useCallback(() => {
        dispatch(setCurrentChatId(null));
        dispatch(setError(null));
        return null;
    }, [dispatch]);

    // =====================================================
    // RENAME CHAT
    // =====================================================
    const handleRenameChat = useCallback(
        async (chatId, title) => {
            try {
                if (!chatId) throw new Error("Chat ID is required");

                const cleanTitle = title?.trim();
                if (!cleanTitle) throw new Error("Chat title cannot be empty");

                const data = await renameChat({
                    chatId,
                    title: cleanTitle,
                });

                dispatch(
                    renameChatLocal({
                        chatId,
                        title: data?.chat?.title || data?.title || cleanTitle,
                    })
                );

                return data;
            } catch (error) {
                console.error("Rename chat error:", error);
                dispatch(
                    setError(
                        error.response?.data?.message ||
                        error.message ||
                        "Failed to rename chat"
                    )
                );
                throw error;
            }
        },
        [dispatch]
    );

    // =====================================================
    // PIN / UNPIN CHAT
    // =====================================================
    const handleTogglePinChat = useCallback(
        async (chatId) => {
            try {
                if (!chatId) throw new Error("Chat ID is required");

                const data = await togglePinChat(chatId);
                dispatch(togglePinLocal(chatId));

                return data;
            } catch (error) {
                console.error("Toggle pin error:", error);
                dispatch(
                    setError(
                        error.response?.data?.message ||
                        error.message ||
                        "Failed to update pin"
                    )
                );
                throw error;
            }
        },
        [dispatch]
    );

    // =====================================================
    // DELETE CHAT
    // =====================================================
    const handleDeleteChat = useCallback(
        async (chatId) => {
            try {
                if (!chatId) throw new Error("Chat ID is required");

                await deleteChat(chatId);

                dispatch(removeChat(chatId));
                dispatch(setCurrentChatId(null));

                return true;
            } catch (error) {
                console.error("Delete chat error:", error);
                dispatch(
                    setError(
                        error.response?.data?.message ||
                        error.message ||
                        "Failed to delete chat"
                    )
                );
                throw error;
            }
        },
        [dispatch]
    );

    // =====================================================
    // SHARE CHAT
    // =====================================================
    const handleShareChat = useCallback(
        async (chatId) => {
            try {
                if (!chatId || chatId === "null" || chatId === "undefined") {
                    throw new Error("Please select or start a chat first before sharing.");
                }

                const data = await shareChat(chatId);
                const shareUrl = data?.shareUrl;

                if (!shareUrl) throw new Error("Share URL was not returned by server");

                return { ...data, shareUrl };
            } catch (error) {
                console.error("Share chat error:", error);
                const errMsg = error.response?.data?.message || error.message || "";
                const isRateLimitOrNetwork = /429|quota|rate limit|unavailable|enotfound|etimedout|network/i.test(errMsg);

                dispatch(
                    setError(
                        isRateLimitOrNetwork
                            ? "⚠️ All AI providers are temporarily unavailable (quota limits or network issue). Please try again in a few minutes."
                            : errMsg || "Failed to share chat"
                    )
                );
                throw error;
            }
        },
        [dispatch]
    );

    // =====================================================
    // SHARE MESSAGE
    // =====================================================
    const handleShareMessage = useCallback(
        async (messageId) => {
            try {
                if (!messageId || messageId === "null" || messageId === "undefined") {
                    throw new Error("Message ID is required");
                }

                const data = await shareMessage(messageId);
                return data;
            } catch (error) {
                console.error("Share message error:", error);
                const errMsg = error.response?.data?.message || error.message || "";
                const isRateLimitOrNetwork = /429|quota|rate limit|unavailable|enotfound|etimedout|network/i.test(errMsg);

                dispatch(
                    setError(
                        isRateLimitOrNetwork
                            ? "⚠️ All AI providers are temporarily unavailable (quota limits or network issue). Please try again in a few minutes."
                            : errMsg || "Failed to share message"
                    )
                );
                throw error;
            }
        },
        [dispatch]
    );

    // =====================================================
    // RAG DOCUMENT HANDLERS
    // =====================================================
    const handleUploadDocument = useCallback(
        async (file, title) => {
            try {
                dispatch(setUploading(true));
                dispatch(setUploadProgress(0));
                dispatch(setError(null));

                const formData = new FormData();
                formData.append("file", file);
                if (title) formData.append("title", title);

                const data = await uploadDocument(formData, (progress) => {
                    dispatch(setUploadProgress(progress));
                });

                if (data?.document) {
                    dispatch(addDocument(data.document));
                }

                return data;
            } catch (error) {
                console.error("Upload document error:", error);
                const errMsg = error.response?.data?.message || error.message || "";
                const isRateLimitOrNetwork = /429|quota|rate limit|unavailable|enotfound|etimedout|network/i.test(errMsg);

                dispatch(
                    setError(
                        isRateLimitOrNetwork
                            ? "⚠️ All AI providers are temporarily unavailable (quota limits or network issue). Please try again in a few minutes."
                            : errMsg || "Failed to upload document"
                    )
                );
                throw error;
            } finally {
                dispatch(setUploading(false));
                dispatch(setUploadProgress(0));
            }
        },
        [dispatch]
    );

    const handleGetDocuments = useCallback(async () => {
        try {
            const data = await getDocuments();
            if (data?.documents) {
                dispatch(setDocuments(data.documents));
            }
            return data?.documents || [];
        } catch (error) {
            console.error("Get documents error:", error);
            return [];
        }
    }, [dispatch]);

    const handleDeleteDocument = useCallback(
        async (docId) => {
            try {
                if (!docId) return;
                await deleteDocument(docId);
                dispatch(removeDocumentLocal(docId));
                return true;
            } catch (error) {
                console.error("Delete document error:", error);
                dispatch(
                    setError(
                        error.response?.data?.message || "Failed to delete document"
                    )
                );
                throw error;
            }
        },
        [dispatch]
    );

    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleCreateChat,
        handleRenameChat,
        handleTogglePinChat,
        handleDeleteChat,
        handleShareChat,
        handleShareMessage,
        handleUploadDocument,
        handleGetDocuments,
        handleDeleteDocument,
        stopGeneration,
    };
};