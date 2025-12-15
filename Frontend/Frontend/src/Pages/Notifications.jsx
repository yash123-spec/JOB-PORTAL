// src/Pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { Bell, Trash2, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { notificationAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unread
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchNotifications();
    }, [user, navigate]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = filter === "unread" ? { unreadOnly: true } : {};
            const response = await notificationAPI.getNotifications(params);
            if (response.success) {
                setNotifications(response.data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.isRead) {
            try {
                await notificationAPI.markAsRead(notification._id);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error("Error marking as read:", error);
            }
        }

        // Navigate to link
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notificationAPI.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            toast.success("Notification deleted");
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast.error("Failed to delete notification");
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case "application":
                return "📝";
            case "status_update":
                return "🔔";
            case "job_posted":
                return "💼";
            default:
                return "📢";
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case "application":
                return "border-l-4 border-blue-500";
            case "status_update":
                return "border-l-4 border-green-500";
            case "job_posted":
                return "border-l-4 border-purple-500";
            default:
                return "border-l-4 border-gray-500";
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#071025] via-[#071b2b] to-[#05141b] py-12 px-4 text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <Bell size={32} className="text-teal-400" />
                        Notifications
                    </h1>
                    <p className="text-gray-300 mt-2">
                        Stay updated with your job applications and status changes
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white/5 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-md transition ${filter === "all"
                                    ? "bg-teal-500 text-white"
                                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                                }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`px-4 py-2 rounded-md transition ${filter === "unread"
                                    ? "bg-teal-500 text-white"
                                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                                }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/30 transition"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-20 text-gray-300">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell size={64} className="mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                            No notifications yet
                        </h3>
                        <p className="text-gray-500">
                            {filter === "unread"
                                ? "You're all caught up! No unread notifications."
                                : "We'll notify you when there's something new."}
                        </p>
                        {filter === "unread" && (
                            <button
                                onClick={() => setFilter("all")}
                                className="mt-4 text-teal-400 hover:text-teal-300"
                            >
                                View all notifications
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`bg-white/5 rounded-lg p-5 transition-all cursor-pointer hover:bg-white/10 ${getNotificationColor(notification.type)
                                    } ${!notification.isRead ? "bg-blue-500/10" : ""}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="text-3xl flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                {notification.title}
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </h3>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(notification._id);
                                                }}
                                                className="text-gray-400 hover:text-red-400 transition flex-shrink-0"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <p className="text-gray-300 mb-3">{notification.message}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span>{moment(notification.createdAt).fromNow()}</span>
                                            {notification.relatedJob?.title && (
                                                <span className="flex items-center gap-1">
                                                    <span>·</span>
                                                    <span className="truncate">
                                                        {notification.relatedJob.title}
                                                    </span>
                                                </span>
                                            )}
                                            {notification.sender?.fullname && (
                                                <span className="flex items-center gap-1">
                                                    <span>·</span>
                                                    <span>from {notification.sender.fullname}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
