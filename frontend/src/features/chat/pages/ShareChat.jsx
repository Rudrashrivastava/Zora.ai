import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../../../lib/axios";

// ======================================================
// ZORA LOGO
// ======================================================

const ZoraLogo = ({ size = 42 }) => (
    <div 
        className="flex shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-[#31b8c6]/30 shadow-inner"
        style={{
            width: size,
            height: size,
        }}
    >
        <svg
            width="70%"
            height="70%"
            viewBox="0 0 100 100"
            fill="none"
            className="drop-shadow-[0_0_8px_rgba(49,184,198,0.5)]"
        >
            <defs>
                <linearGradient id="zoraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
            </defs>
            {/* Hexagon/Shield background shape */}
            <path
                d="M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z"
                fill="url(#zoraGrad)"
                opacity="0.15"
                stroke="url(#zoraGrad)"
                strokeWidth="3"
            />
            {/* Inner stylized Z */}
            <path
                d="M32 32 H68 L32 68 H68"
                stroke="url(#zoraGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Center Core Dot */}
            <circle cx="50" cy="50" r="5" fill="#ffffff" className="animate-ping" style={{ transformOrigin: "center" }} />
            <circle cx="50" cy="50" r="4" fill="#ffffff" />
        </svg>
    </div>
);

// ======================================================
// COPY ICON
// ======================================================

