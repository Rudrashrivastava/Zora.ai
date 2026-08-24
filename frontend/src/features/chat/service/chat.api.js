import api from "../../../lib/axios.js";

// =====================================================
// CHAT APIS
// =====================================================

// Send message
export const sendMessage = async ({ message, chatId, signal }) => {
    const response = await api.post(
        "/api/chats/message",
        { message, chat: chatId },
        { signal }
    );
    return response.data;
};

// Get all chats
export const getChats = async () => {
    const response = await api.get("/api/chats");
    return response.data;
};

// Get messages
export const getMessages = async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}/messages`);
    return response.data;
};

// Delete chat
export const deleteChat = async (chatId) => {
    const response = await api.delete(`/api/chats/delete/${chatId}`);
    return response.data;
};

// Rename chat
export const renameChat = async ({ chatId, title }) => {
    const response = await api.patch(`/api/chats/${chatId}/rename`, { title });
    return response.data;
};

// Pin / Unpin chat
export const togglePinChat = async (chatId) => {
    const response = await api.patch(`/api/chats/${chatId}/pin`);
    return response.data;
};

// Create share link for complete chat
export const shareChat = async (chatId) => {
    const response = await api.post(`/api/chats/${chatId}/share`);
    return response.data;
};

// Create share link for specific message
export const shareMessage = async (messageId) => {
    const response = await api.post(`/api/chats/message/${messageId}/share`);
    return response.data;
};

// =====================================================
// RAG & DOCUMENT APIS
// =====================================================

// Upload document (PDF, TXT, MD, etc.)
export const uploadDocument = async (formData, onProgress) => {
    const response = await api.post("/api/rag/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
    });
    return response.data;
};

// Get uploaded documents
export const getDocuments = async () => {
    const response = await api.get("/api/rag/documents");
    return response.data;
};

// Delete document
export const deleteDocument = async (docId) => {
    const response = await api.delete(`/api/rag/documents/${docId}`);
    return response.data;
};

// Query knowledge base directly
export const queryKnowledgeBase = async ({ query, topK = 4 }) => {
    const response = await api.post("/api/rag/query", { query, topK });
    return response.data;
};

export default api;