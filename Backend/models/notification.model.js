import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    type: {
        type: String,
        enum: ["application", "status_update", "job_posted"],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    relatedJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
    },
    relatedApplication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String, // URL to navigate to when notification is clicked
    },
}, { timestamps: true });

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
