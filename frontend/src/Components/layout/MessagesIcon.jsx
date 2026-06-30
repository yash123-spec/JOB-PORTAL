// Navbar Messages dropdown: hover the icon to preview recent conversations
// (each person + their last message + time + unread), organized newest-first.
// Live-updated via Socket.io. "View all messages" opens the full inbox.
import React, { useEffect, useState, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { messageAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { getSocket } from "../../utils/socket";

const MessagesIcon = () => {
    const [open, setOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const closeTimer = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await messageAPI.getConversations();
            if (res.success) setConversations(Array.isArray(res.data) ? res.data : []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    // Load on mount + when route changes (covers reading a thread), refresh live on new messages
    useEffect(() => {
        if (user) fetchConversations();
    }, [user, location.pathname]);

    useEffect(() => {
        if (!user) return;
        const socket = getSocket();
        const onNewMessage = () => fetchConversations();
        socket.on("message:new", onNewMessage);
        return () => socket.off("message:new", onNewMessage);
    }, [user]);

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    const otherParticipant = (conv) =>
        conv.participants?.find((p) => p._id !== user?._id);

    // Hover open/close with a small delay so moving into the panel doesn't close it
    const handleEnter = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const handleLeave = () => {
        closeTimer.current = setTimeout(() => setOpen(false), 200);
    };

    const openConversation = (id) => {
        setOpen(false);
        navigate(`/messages/${id}`);
    };

    return (
        <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
            <button
                onClick={() => navigate("/messages")}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Messages"
                aria-label="Messages"
            >
                <MessageCircle size={22} className="text-white" />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-white text-gray-800 rounded-lg shadow-2xl border z-50 max-h-[520px] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                    </div>

                    {/* Conversation list */}
                    <div className="overflow-y-auto flex-1">
                        {loading && conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageCircle size={40} className="mx-auto mb-2 text-gray-300" />
                                <p>No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const other = otherParticipant(conv);
                                const last = conv.lastMessage;
                                const unread = conv.unreadCount > 0;
                                return (
                                    <div
                                        key={conv._id}
                                        onClick={() => openConversation(conv._id)}
                                        className={`flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors ${unread ? "bg-teal-50 hover:bg-teal-100" : "hover:bg-gray-50"}`}
                                    >
                                        {/* Avatar */}
                                        {other?.profilePic ? (
                                            <img src={other.profilePic} alt={other.fullname} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-semibold flex-shrink-0">
                                                {other?.fullname?.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-semibold text-gray-900 truncate">{other?.fullname || "User"}</span>
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {conv.lastMessageAt ? moment(conv.lastMessageAt).fromNow(true) : ""}
                                                </span>
                                            </div>
                                            {conv.relatedJob?.title && (
                                                <p className="text-xs text-gray-400 truncate">{conv.relatedJob.title}</p>
                                            )}
                                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                                <p className={`text-sm truncate ${unread ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                                                    {last?.content || "No messages yet"}
                                                </p>
                                                {unread && (
                                                    <span className="bg-teal-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-semibold flex-shrink-0">
                                                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {conversations.length > 0 && (
                        <div className="p-3 border-t bg-gray-50">
                            <button
                                onClick={() => { setOpen(false); navigate("/messages"); }}
                                className="text-sm text-teal-600 hover:text-teal-800 w-full text-center font-medium"
                            >
                                View all messages
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessagesIcon;
