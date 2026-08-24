import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",

    initialState: {
        chats: {},
        currentChatId: null,
        isLoading: false,
        error: null,
        documents: [],
        isUploading: false,
        uploadProgress: 0,
    },

    reducers: {
        // =========================================
        // CREATE NEW CHAT
        // =========================================
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload;

            state.chats[chatId] = {
                id: chatId,
                title: title || "New Chat",
                messages: [],
                pinned: false,
                lastUpdated: new Date().toISOString(),
            };
        },

        // =========================================
        // ADD MESSAGE
        // =========================================
        addNewMessage: (state, action) => {
            const { chatId, content, role, id, sources } = action.payload;

            if (!state.chats[chatId]) {
                return;
            }

            state.chats[chatId].messages.push({
                id: id || `${Date.now()}-${Math.random()}`,
                content,
                role,
                sources: sources || [],
            });

            state.chats[chatId].lastUpdated = new Date().toISOString();
        },

        // =========================================
        // ADD MESSAGES
        // =========================================
        addMessages: (state, action) => {
            const { chatId, messages } = action.payload;

            if (!state.chats[chatId]) {
                return;
            }

            state.chats[chatId].messages = messages;
            state.chats[chatId].lastUpdated = new Date().toISOString();
        },

        // =========================================
        // SET CHATS
        // =========================================
        setChats: (state, action) => {
            state.chats = action.payload;
        },

        // =========================================
        // MERGE CHATS (refresh list without wiping messages)
        // =========================================
        mergeChats: (state, action) => {
            const incoming = action.payload;
            const next = {};
            for (const chat of incoming) {
                next[chat.id] = {
                    ...chat,
                    // Preserve already-loaded messages so they don't disappear
                    messages: state.chats[chat.id]?.messages || [],
                };
            }
            state.chats = next;
        },

        // =========================================
        // CURRENT CHAT
        // =========================================
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload;
        },

        // =========================================
        // LOADING
        // =========================================
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },

        // =========================================
        // ERROR
        // =========================================
        setError: (state, action) => {
            state.error = action.payload;
        },

        // =========================================
        // RENAME CHAT
        // =========================================
        renameChatLocal: (state, action) => {
            const { chatId, title } = action.payload;

            if (state.chats[chatId]) {
                state.chats[chatId].title = title;
            }
        },

        // =========================================
        // PIN CHAT
        // =========================================
        togglePinLocal: (state, action) => {
            const chatId = action.payload;

            if (state.chats[chatId]) {
                state.chats[chatId].pinned = !state.chats[chatId].pinned;
            }
        },

        // =========================================
        // DELETE CHAT LOCAL
        // =========================================
        removeChat: (state, action) => {
            const chatId = action.payload;

            delete state.chats[chatId];

            if (state.currentChatId === chatId) {
                state.currentChatId = null;
            }
        },

        // =========================================
        // RAG DOCUMENTS MANAGEMENT
        // =========================================
        setDocuments: (state, action) => {
            state.documents = action.payload || [];
        },

        addDocument: (state, action) => {
            state.documents.unshift(action.payload);
        },

        removeDocumentLocal: (state, action) => {
            const docId = action.payload;
            state.documents = state.documents.filter((d) => d._id !== docId && d.id !== docId);
        },

        setUploading: (state, action) => {
            state.isUploading = action.payload;
        },

        setUploadProgress: (state, action) => {
            state.uploadProgress = action.payload;
        },

        // =========================================
        // CLEAR ERROR
        // =========================================
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    setChats,
    mergeChats,
    setCurrentChatId,
    setLoading,
    setError,
    createNewChat,
    addNewMessage,
    addMessages,
    renameChatLocal,
    togglePinLocal,
    removeChat,
    setDocuments,
    addDocument,
    removeDocumentLocal,
    setUploading,
    setUploadProgress,
    clearError,
} = chatSlice.actions;

export default chatSlice.reducer;