import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
