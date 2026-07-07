// src/Pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { Bell, Trash2, CheckCheck, FileText, RefreshCw, Briefcase, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { notificationAPI } from "../utils/api";
import { ListRowSkeleton } from "../Components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, unread
    const { user } = useAuth();
    const navigate = useNavigate();

    // Single source of truth: fetch once on mount and re-fetch only when the
    // filter changes (previously two effects both fetched on mount → 2 calls).
    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        fetchNotifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filter]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = filter === "unread" ? { unreadOnly: true } : {};
            const response = await notificationAPI.getNotifications(params);
            if (response.success) {
                setNotifications(Array.isArray(response.data?.notifications) ? response.data.notifications : []);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

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

    // Presentation-only: notification type -> colored lucide icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case "application":
                return { Icon: FileText, classes: "bg-brand-light text-brand" };
            case "status_update":
                return { Icon: RefreshCw, classes: "bg-blue-100 text-blue-600" };
            case "job_posted":
                return { Icon: Briefcase, classes: "bg-amber-100 text-amber-600" };
            default:
                return { Icon: Megaphone, classes: "bg-gray-100 text-gray-500" };
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case "application":
                return "border-l-4 border-brand";
            case "status_update":
                return "border-l-4 border-blue-500";
            case "job_posted":
                return "border-l-4 border-amber-500";
            default:
                return "border-l-4 border-gray-300";
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero band ===== */}
            <section className="bg-ink py-14 px-4 text-center text-white">
                <h1 className="flex items-center justify-center gap-3 font-display text-4xl font-bold md:text-5xl">
                    <Bell size={34} className="text-brand" />
                    Notifications
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-gray-300">
                    Stay updated with your job applications and status changes.
                </p>
            </section>

            <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
                {/* Controls */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === "all"
                                ? "bg-brand text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === "unread"
                                ? "bg-brand text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand/10"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => <ListRowSkeleton key={i} />)}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
                            <Bell size={30} />
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold text-ink">
                            No notifications yet
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filter === "unread"
                                ? "You're all caught up! No unread notifications."
                                : "We'll notify you when there's something new."}
                        </p>
                        {filter === "unread" && (
                            <button
                                onClick={() => setFilter("all")}
                                className="mt-4 text-sm font-medium text-brand hover:text-brand-dark"
                            >
                                View all notifications
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const { Icon, classes } = getNotificationIcon(notification.type);
                            return (
                                <div
                                    key={notification._id}
                                    className={`cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md ${getNotificationColor(notification.type)} ${!notification.isRead ? "bg-brand-mint" : ""}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${classes}`}>
                                            <Icon size={20} />
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex items-start justify-between gap-4">
                                                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                                                    {notification.title}
                                                    {!notification.isRead && (
                                                        <span className="h-2 w-2 rounded-full bg-brand"></span>
                                                    )}
                                                </h3>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notification._id);
                                                    }}
                                                    className="flex-shrink-0 text-gray-400 transition hover:text-red-500"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <p className="mb-3 text-gray-600">{notification.message}</p>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
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
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