const CopyIcon = () => (
    <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
    >
        <rect
            x="9"
            y="9"
            width="11"
            height="11"
            rx="2"
        />

        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

// ======================================================
// SHARE CHAT
// ======================================================

const ShareChat = () => {
    const { chatId, messageId } = useParams();

    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (err) {
            console.warn("navigator.clipboard failed, using fallback:", err);
        }
        try {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            const successful = document.execCommand("copy");
            document.body.removeChild(textarea);
            if (successful) return true;
        } catch (err) {
            console.error("Fallback copy failed:", err);
        }
        return false;
    };

    // ==================================================
    // LOAD SHARED DATA
    // ==================================================

    useEffect(() => {
        let mounted = true;

        const loadSharedData = async () => {
            if (!chatId && !messageId) {
                setError("Invalid share link.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                if (chatId) {
                    const response = await api.get(
                        `/api/chats/share/${chatId}`
                    );

                    if (!mounted) return;

                    const sharedChat =
                        response.data?.chat ||
                        response.data;

                    if (!sharedChat) {
                        throw new Error(
                            "Shared conversation not found."
                        );
                    }

                    setChat(sharedChat);
                } else if (messageId) {
                    const response = await api.get(
                        `/api/chats/share/message/${messageId}`
                    );

                    if (!mounted) return;

                    const data = response.data;

                    if (!data?.sharedMessage) {
                        throw new Error(
                            "Shared message not found."
                        );
                    }

                    const virtualChat = {
                        _id: data.sharedMessage._id,
                        title: data.chatTitle || "Shared Message",
                        messages: [
                            {
                                _id: data.sharedMessage._id,
                                content: data.sharedMessage.content,
                                role: data.sharedMessage.role,
                                createdAt: data.sharedMessage.createdAt,
                            }
                        ]
                    };

                    setChat(virtualChat);
                }

            } catch (err) {
                console.error(
                    "Failed to load shared resource:",
                    err
                );

                if (!mounted) return;

                setError(
                    err.response?.data?.message ||
                    "This shared conversation or message is unavailable."
                );

            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadSharedData();

        return () => {
            mounted = false;
        };

    }, [chatId, messageId]);

    // ==================================================
    // COPY MESSAGE
    // ==================================================

    const copyMessage = async (message) => {
        try {
            await copyToClipboard(
                message.content || ""
            );

            const id =
                message._id ||
                message.id;

            setCopiedId(id);

            setTimeout(() => {
                setCopiedId(null);
            }, 1500);

        } catch (err) {
            console.error(
                "Copy message failed:",
                err
            );
        }
    };

    // ==================================================
    // COPY CHAT
    // ==================================================

    const copyChat = async () => {
        if (!chat) return;

        const text =
            chat.messages
                ?.map((message) => {
                    const sender =
                        message.role === "user"
                            ? "You"
                            : "Zora.ai";

                    return `${sender}: ${
                        message.content || ""
                    }`;
                })
                .join("\n\n") || "";

        try {
            await copyToClipboard(text);

            setCopiedId("chat");

            setTimeout(() => {
                setCopiedId(null);
            }, 1500);

        } catch (err) {
            console.error(
                "Copy chat failed:",
                err
            );
        }
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#070910] text-white">
                <div className="flex flex-col items-center">
                    <ZoraLogo size={58} />

                    <div className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />

                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:150ms]" />

                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:300ms]" />

                        Loading conversation...
                    </div>
                </div>
            </main>
        );
    }

    // ==================================================
    // ERROR
    // ==================================================

    if (error || !chat) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#070910] px-4 text-white">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1018] p-8 text-center">
                    <div className="flex justify-center">
                        <ZoraLogo size={55} />
                    </div>

                    <h1 className="mt-6 text-2xl font-bold">
                        Conversation unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                        {error ||
                            "This shared conversation could not be found."}
                    </p>

                    <Link
                        to="/"
                        className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
                    >
                        Go to Zora.ai
                    </Link>
                </div>
            </main>
        );
    }

    // ==================================================
    // CHAT
    // ==================================================

    return (
        <main className="min-h-screen bg-[#070910] text-white">

            {/* HEADER */}

            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070910]/90 backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 md:px-6">

                    <div className="flex items-center gap-3">
                        <ZoraLogo size={36} />

                        <div>
                            <h1 className="font-bold">
                                Zora.ai
                            </h1>

                            <p className="text-[10px] text-zinc-600">
                                Shared conversation
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        <button
                            onClick={copyChat}
                            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/10 hover:text-white"
                        >
                            <CopyIcon />

                            {copiedId === "chat"
                                ? "Copied!"
                                : "Copy chat"}
                        </button>

                        <Link
                            to="/"
                            className="hidden rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-zinc-200 sm:block"
                        >
                            Try Zora.ai
                        </Link>

                    </div>
                </div>
            </header>

            {/* CONTENT */}

            <section className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 md:px-6 md:pt-12">

                {/* TITLE */}

                <div className="mb-10">

                    <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                        Zora.ai conversation
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {chat.title ||
                            "Shared conversation"}
                    </h1>

                </div>

                {/* MESSAGES */}

                <div className="space-y-8">

                    {chat.messages?.map(
                        (message, index) => {

                            const id =
                                message._id ||
                                message.id ||
                                index;

                            const isUser =
                                message.role === "user";

                            return (
                                <article
                                    key={id}
                                    className="group"
                                >

                                    {/* AUTHOR */}

                                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">

                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                                            {isUser
                                                ? "U"
                                                : "Z"}
                                        </div>

                                        <span>
                                            {isUser
                                                ? "You"
                                                : "Zora.ai"}
                                        </span>

                                    </div>

                                    {/* SOURCES */}
                                    {!isUser && message.sources && message.sources.length > 0 && (
                                        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            {message.sources.map((src, sIdx) => (
                                                <div key={sIdx} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-xs">
                                                    <div className="font-semibold text-white truncate">{src.title || src.source}</div>
                                                    {src.snippet && <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{src.snippet}</p>}
                                                    {src.url && (
                                                        <a href={src.url} target="_blank" rel="noreferrer" className="text-cyan-400 text-[10px] mt-1.5 inline-block underline">
                                                            Visit source
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* CONTENT */}
                                    <div
                                        className={
                                            isUser
                                                ? "rounded-2xl bg-white/[0.06] px-4 py-3"
                                                : ""
                                        }
                                    >

                                        {isUser ? (
                                            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200 md:text-[15px]">
                                                {
                                                    message.content
                                                }
                                            </p>
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[
                                                    remarkGfm,
                                                ]}
                                                components={{
                                                    p: ({
                                                        children,
                                                    }) => (
                                                        <p className="mb-3 leading-7 text-zinc-200 last:mb-0">
                                                            {
                                                                children
                                                            }
                                                        </p>
                                                    ),

                                                    ul: ({
                                                        children,
                                                    }) => (
                                                        <ul className="mb-3 list-disc space-y-1 pl-6">
                                                            {
                                                                children
                                                            }
                                                        </ul>
                                                    ),

                                                    ol: ({
                                                        children,
                                                    }) => (
                                                        <ol className="mb-3 list-decimal space-y-1 pl-6">
                                                            {
                                                                children
                                                            }
                                                        </ol>
                                                    ),

                                                    h1: ({
                                                        children,
                                                    }) => (
                                                        <h1 className="mb-4 text-2xl font-bold">
                                                            {
                                                                children
                                                            }
                                                        </h1>
                                                    ),

                                                    h2: ({
                                                        children,
                                                    }) => (
                                                        <h2 className="mb-3 mt-5 text-xl font-bold">
                                                            {
                                                                children
                                                            }
                                                        </h2>
                                                    ),

                                                    h3: ({
                                                        children,
                                                    }) => (
                                                        <h3 className="mb-2 mt-4 text-lg font-semibold">
                                                            {
                                                                children
                                                            }
                                                        </h3>
                                                    ),

                                                    code: ({
                                                        children,
                                                    }) => (
                                                        <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-sm text-cyan-200">
                                                            {
                                                                children
                                                            }
                                                        </code>
                                                    ),

                                                    pre: ({
                                                        children,
                                                    }) => (
                                                        <pre className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                                                            {
                                                                children
                                                            }
                                                        </pre>
                                                    ),

                                                    blockquote: ({
                                                        children,
                                                    }) => (
                                                        <blockquote className="my-3 border-l-2 border-cyan-400/50 pl-4 text-zinc-400">
                                                            {
                                                                children
                                                            }
                                                        </blockquote>
                                                    ),

                                                    a: ({
                                                        children,
                                                        href,
                                                    }) => (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-cyan-400 underline underline-offset-2"
                                                        >
                                                            {
                                                                children
                                                            }
                                                        </a>
                                                    ),
                                                }}
                                            >
                                                {
                                                    message.content
                                                }
                                            </ReactMarkdown>
                                        )}

                                    </div>

                                    {/* COPY */}

                                    <button
                                        onClick={() =>
                                            copyMessage(
                                                message
                                            )
                                        }
                                        className="mt-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-zinc-600 opacity-0 transition hover:bg-white/10 hover:text-zinc-300 group-hover:opacity-100"
                                    >
                                        <CopyIcon />

                                        {copiedId === id
                                            ? "Copied!"
                                            : "Copy"}
                                    </button>

                                </article>
                            );
                        }
                    )}

                </div>

                {/* FOOTER */}

                <div className="mt-16 border-t border-white/10 pt-8 text-center">

                    <div className="flex justify-center">
                        <ZoraLogo size={38} />
                    </div>

                    <p className="mt-3 text-sm font-medium text-zinc-400">
                        This conversation was shared from Zora.ai
                    </p>

                    <Link
                        to="/"
                        className="mt-4 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200"
                    >
                        Start your own chat
                    </Link>

                </div>

            </section>
        </main>
    );
};

export default ShareChat;