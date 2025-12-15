// src/Components/NotificationDropdown.jsx
import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { notificationAPI } from "../utils/api";

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await notificationAPI.getNotifications({ limit: 10 });
            if (response.success) {
                setNotifications(response.data);
                setUnreadCount(response.unreadCount);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.isRead) {
            try {
                await notificationAPI.markAsRead(notification._id);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Error marking as read:", error);
            }
        }

        // Navigate to link
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to mark all as read");
        }
    };

    const handleDelete = async (notificationId, e) => {
        e.stopPropagation();
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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
                <Bell size={22} className="text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 border-b cursor-pointer transition-colors ${notification.isRead
                                            ? "bg-white hover:bg-gray-50"
                                            : "bg-blue-50 hover:bg-blue-100"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                        {notification.title}
                                                    </h4>
                                                    <button
                                                        onClick={(e) => handleDelete(notification._id, e)}
                                                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-400">
                                                        {moment(notification.createdAt).fromNow()}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t bg-gray-50">
                            <button
                                onClick={() => {
                                    navigate("/notifications");
                                    setIsOpen(false);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
