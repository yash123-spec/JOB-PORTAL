import { asyncHandler } from "../utils/asyncHandler.js";
import { Notification } from "../models/notification.model.js";
import mongoose from "mongoose";

// Get all notifications for logged-in user
const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const filter = { recipient: userId };
    if (unreadOnly === "true") {
        filter.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find(filter)
        .populate("sender", "fullname email profilePic")
        .populate("relatedJob", "title company")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const totalNotifications = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    res.status(200).json({
        success: true,
        data: notifications,
        unreadCount,
        totalNotifications,
        totalPages: Math.ceil(totalNotifications / limit),
        currentPage: Number(page),
    });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID",
        });
    }

    const notification = await Notification.findOne({ _id: id, recipient: userId });

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found",
        });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
    });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read",
    });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid notification ID",
        });
    }

    const notification = await Notification.findOneAndDelete({ _id: id, recipient: userId });

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Notification not found",
        });
    }

    res.status(200).json({
        success: true,
        message: "Notification deleted",
    });
});

// Helper function to create notification (used by other controllers)
export const createNotification = async ({
    recipient,
    sender,
    type,
    title,
    message,
    relatedJob,
    relatedApplication,
    link,
}) => {
    try {
        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            relatedJob,
            relatedApplication,
            link,
        });
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
};

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
