// src/Pages/Messages.jsx
import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, Trash2, Search, User } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { messageAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { conversationId } = useParams();

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

    // Auto-refresh messages every 5 seconds when conversation is open
    useEffect(() => {
        if (selectedConversation) {
            const interval = setInterval(() => {
                fetchMessages(selectedConversation._id, true);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedConversation]);

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
                setMessages(response.data);
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
        navigate(`/messages/${conversation._id}`);
        fetchMessages(conversation._id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const response = await messageAPI.sendMessage(selectedConversation._id, newMessage);
            if (response.success) {
                setMessages([...messages, response.data]);
                setNewMessage("");
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

    const handleDeleteConversation = async (convId, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this conversation?")) return;

        try {
            const response = await messageAPI.deleteConversation(convId);
            if (response.success) {
                toast.success("Conversation deleted");
                setConversations(conversations.filter(c => c._id !== convId));
                if (selectedConversation?._id === convId) {
                    setSelectedConversation(null);
                    setMessages([]);
                    navigate("/messages");
                }
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast.error("Failed to delete conversation");
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#071025] via-[#071b2b] to-[#05141b] text-white">
            <div className="flex h-screen">
                {/* Conversations Sidebar */}
                <div className="w-full md:w-1/3 lg:w-1/4 border-r border-white/10 flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
                            <MessageCircle size={28} className="text-teal-400" />
                            Messages
                        </h1>
                        {/* Search */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-teal-500 transition"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">Loading...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <MessageCircle size={48} className="mx-auto mb-2 text-gray-600" />
                                <p>No conversations yet</p>
                                <p className="text-sm mt-2">Start chatting with recruiters or candidates</p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => {
                                const otherUser = getOtherParticipant(conversation);
                                const isSelected = selectedConversation?._id === conversation._id;

                                return (
                                    <div
                                        key={conversation._id}
                                        onClick={() => handleSelectConversation(conversation)}
                                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${isSelected ? "bg-teal-500/20" : "hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            {otherUser?.profilePic ? (
                                                <img
                                                    src={otherUser.profilePic}
                                                    alt={otherUser.fullname}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                                                    {otherUser?.fullname?.charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-semibold truncate">{otherUser?.fullname}</h3>
                                                    <button
                                                        onClick={(e) => handleDeleteConversation(conversation._id, e)}
                                                        className="text-gray-400 hover:text-red-400"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                {conversation.relatedJob && (
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {conversation.relatedJob.title}
                                                    </p>
                                                )}
                                                {conversation.lastMessage && (
                                                    <p className="text-sm text-gray-300 truncate mt-1">
                                                        {conversation.lastMessage.content}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        {moment(conversation.lastMessageAt).fromNow()}
                                                    </span>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full">
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

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 flex items-center gap-3">
                                {(() => {
                                    const otherUser = getOtherParticipant(selectedConversation);
                                    return (
                                        <>
                                            {otherUser?.profilePic ? (
                                                <img
                                                    src={otherUser.profilePic}
                                                    alt={otherUser.fullname}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                                                    {otherUser?.fullname?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <h2 className="font-semibold">{otherUser?.fullname}</h2>
                                                {selectedConversation.relatedJob && (
                                                    <p className="text-sm text-gray-400">
                                                        {selectedConversation.relatedJob.title}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message) => {
                                    const isOwn = message.sender._id === user._id;
                                    return (
                                        <div
                                            key={message._id}
                                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                                                <div
                                                    className={`p-3 rounded-lg ${isOwn
                                                            ? "bg-teal-500 text-white"
                                                            : "bg-white/10 text-white"
                                                        }`}
                                                >
                                                    <p className="break-words">{message.content}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {moment(message.createdAt).format("MMM DD, hh:mm A")}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-teal-500 transition"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="px-6 py-3 bg-teal-500 rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageCircle size={64} className="mx-auto mb-4 text-gray-600" />
                                <p className="text-xl">Select a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
