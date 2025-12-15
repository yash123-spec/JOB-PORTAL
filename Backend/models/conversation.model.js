import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    relatedJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
    },
    relatedApplication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Index for faster queries
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ relatedJob: 1 });
conversationSchema.index({ relatedApplication: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
