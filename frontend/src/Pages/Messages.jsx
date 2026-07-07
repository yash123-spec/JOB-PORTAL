// src/Pages/Messages.jsx
import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, Trash2, Search, Sun, Moon, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { messageAPI } from "../utils/api";
import { optimizedImage } from "../utils/img";
import ConfirmModal from "../Components/ui/ConfirmModal";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";

// Presentation-only theme map. `variant` only affects the panel background so
// the sidebar and chat column can each be themed independently.
const makeTheme = (dark, variant) => {
    const common = dark
        ? {
            sideBorder: "border-white/10",
            headBorder: "border-white/10",
            headBg: "",
            formBg: "",
            titleText: "text-white",
            accent: "text-teal-400",
            toggle: "text-gray-300 hover:bg-white/10",
            searchField: "bg-white/5 border-white/10 text-white focus:border-teal-500",
            loadingText: "text-gray-400",
            emptyTitle: "text-gray-300",
            emptySub: "text-gray-500",
            iconCircle: "bg-white/10 text-teal-400",
            convBorder: "border-white/5",
            convSelected: "bg-teal-500/20",
            convHover: "hover:bg-white/5",
            avatar: "bg-teal-500",
            nameText: "text-white",
            del: "text-gray-400 hover:text-red-400",
            subtle: "text-gray-400",
            time: "text-gray-500",
            unread: "bg-teal-500 text-white",
            online: "text-green-400",
            onlineDot: "bg-green-400",
            offline: "text-gray-500",
            typing: "text-teal-400",
            ownBubble: "bg-teal-500 text-white",
            otherBubble: "bg-white/10 text-white",
            bubbleTime: "text-gray-500",
            textarea: "bg-white/5 border-white/10 text-white focus:border-teal-500",
            send: "bg-teal-500 hover:bg-teal-600 text-white",
        }
        : {
            sideBorder: "border-gray-200",
            headBorder: "border-gray-200",
            headBg: "bg-white",
            formBg: "bg-white",
            titleText: "text-ink",
            accent: "text-brand",
            toggle: "text-gray-500 hover:bg-gray-100",
            searchField: "bg-white border-gray-200 text-gray-800 focus:border-brand focus:ring-2 focus:ring-brand/20",
            loadingText: "text-gray-500",
            emptyTitle: "text-gray-600",
            emptySub: "text-gray-500",
            iconCircle: "bg-brand-light text-brand",
            convBorder: "border-gray-100",
            convSelected: "bg-brand-light",
            convHover: "hover:bg-white",
            avatar: "bg-gradient-to-br from-brand to-teal-500",
            nameText: "text-ink",
            del: "text-gray-400 hover:text-red-500",
            subtle: "text-gray-400",
            time: "text-gray-400",
            unread: "bg-brand text-white",
            online: "text-green-600",
            onlineDot: "bg-green-500",
            offline: "text-gray-400",
            typing: "text-brand",
            ownBubble: "bg-brand text-white",
            otherBubble: "border border-gray-100 bg-white text-gray-800",
            bubbleTime: "text-gray-400",
            textarea: "bg-gray-50 border-gray-200 text-gray-800 focus:border-brand focus:ring-2 focus:ring-brand/20",
            send: "bg-brand hover:bg-brand-dark text-white",
        };
    common.panel = dark
        ? "bg-gradient-to-b from-[#071025] via-[#071b2b] to-[#05141b]"
        : variant === "side"
            ? "bg-gray-50"
            : "bg-brand-mint/40";
    return common;
};

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingFrom, setTypingFrom] = useState(null); // userId currently typing in open chat
    const [convToDelete, setConvToDelete] = useState(null); // conversation pending delete confirmation
    const [deletingConv, setDeletingConv] = useState(false);
    const messagesEndRef = useRef(null);
    const selectedConvRef = useRef(null); // latest selected conversation for socket handlers
    const typingTimeoutRef = useRef(null);
    const textareaRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { conversationId } = useParams();

    // Sidebar is always dark. Only the chat area is themeable — defaults to light.
    const [chatDark, setChatDark] = useState(() => {
        const v = localStorage.getItem("messagesChatTheme");
        return v ? v === "dark" : false;
    });
    useEffect(() => {
        localStorage.setItem("messagesChatTheme", chatDark ? "dark" : "light");
    }, [chatDark]);

    // Keep a ref of the selected conversation so socket handlers read the latest value
    useEffect(() => {
        selectedConvRef.current = selectedConversation;
    }, [selectedConversation]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchConversations();
    }, [user, navigate]);

    useEffect(() => {
        if (conversationId && conversations.length > 0) {
            const conv = conversations.find(c => c._id === conversationId);
            if (conv) {
                setSelectedConversation(conv);
                fetchMessages(conversationId);
            }
        }
    }, [conversationId, conversations]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Real-time: connect socket and listen for messages, typing, and presence
    useEffect(() => {
        if (!user) return;
        const socket = getSocket();

        const handleNewMessage = ({ conversationId: cid, message }) => {
            const sc = selectedConvRef.current;
            if (sc && cid === sc._id) {
                // Append if not already present (dedupe by _id)
                setMessages((prev) =>
                    prev.some((m) => m._id === message._id) ? prev : [...prev, message]
                );
            }
            // Refresh sidebar (last message, ordering, unread badge)
            fetchConversations();
        };

        const handleTyping = ({ conversationId: cid, fromUserId }) => {
            const sc = selectedConvRef.current;
            if (sc && cid === sc._id && fromUserId !== user._id) {
                setTypingFrom(fromUserId);
            }
        };
        const handleStopTyping = ({ conversationId: cid }) => {
            const sc = selectedConvRef.current;
            if (sc && cid === sc._id) setTypingFrom(null);
        };

        const handlePresenceInit = ({ online }) => setOnlineUsers(new Set(online));
        const handleOnline = ({ userId: uid }) =>
            setOnlineUsers((prev) => new Set(prev).add(uid));
        const handleOffline = ({ userId: uid }) =>
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                next.delete(uid);
                return next;
            });

        socket.on("message:new", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("presence:init", handlePresenceInit);
        socket.on("user:online", handleOnline);
        socket.on("user:offline", handleOffline);

        return () => {
            socket.off("message:new", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("presence:init", handlePresenceInit);
            socket.off("user:online", handleOnline);
            socket.off("user:offline", handleOffline);
        };
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const response = await messageAPI.getConversations();
            if (response.success) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            toast.error("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (convId, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await messageAPI.getMessages(convId);
            if (response.success) {
                setMessages(Array.isArray(response.data?.messages) ? response.data.messages : []);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            if (!silent) toast.error("Failed to load messages");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        setTypingFrom(null);
        navigate(`/messages/${conversation._id}`);
        fetchMessages(conversation._id);
    };

    // Mobile: return from an open thread back to the conversation list
    const handleBackToList = () => {
        setSelectedConversation(null);
        setMessages([]);
        setTypingFrom(null);
        navigate("/messages");
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const response = await messageAPI.sendMessage(selectedConversation._id, newMessage);
            if (response.success) {
                // Dedupe in case the socket broadcast arrives first
                setMessages((prev) =>
                    prev.some((m) => m._id === response.data._id) ? prev : [...prev, response.data]
                );
                setNewMessage("");
                resetTextareaHeight();
                emitStopTyping();
                // Update conversation list
                fetchConversations();
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    // Notify the other participant that we're typing (debounced stop)
    const otherParticipantId = () => {
        const sc = selectedConversation;
        return sc?.participants?.find((p) => p._id !== user._id)?._id;
    };

    const emitTyping = () => {
        const toUserId = otherParticipantId();
        if (!toUserId || !selectedConversation) return;
        getSocket().emit("typing", { toUserId, conversationId: selectedConversation._id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(emitStopTyping, 1500);
    };

    const emitStopTyping = () => {
        const toUserId = otherParticipantId();
        if (!toUserId || !selectedConversation) return;
        getSocket().emit("stopTyping", { toUserId, conversationId: selectedConversation._id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    // Grow the textarea with content, up to a max height
    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 140) + "px";
    };

    const resetTextareaHeight = () => {
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        autoResize();
        emitTyping();
    };

    // WhatsApp-style: Enter sends, Shift+Enter inserts a newline
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const confirmDeleteConversation = async () => {
        if (!convToDelete) return;
        const convId = convToDelete._id;
        setDeletingConv(true);
        try {
            const response = await messageAPI.deleteConversation(convId);
            if (response.success) {
                toast.success("Conversation deleted");
                setConversations((prev) => prev.filter(c => c._id !== convId));
                if (selectedConversation?._id === convId) {
                    setSelectedConversation(null);
                    setMessages([]);
                    navigate("/messages");
                }
                setConvToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast.error("Failed to delete conversation");
        } finally {
            setDeletingConv(false);
        }
    };

    const getOtherParticipant = (conversation) => {
        return conversation.participants.find(p => p._id !== user._id);
    };

    const filteredConversations = conversations.filter(conv => {
        const otherUser = getOtherParticipant(conv);
        return otherUser?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.relatedJob?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!user) return null;

    // Sidebar is permanently dark; only the chat area follows the toggle
    const side = makeTheme(true, "side");
    const chat = makeTheme(chatDark, "chat");

    // Small reusable theme toggle button
    const ThemeToggle = ({ isDark, onToggle, theme }) => (
        <button
            onClick={onToggle}
            className={`rounded-full p-2 transition-colors ${theme.toggle}`}
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-label="Toggle theme"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );

    return (
        <div className="h-[calc(100vh-72px)] overflow-hidden">
            <div className="flex h-full">
                {/* Conversations Sidebar — on mobile it takes the full screen and hides
                    once a thread is open; on md+ it's always visible alongside the chat */}
                <div className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full flex-col border-r transition-colors md:w-1/3 lg:w-1/4 ${side.sideBorder} ${side.panel}`}>
                    {/* Header */}
                    <div className={`border-b p-4 ${side.headBorder} ${side.headBg}`}>
                        <div className="mb-4 flex items-center">
                            <h1 className={`flex items-center gap-2 font-display text-2xl font-bold ${side.titleText}`}>
                                <MessageCircle size={28} className={side.accent} />
                                Messages
                            </h1>
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className={`w-full rounded-lg border py-2 pl-10 pr-4 outline-none transition ${side.searchField}`}
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && conversations.length === 0 ? (
                            <div className={`p-8 text-center ${side.loadingText}`}>Loading...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className={`p-8 text-center ${side.loadingText}`}>
                                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${side.iconCircle}`}>
                                    <MessageCircle size={26} />
                                </div>
                                <p className={`font-medium ${side.emptyTitle}`}>No conversations yet</p>
                                <p className={`mt-2 text-sm ${side.emptySub}`}>Start chatting with recruiters or candidates</p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => {
                                const otherUser = getOtherParticipant(conversation);
                                const isSelected = selectedConversation?._id === conversation._id;

                                return (
                                    <div
                                        key={conversation._id}
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={`cursor-pointer border-b p-4 transition-colors ${side.convBorder} ${isSelected ? side.convSelected : side.convHover}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            {otherUser?.profilePic ? (
                                                <img
                                                    src={optimizedImage(otherUser.profilePic, { width: 96 })}
                                                    alt={otherUser.fullname}
                                                    loading="lazy"
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold text-white ${side.avatar}`}>
                                                    {otherUser?.fullname?.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className={`truncate font-semibold ${side.nameText}`}>{otherUser?.fullname}</h3>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConvToDelete(conversation); }}
                                                        className={side.del}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                {conversation.relatedJob && (
                                                    <p className={`truncate text-xs ${side.subtle}`}>
                                                        {conversation.relatedJob.title}
                                                    </p>
                                                )}
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`text-xs ${side.time}`}>
                                                        {moment(conversation.lastMessageAt).fromNow()}
                                                    </span>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${side.unread}`}>
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area — on mobile it only appears once a thread is open (the
                    "select a conversation" placeholder is desktop-only) */}
                <div className={`${selectedConversation ? "flex" : "hidden md:flex"} flex-1 flex-col transition-colors ${chat.panel}`}>
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className={`flex items-center gap-3 border-b p-4 ${chat.headBorder} ${chat.headBg}`}>
                                {/* Mobile back button — returns to the conversation list */}
                                <button
                                    onClick={handleBackToList}
                                    className={`-ml-1 rounded-full p-1.5 transition-colors md:hidden ${chat.toggle}`}
                                    title="Back to conversations"
                                    aria-label="Back to conversations"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                {(() => {
                                    const otherUser = getOtherParticipant(selectedConversation);
                                    return (
                                        <>
                                            {otherUser?.profilePic ? (
                                                <img
                                                    src={optimizedImage(otherUser.profilePic, { width: 80 })}
                                                    alt={otherUser.fullname}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white ${chat.avatar}`}>
                                                    {otherUser?.fullname?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h2 className={`flex items-center gap-2 font-semibold ${chat.nameText}`}>
                                                    {otherUser?.fullname}
                                                    {onlineUsers.has(String(otherUser?._id)) ? (
                                                        <span className={`flex items-center gap-1 text-xs font-normal ${chat.online}`}>
                                                            <span className={`inline-block h-2 w-2 rounded-full ${chat.onlineDot}`}></span>
                                                            Online
                                                        </span>
                                                    ) : (
                                                        <span className={`text-xs font-normal ${chat.offline}`}>Offline</span>
                                                    )}
                                                </h2>
                                                {typingFrom === otherUser?._id ? (
                                                    <p className={`text-sm italic ${chat.typing}`}>typing…</p>
                                                ) : selectedConversation.relatedJob ? (
                                                    <p className={`text-sm ${chat.subtle}`}>
                                                        {selectedConversation.relatedJob.title}
                                                    </p>
                                                ) : null}
                                            </div>
                                            {/* Chat theme toggle */}
                                            <div className="ml-auto">
                                                <ThemeToggle isDark={chatDark} onToggle={() => setChatDark((d) => !d)} theme={chat} />
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Messages */}
                            <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
                                {messages.map((message) => {
                                    const isOwn = message.sender._id === user._id;
                                    return (
                                        <div
                                            key={message._id}
                                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                                                <div
                                                    className={`rounded-2xl p-3 ${isOwn
                                                        ? `rounded-br-sm ${chat.ownBubble}`
                                                        : `rounded-bl-sm ${chat.otherBubble}`
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                </div>
                                                <p className={`mt-1 text-xs ${chat.bubbleTime} ${isOwn ? "text-right" : "text-left"}`}>
                                                    {moment(message.createdAt).format("MMM DD, hh:mm A")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className={`border-t p-4 ${chat.headBorder} ${chat.formBg}`}>
                                <div className="flex items-end gap-2">
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className={`no-scrollbar max-h-[140px] flex-1 resize-none overflow-y-auto rounded-lg border px-4 py-3 outline-none transition ${chat.textarea}`}
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className={`rounded-lg px-6 py-3 transition disabled:cursor-not-allowed disabled:opacity-50 ${chat.send}`}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="relative flex flex-1 items-center justify-center">
                            {/* Chat theme toggle (also available on the empty state) */}
                            <div className="absolute right-4 top-4">
                                <ThemeToggle isDark={chatDark} onToggle={() => setChatDark((d) => !d)} theme={chat} />
                            </div>
                            <div className="text-center">
                                <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${chat.iconCircle}`}>
                                    <MessageCircle size={38} />
                                </div>
                                <p className={`text-xl font-medium ${chat.emptyTitle}`}>Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={!!convToDelete}
                onClose={() => !deletingConv && setConvToDelete(null)}
                onConfirm={confirmDeleteConversation}
                loading={deletingConv}
                icon={Trash2}
                title="Delete this conversation?"
                message="The whole message history will be permanently removed for you. This can't be undone."
                confirmLabel="Delete"
            />
        </div>
    );
};

export default Messages;
