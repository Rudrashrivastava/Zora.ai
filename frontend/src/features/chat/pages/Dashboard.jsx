import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../auth/auth.slice";

import { useChat } from "../hooks/useChat";

// ======================================================
// ICONS & LOGOS
// ======================================================

const ZoraLogo = ({ size = 40, stops = ["#22d3ee", "#3b82f6", "#8b5cf6"] }) => (
    <div
        className="flex shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 shadow-inner"
        style={{ width: size, height: size }}
    >
        <svg
            width="70%"
            height="70%"
            viewBox="0 0 100 100"
            fill="none"
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
        >
            <defs>
                <linearGradient id={`zoraGrad-${stops[0].replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={stops[0]} />
                    <stop offset="50%" stopColor={stops[1]} />
                    <stop offset="100%" stopColor={stops[2]} />
                </linearGradient>
            </defs>
            <path
                d="M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z"
                fill={`url(#zoraGrad-${stops[0].replace("#", "")})`}
                opacity="0.15"
                stroke={`url(#zoraGrad-${stops[0].replace("#", "")})`}
                strokeWidth="3"
            />
            <path
                d="M32 32 H68 L32 68 H68"
                stroke={`url(#zoraGrad-${stops[0].replace("#", "")})`}
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="50" cy="50" r="5" fill="#ffffff" className="animate-ping" style={{ transformOrigin: "center" }} />
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
        </svg>
    </div>
);

const StopIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

const MoreIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>;
const CopyIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const ShareIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
const PinIcon = ({ filled = false }) => <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M12 17v5" /><path d="M5 3h14" /><path d="M7 3v6l-2 3h14l-2-3V3" /></svg>;
const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>;
const EditIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
const MenuIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>;
const PaperclipIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const BookOpenIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const GlobeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const FileTextIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const ExternalLinkIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const PaletteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.75 1.7-1.7 0-.46-.19-.88-.49-1.18-.3-.3-.49-.72-.49-1.18 0-.94.77-1.7 1.7-1.7h2.64c3.04 0 5.5-2.46 5.5-5.5 0-4.96-4.49-8.74-10.56-8.74Z" />
    </svg>
);
const ChevronDownIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// ======================================================
// COLOR THEMES DICTIONARY
// ======================================================

const THEMES = {
    cyan: {
        id: "cyan",
        name: "Cyber Cyan",
        accentText: "text-cyan-400",
        accentBorder: "border-cyan-500/40",
        focusBorder: "focus-within:border-cyan-500/50",
        hoverBorder: "hover:border-cyan-400/50",
        badgeBg: "bg-cyan-950/60",
        badgeBorder: "border-cyan-500/40",
        badgeText: "text-cyan-300",
        colorDot: "bg-cyan-400",
        gradientH1: "from-white via-cyan-100 to-cyan-400",
        logoStops: ["#22d3ee", "#3b82f6", "#8b5cf6"],
    },
    emerald: {
        id: "emerald",
        name: "Emerald Green",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-500/40",
        focusBorder: "focus-within:border-emerald-500/50",
        hoverBorder: "hover:border-emerald-400/50",
        badgeBg: "bg-emerald-950/60",
        badgeBorder: "border-emerald-500/40",
        badgeText: "text-emerald-300",
        colorDot: "bg-emerald-400",
        gradientH1: "from-white via-emerald-100 to-emerald-400",
        logoStops: ["#10b981", "#059669", "#047857"],
    },
    violet: {
        id: "violet",
        name: "Royal Violet",
        accentText: "text-purple-400",
        accentBorder: "border-purple-500/40",
        focusBorder: "focus-within:border-purple-500/50",
        hoverBorder: "hover:border-purple-400/50",
        badgeBg: "bg-purple-950/60",
        badgeBorder: "border-purple-500/40",
        badgeText: "text-purple-300",
        colorDot: "bg-purple-400",
        gradientH1: "from-white via-purple-100 to-purple-400",
        logoStops: ["#a855f7", "#7c3aed", "#6d28d9"],
    },
    amber: {
        id: "amber",
        name: "Amber Sunset",
        accentText: "text-amber-400",
        accentBorder: "border-amber-500/40",
        focusBorder: "focus-within:border-amber-500/50",
        hoverBorder: "hover:border-amber-400/50",
        badgeBg: "bg-amber-950/60",
        badgeBorder: "border-amber-500/40",
        badgeText: "text-amber-300",
        colorDot: "bg-amber-400",
        gradientH1: "from-white via-amber-100 to-amber-400",
        logoStops: ["#f59e0b", "#d97706", "#b45309"],
    },
    rose: {
        id: "rose",
        name: "Crimson Rose",
        accentText: "text-rose-400",
        accentBorder: "border-rose-500/40",
        focusBorder: "focus-within:border-rose-500/50",
        hoverBorder: "hover:border-rose-400/50",
        badgeBg: "bg-rose-950/60",
        badgeBorder: "border-rose-500/40",
        badgeText: "text-rose-300",
        colorDot: "bg-rose-400",
        gradientH1: "from-white via-rose-100 to-rose-400",
        logoStops: ["#f43f5e", "#e11d48", "#be123c"],
    },
};

// ======================================================
// TYPING DOTS
// ======================================================

const TypingDots = ({ colorDot = "bg-cyan-400" }) => (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
        <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${colorDot} animate-bounce [animation-delay:0ms]`} />
            <div className={`h-2 w-2 rounded-full ${colorDot} animate-bounce [animation-delay:150ms]`} />
            <div className={`h-2 w-2 rounded-full ${colorDot} animate-bounce [animation-delay:300ms]`} />
        </div>
        <span className="text-xs text-zinc-400">Searching web & analyzing knowledge base...</span>
    </div>
);

// ======================================================
// COPY HELPER
// ======================================================

async function copyTextFallback(text) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {}
    try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
    } catch (_) {
        return false;
    }
}

// ======================================================
// SOURCES CAROUSEL / GRID COMPONENT
// ======================================================

const SourcesSection = ({ sources = [] }) => {
    const [expandedSnippet, setExpandedSnippet] = useState(null);

    if (!sources || sources.length === 0) return null;

    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <GlobeIcon />
                <span>Sources & Citations ({sources.length})</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((src, idx) => {
                    const isDoc = src.type === "document";
                    let hostname = "";
                    if (src.url) {
                        try {
                            hostname = new URL(src.url).hostname.replace("www.", "");
                        } catch (_) {
                            hostname = src.url;
                        }
                    }

                    return (
                        <div
                            key={idx}
                            className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-cyan-400/40 hover:bg-white/[0.06]"
                        >
                            <div>
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                                    {isDoc ? (
                                        <FileTextIcon />
                                    ) : (
                                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded bg-cyan-950 text-[9px] font-bold text-cyan-400">
                                            {idx + 1}
                                        </div>
                                    )}
                                    <span className="truncate font-medium text-zinc-300">
                                        {isDoc ? src.source || "Document" : hostname}
                                    </span>
                                </div>

                                <h4 className="mt-1 line-clamp-1 text-xs font-medium text-white group-hover:text-cyan-300">
                                    {src.title || src.source || `Source ${idx + 1}`}
                                </h4>

                                {src.snippet && (
                                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                                        {src.snippet}
                                    </p>
                                )}
                            </div>

                            {src.url ? (
                                <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                                >
                                    Visit Link <ExternalLinkIcon />
                                </a>
                            ) : (
                                <span className="mt-2 text-[10px] text-zinc-500">
                                    RAG Knowledge Chunks
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ======================================================
// DASHBOARD
// ======================================================

const Dashboard = () => {
    const {
        initializeSocketConnection,
        handleGetChats,
        handleCreateChat,
        handleOpenChat,
        handleSendMessage,
        handleShareMessage,
        handleShareChat,
        handleRenameChat,
        handleDeleteChat,
        handleTogglePinChat,
        handleUploadDocument,
        handleGetDocuments,
        handleDeleteDocument,
        stopGeneration,
    } = useChat();

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [chatInput, setChatInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingChatId, setEditingChatId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [mobileSidebar, setMobileSidebar] = useState(false);
    const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("zora_theme") || "cyan");
    const activeTheme = THEMES[currentTheme] || THEMES.cyan;
    const [copiedId, setCopiedId] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const maxScroll = scrollHeight - clientHeight;
        const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
        setScrollProgress(progress);

        const isDistanceFar = maxScroll - scrollTop > 180;
        setShowScrollBottom(isDistanceFar);
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Optimistic messages shown immediately on send
    const [optimisticMsgs, setOptimisticMsgs] = useState([]);

    // ==================================================
    // REDUX STATE
    // ==================================================
    const chats = useSelector((state) => state.chat?.chats || {});
    const currentChatId = useSelector((state) => state.chat?.currentChatId || null);
    const loading = useSelector((state) => state.chat?.isLoading || false);
    const documents = useSelector((state) => state.chat?.documents || []);
    const isUploading = useSelector((state) => state.chat?.isUploading || false);
    const uploadProgress = useSelector((state) => state.chat?.uploadProgress || 0);
    const authUser = useSelector(
        (state) => state.auth?.user || state.auth?.currentUser || state.auth?.loggedInUser || null
    );

    const username =
        authUser?.username || authUser?.name || authUser?.fullName || authUser?.email?.split("@")[0] || "User";
    const avatarLetter = username.charAt(0).toUpperCase();

    // ==================================================
    // INITIALIZE
    // ==================================================
    useEffect(() => {
        let mounted = true;
        const initialize = async () => {
            try {
                await initializeSocketConnection();
                if (mounted) {
                    await handleGetChats();
                    await handleGetDocuments();
                }
            } catch (error) {
                console.error("Initialization failed:", error);
            }
        };
        initialize();
        return () => {
            mounted = false;
        };
    }, [initializeSocketConnection, handleGetChats, handleGetDocuments]);

    const currentChat = currentChatId ? chats[currentChatId] : null;
    const serverMessages = currentChat?.messages || [];

    // Deduplicate optimistic user prompt so it appears INSTANTLY on Enter without delay or duplication
    const hasUserMessageInServer = serverMessages.some(
        (m) => m.role === "user" && optimisticMsgs[0] && m.content === optimisticMsgs[0].content
    );
    const pendingOptimistic = optimisticMsgs.length > 0 && !hasUserMessageInServer ? optimisticMsgs : [];
    const messages = [...serverMessages, ...pendingOptimistic];

    const lastMsg = messages[messages.length - 1];
    const showTypingIndicator = isSending || (messages.length > 0 && lastMsg?.role === "user");

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, isSending, optimisticMsgs]);

    useEffect(() => {
        if (!isSending) {
            setOptimisticMsgs([]);
        }
    }, [isSending]);

    const filteredChats = useMemo(() => {
        return Object.values(chats)
            .filter((item) => item?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0);
            });
    }, [chats, searchQuery]);

    // ==================================================
    // HANDLERS
    // ==================================================

    const handleNewChat = useCallback(async () => {
        try {
            setOpenMenuId(null);
            setEditingChatId(null);
            setEditingTitle("");
            setChatInput("");
            await handleCreateChat();
            setMobileSidebar(false);
        } catch (error) {
            console.error("Create new chat failed:", error);
        }
    }, [handleCreateChat]);

    const openChat = useCallback(
        async (chatId) => {
            try {
                await handleOpenChat(chatId, chats);
                setOpenMenuId(null);
                setMobileSidebar(false);
            } catch (error) {
                console.error("Open chat failed:", error);
            }
        },
        [handleOpenChat, chats]
    );

    const handleSubmitMessage = useCallback(
        async (event) => {
            event?.preventDefault();
            const message = chatInput.trim();
            if (!message || isSending) return;

            setOptimisticMsgs([{ id: `opt-${Date.now()}`, content: message, role: "user" }]);
            setChatInput("");

            try {
                setIsSending(true);
                await handleSendMessage({ message, chatId: currentChatId || null });
            } catch (error) {
                console.error("Submit message failed:", error);
            } finally {
                setIsSending(false);
                setOptimisticMsgs([]);
            }
        },
        [chatInput, isSending, currentChatId, handleSendMessage]
    );

    const handleStop = useCallback(() => {
        if (stopGeneration) {
            stopGeneration();
        }
        setIsSending(false);
    }, [stopGeneration]);

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            await handleUploadDocument(file, file.name);
            event.target.value = "";
            setShowKnowledgeModal(true);
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    const useSuggestion = useCallback((question) => {
        setChatInput(question);
    }, []);

    const handleCopyMessage = useCallback(async (message, messageId) => {
        try {
            await copyTextFallback(message);
            setCopiedId(messageId);
            setTimeout(() => setCopiedId(null), 1500);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }, []);

    const saveRename = useCallback(async () => {
        const title = editingTitle.trim();
        if (!editingChatId || !title) return;
        try {
            await handleRenameChat(editingChatId, title);
            setEditingChatId(null);
            setEditingTitle("");
            setOpenMenuId(null);
        } catch (error) {
            console.error("Rename failed:", error);
        }
    }, [editingTitle, editingChatId, handleRenameChat]);

    const handleLogout = useCallback(async () => {
        try {
            await axios.post("http://localhost:8000/api/auth/logout", {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            dispatch(setUser(null));
            navigate("/login", { replace: true });
        }
    }, [dispatch, navigate]);

    const suggestions = [
        "What are the latest breakthroughs in AI this year?",
        "Explain RAG (Retrieval-Augmented Generation) in simple terms",
        "Summarize the documents I've uploaded",
        "How do vector embeddings work with Pinecone and MongoDB?",
    ];

    // ==================================================
    const textareaRef = useRef(null);

    // Auto-resize textarea height according to content (grows on paste/typing, shrinks on submit)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
            textareaRef.current.style.height = `${Math.max(newHeight, 44)}px`;
        }
    }, [chatInput]);

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <main className="flex h-screen w-full overflow-hidden bg-[#070910] text-white">
            {mobileSidebar && (
                <div onClick={() => setMobileSidebar(false)} className="fixed inset-0 z-40 bg-black/70 md:hidden" />
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/10 bg-[#090c13] p-4 transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
                    mobileSidebar ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ZoraLogo size={38} stops={activeTheme.logoStops} />
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Zora.ai</h1>
                            <p className={`text-[10px] font-medium ${activeTheme.accentText}`}>Search & RAG Engine</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileSidebar(false)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* ACTION BUTTONS */}
                <div className="mb-3 space-y-2">
                    <button
                        type="button"
                        onClick={handleNewChat}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                    >
                        <PlusIcon /> New Search
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowKnowledgeModal(true)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border ${activeTheme.accentBorder} ${activeTheme.badgeBg} px-3 py-2 text-xs font-medium ${activeTheme.accentText} transition hover:bg-white/10`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpenIcon />
                            <span>Knowledge Base</span>
                        </div>
                        <span className={`rounded-full ${activeTheme.badgeBg} px-2 py-0.5 text-[10px] ${activeTheme.accentText} border ${activeTheme.accentBorder}`}>
                            {documents.length}
                        </span>
                    </button>
                </div>

                {/* SEARCH CHATS */}
                <div className="relative mb-3">
                    <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-zinc-500">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats"
                        className={`w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-zinc-600 ${activeTheme.focusBorder}`}
                    />
                </div>

                <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Recent Chats
                </div>

                {/* CHAT LIST */}
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                    {filteredChats.length === 0 ? (
                        <div className="px-3 py-8 text-center text-xs text-zinc-600">No chat history</div>
                    ) : (
                        filteredChats.map((chatItem) => {
                            const isActive = currentChatId === chatItem.id;
                            const isEditing = editingChatId === chatItem.id;
                            return (
                                <div key={chatItem.id} className="group relative">
                                    {isEditing ? (
                                        <div className="rounded-xl border border-cyan-400/30 bg-white/[0.05] p-2">
                                            <input
                                                autoFocus
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveRename();
                                                    if (e.key === "Escape") {
                                                        setEditingChatId(null);
                                                        setEditingTitle("");
                                                    }
                                                }}
                                                className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={saveRename}
                                                    className="flex-1 rounded-lg bg-cyan-400 px-2 py-1 text-xs font-semibold text-black"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingChatId(null);
                                                        setEditingTitle("");
                                                    }}
                                                    className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-zinc-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openChat(chatItem.id)}
                                                className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 pr-10 text-left text-xs transition ${
                                                    isActive
                                                        ? "bg-white/10 font-medium text-white"
                                                        : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                                                }`}
                                            >
                                                {chatItem.pinned && <span className="text-cyan-400">📌</span>}
                                                <span className="min-w-0 flex-1 truncate">
                                                    {chatItem.title || "New Chat"}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === chatItem.id ? null : chatItem.id);
                                                }}
                                                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-zinc-500 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                                            >
                                                <MoreIcon />
                                            </button>

                                            {openMenuId === chatItem.id && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-2 top-[40px] z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#11151e] p-1 shadow-2xl"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingChatId(chatItem.id);
                                                            setEditingTitle(chatItem.title || "");
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                                                    >
                                                        <EditIcon /> Rename
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleTogglePinChat(chatItem.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
                                                    >
                                                        <PinIcon filled={chatItem.pinned} />
                                                        {chatItem.pinned ? "Unpin" : "Pin"}
                                                    </button>
                                                    <div className="my-1 border-t border-white/10" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm(`Delete "${chatItem.title}"?`))
                                                                handleDeleteChat(chatItem.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <TrashIcon /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* USER PROFILE */}
                <div className="mt-3 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activeTheme.badgeBg} ${activeTheme.accentText} ${activeTheme.accentBorder} border text-xs font-bold`}>
                            {avatarLetter}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{username}</p>
                            <p className="truncate text-[10px] text-zinc-500">Free Tier • RAG Enabled</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                        <LogoutIcon /> Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* HEADER */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileSidebar(true)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white md:hidden"
                        >
                            <MenuIcon />
                        </button>
                        <div className="flex items-center gap-2">
                            <ZoraLogo size={28} />
                            <span className="font-semibold text-sm md:hidden">Zora.ai</span>
                        </div>
                        {currentChat && (
                            <>
                                <span className="text-zinc-700">/</span>
                                <span className="max-w-[200px] truncate text-xs text-zinc-400 md:max-w-md">
                                    {currentChat.title || "New Chat"}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* THEME PICKER BUTTON & DROPDOWN */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowThemePicker((prev) => !prev)}
                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
                                title="Select Color Theme"
                            >
                                <span className={`h-2.5 w-2.5 rounded-full ${activeTheme.colorDot}`} />
                                <span className="hidden sm:inline">Theme</span>
                            </button>

                            {showThemePicker && (
                                <div className="absolute right-0 mt-2.5 w-44 rounded-2xl border border-white/10 bg-[#10141e] p-2 shadow-2xl z-50 backdrop-blur-xl">
                                    <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                        Color Theme
                                    </div>
                                    {Object.values(THEMES).map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setCurrentTheme(t.id);
                                                localStorage.setItem("zora_theme", t.id);
                                                setShowThemePicker(false);
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition ${
                                                currentTheme === t.id
                                                    ? "bg-white/10 text-white font-bold"
                                                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                            }`}
                                        >
                                            <span className={`h-3 w-3 rounded-full ${t.colorDot}`} />
                                            <span>{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowKnowledgeModal(true)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <BookOpenIcon />
                            <span className="hidden sm:inline">Knowledge ({documents.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleNewChat}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-zinc-200"
                        >
                            <PlusIcon />
                            <span className="hidden sm:inline">New Chat</span>
                        </button>
                    </div>
                </header>

                {/* TOP READING SCROLL PROGRESS INDICATOR BAR */}
                <div className="h-[2px] w-full bg-white/5 shrink-0">
                    <div
                        className={`h-full ${activeTheme.colorDot} transition-all duration-100 ease-out`}
                        style={{ width: `${scrollProgress}%` }}
                    />
                </div>

                {/* MESSAGES SCROLLER */}
                <div ref={scrollContainerRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-48 pt-6 md:px-8 md:pt-8">
                        {!currentChat && messages.length === 0 && (
                            <div className="flex flex-1 flex-col items-center justify-center py-12">
                                <ZoraLogo size={64} />
                                <h1 className="mt-6 text-center text-3xl font-bold tracking-tight md:text-4xl">
                                    Where knowledge begins.
                                </h1>
                                <p className="mt-2 max-w-md text-center text-xs text-zinc-400 md:text-sm">
                                    Search live web sources, ask questions across your uploaded documents, and discover insights in seconds.
                                </p>
                                <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => useSuggestion(suggestion)}
                                            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-left text-xs text-zinc-300 transition hover:border-cyan-400/40 hover:bg-white/[0.05] hover:text-white"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.length > 0 && (
                            <div className="space-y-7">
                                {messages.map((message, index) => {
                                    const messageId = message.id || message._id || `${currentChatId}-${index}`;
                                    const isUser = message.role === "user";
                                    const isOpt = String(messageId).startsWith("opt-");

                                    return (
                                        <div
                                            key={messageId}
                                            className={`flex ${
                                                isUser ? "justify-end" : "justify-start"
                                            } ${isOpt ? "opacity-60" : "opacity-100"} transition-opacity`}
                                        >
                                            <div className={`${isUser ? "max-w-[85%] md:max-w-[80%]" : "w-full"}`}>
                                                {/* SENDER BADGE */}
                                                {!isUser && (
                                                    <div className={`mb-2 flex items-center gap-2 text-xs font-semibold ${activeTheme.accentText}`}>
                                                        <ZoraLogo size={20} />
                                                        <span>Zora.ai Answer</span>
                                                    </div>
                                                )}

                                                {/* SOURCES SECTION (for AI response) */}
                                                {!isUser && message.sources && message.sources.length > 0 && (
                                                    <SourcesSection sources={message.sources} />
                                                )}

                                                {/* MESSAGE BUBBLE */}
                                                <div
                                                    className={`${
                                                        isUser
                                                            ? "rounded-2xl rounded-tr-xs bg-zinc-800/90 border border-zinc-700/60 px-5 py-3.5 shadow-md text-zinc-100"
                                                            : "rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-5 md:p-7 shadow-xl backdrop-blur-md"
                                                    }`}
                                                >
                                                    {isUser ? (
                                                        <p className="whitespace-pre-wrap text-sm md:text-[15px] font-normal leading-relaxed text-zinc-100">
                                                            {message.content}
                                                        </p>
                                                    ) : (
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                p: ({ children }) => (
                                                                    <p className="mb-3.5 text-sm md:text-[15px] font-normal leading-relaxed text-zinc-200 last:mb-0">
                                                                        {children}
                                                                    </p>
                                                                ),
                                                                strong: ({ children }) => (
                                                                    <strong className="font-bold text-white">
                                                                        {children}
                                                                    </strong>
                                                                ),
                                                                em: ({ children }) => (
                                                                    <em className={`italic ${activeTheme.accentText} font-medium`}>
                                                                        {children}
                                                                    </em>
                                                                ),
                                                                ul: ({ children }) => (
                                                                    <ul className="mb-4 list-disc space-y-2 pl-6 text-sm md:text-[15px] text-zinc-200">
                                                                        {children}
                                                                    </ul>
                                                                ),
                                                                ol: ({ children }) => (
                                                                    <ol className="mb-4 list-decimal space-y-2 pl-6 text-sm md:text-[15px] text-zinc-200">
                                                                        {children}
                                                                    </ol>
                                                                ),
                                                                li: ({ children }) => (
                                                                    <li className="leading-relaxed text-zinc-100">
                                                                        {children}
                                                                    </li>
                                                                ),
                                                                hr: () => (
                                                                    <hr className="my-6 border-t border-zinc-800" />
                                                                ),
                                                                h1: ({ children }) => (
                                                                    <h1 className={`mb-4 mt-6 border-b border-zinc-800 pb-2 text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradientH1}`}>
                                                                        {children}
                                                                    </h1>
                                                                ),
                                                                h2: ({ children }) => (
                                                                    <h2 className="mb-3.5 mt-5 border-b border-zinc-800 pb-2 text-xl md:text-2xl font-bold tracking-tight text-white">
                                                                        {children}
                                                                    </h2>
                                                                ),
                                                                h3: ({ children }) => (
                                                                    <h3 className={`mb-2.5 mt-4 text-lg md:text-xl font-bold ${activeTheme.accentText}`}>
                                                                        {children}
                                                                    </h3>
                                                                ),
                                                                code: ({ children }) => (
                                                                    <code className={`rounded-md ${activeTheme.badgeBg} ${activeTheme.accentBorder} ${activeTheme.badgeText} border px-1.5 py-0.5 text-xs font-mono shadow-sm`}>
                                                                        {children}
                                                                    </code>
                                                                ),
                                                                pre: ({ children }) => {
                                                                    const codeText = String(children?.props?.children || children || "").trim();
                                                                    return (
                                                                        <div className="my-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
                                                                            <div className="flex items-center justify-between border-b border-zinc-800/90 bg-zinc-900/90 px-4 py-2 text-[11px] font-mono text-zinc-400">
                                                                                <span className={`flex items-center gap-1.5 ${activeTheme.accentText} font-bold`}>
                                                                                    <span>Code Snippet</span>
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyTextFallback(codeText)}
                                                                                    className="flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:bg-white/20 hover:text-white"
                                                                                >
                                                                                    <CopyIcon />
                                                                                    <span>Copy</span>
                                                                                </button>
                                                                            </div>
                                                                            <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-zinc-200">
                                                                                {children}
                                                                            </pre>
                                                                        </div>
                                                                    );
                                                                },
                                                                table: ({ children }) => (
                                                                    <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/90 shadow-lg">
                                                                        <table className="w-full text-left text-xs border-collapse">
                                                                            {children}
                                                                        </table>
                                                                    </div>
                                                                ),
                                                                thead: ({ children }) => (
                                                                    <thead className="bg-cyan-950/50 text-xs font-bold text-cyan-300 border-b border-cyan-500/30">
                                                                        {children}
                                                                    </thead>
                                                                ),
                                                                tbody: ({ children }) => (
                                                                    <tbody className="divide-y divide-zinc-800/70 text-zinc-200">
                                                                        {children}
                                                                    </tbody>
                                                                ),
                                                                th: ({ children }) => (
                                                                    <th className="px-4 py-3 font-bold text-cyan-300">
                                                                        {children}
                                                                    </th>
                                                                ),
                                                                td: ({ children }) => (
                                                                    <td className="px-4 py-3 text-zinc-200">
                                                                        {children}
                                                                    </td>
                                                                ),
                                                                blockquote: ({ children }) => (
                                                                    <blockquote className="my-4 rounded-r-xl border-l-4 border-cyan-400 bg-cyan-950/30 py-3 pl-4 pr-3 text-sm text-zinc-200 italic shadow-md">
                                                                        {children}
                                                                    </blockquote>
                                                                ),
                                                                a: ({ children, href }) => (
                                                                    <a
                                                                        href={href}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-semibold"
                                                                    >
                                                                        {children}
                                                                    </a>
                                                                ),
                                                            }}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    )}
                                                </div>

                                                {/* ACTION BUTTONS (Copy, Share, Download PDF) */}
                                                {!isOpt && (
                                                    <div
                                                        className={`mt-2 flex items-center gap-1.5 ${
                                                            isUser ? "justify-end" : "justify-start"
                                                        }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            title="Copy"
                                                            onClick={() =>
                                                                handleCopyMessage(message.content, messageId)
                                                            }
                                                            className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 border border-white/5"
                                                        >
                                                            {copiedId === messageId ? (
                                                                <span className="text-[11px] font-semibold text-cyan-400">Copied!</span>
                                                            ) : (
                                                                <>
                                                                    <CopyIcon />
                                                                    <span className="text-[11px]">Copy</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        {!isUser && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    title="Share message"
                                                                    onClick={() =>
                                                                        handleShareMessage(messageId)
                                                                            .then((d) => {
                                                                                const url =
                                                                                    d?.shareUrl ||
                                                                                    `${window.location.origin}/shared/message/${messageId}`;
                                                                                copyTextFallback(url);
                                                                                alert("Share link copied to clipboard!");
                                                                            })
                                                                            .catch((e) => alert(e.message))
                                                                    }
                                                                    className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 border border-white/5"
                                                                >
                                                                    <ShareIcon />
                                                                    <span className="text-[11px]">Share</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    title="Download as Printable PDF"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const res = await axios.post(
                                                                                "http://localhost:8000/api/pdf/generate",
                                                                                {
                                                                                    title: currentChat?.title || "Zora_Notes",
                                                                                    content: message.content,
                                                                                },
                                                                                { responseType: "blob", withCredentials: true }
                                                                            );
                                                                            const blob = new Blob([res.data], { type: "application/pdf" });
                                                                            const downloadUrl = window.URL.createObjectURL(blob);
                                                                            const a = document.createElement("a");
                                                                            a.href = downloadUrl;
                                                                            a.download = `${(currentChat?.title || "Zora_Study_Notes").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                                                                            document.body.appendChild(a);
                                                                            a.click();
                                                                            document.body.removeChild(a);
                                                                        } catch (pdfErr) {
                                                                            alert("PDF download failed: " + pdfErr.message);
                                                                        }
                                                                    }}
                                                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 px-2.5 py-1 text-xs text-cyan-300 transition hover:bg-cyan-900/60 hover:text-white"
                                                                >
                                                                    <FileTextIcon />
                                                                    <span className="text-[11px] font-medium">Download PDF</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {showTypingIndicator && <TypingDots />}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ==================================================
                    INPUT BAR (FIXED CENTERED LAYOUT)
                ================================================== */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20">
                    <div className="pointer-events-auto mx-auto w-full max-w-5xl px-4 pb-4 md:px-8 md:pb-6">
                        {/* FLOATING SCROLL TO BOTTOM BUTTON */}
                        {showScrollBottom && (
                            <div className="flex justify-end pb-2">
                                <button
                                    type="button"
                                    onClick={scrollToBottom}
                                    className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#121622]/95 ${activeTheme.accentText} shadow-2xl backdrop-blur-md transition hover:scale-110 active:scale-95`}
                                    title="Scroll to latest message"
                                >
                                    <ChevronDownIcon />
                                </button>
                            </div>
                        )}
                        {/* STOP BUTTON */}
                        {(loading || isSending) && (
                            <div className="mb-2 flex justify-center">
                                <button
                                    onClick={handleStop}
                                    className="flex items-center gap-2 rounded-full border border-white/10 bg-[#151922] px-4 py-1.5 text-xs text-zinc-300 shadow-xl transition hover:bg-[#1e2330] hover:text-white"
                                >
                                    <StopIcon />
                                    <span>Stop generating</span>
                                </button>
                            </div>
                        )}

                        {/* INPUT BOX */}
                        <div className="rounded-2xl border border-white/10 bg-[#0c1018]/95 p-2.5 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl transition focus-within:border-cyan-500/40">
                            <form onSubmit={handleSubmitMessage} className="flex flex-col">
                                <textarea
                                    ref={textareaRef}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmitMessage(e);
                                        }
                                    }}
                                    rows={1}
                                    placeholder="Ask anything, paste notes, or query your uploaded knowledge..."
                                    className="max-h-56 min-h-[44px] w-full resize-none bg-transparent px-3 py-2 text-sm md:text-[15px] text-white outline-none placeholder:text-zinc-500 overflow-y-auto leading-relaxed"
                                />

                                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept=".pdf,.txt,.md,.json"
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            title="Upload PDF or Document for RAG search"
                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                                        >
                                            <PaperclipIcon />
                                            <span className="hidden sm:inline">Attach RAG File</span>
                                        </button>

                                        {isUploading && (
                                            <span className="text-[11px] text-cyan-400 animate-pulse">
                                                Ingesting ({uploadProgress}%)...
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || isSending}
                                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <SendIcon />
                                    </button>
                                </div>
                            </form>
                            <div className="px-2 pt-1 text-center text-[10px] text-zinc-600">
                                Zora.ai synthesizes live web data & vector RAG documents. Verify critical info.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================================================
                KNOWLEDGE BASE MODAL (RAG Documents)
            ================================================== */}
            {showKnowledgeModal && (
                <div
                    onClick={() => setShowKnowledgeModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f131c] shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <BookOpenIcon />
                                <h3 className="font-semibold text-white">Knowledge Base (RAG)</h3>
                            </div>
                            <button
                                onClick={() => setShowKnowledgeModal(false)}
                                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="p-5">
                            {/* UPLOAD BOX */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-500/30 bg-cyan-950/10 p-5 text-center transition hover:bg-cyan-950/20"
                            >
                                <PaperclipIcon />
                                <p className="mt-2 text-xs font-semibold text-cyan-300">
                                    Click to upload PDF or text documents
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                    Files are automatically chunked, embedded, and indexed for semantic search.
                                </p>
                            </div>

                            {/* DOCUMENT LIST */}
                            <div className="mt-4">
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                    Uploaded Documents ({documents.length})
                                </h4>

                                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                    {documents.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-zinc-600">
                                            No documents uploaded yet. Upload a PDF or file to chat with your data.
                                        </p>
                                    ) : (
                                        documents.map((doc) => (
                                            <div
                                                key={doc._id}
                                                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.05]"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <FileTextIcon />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-medium text-white">
                                                            {doc.title || doc.originalName}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-500">
                                                            {doc.chunkCount || 0} chunks •{" "}
                                                            {(doc.size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDocument(doc._id)}
                                                    title="Delete document"
                                                    className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-white/10 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => setShowKnowledgeModal(false)}
                                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Dashboard;