import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emitToUser } from "../config/socket.js";

// Get all conversations for logged-in user
const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await Conversation.find({
        participants: userId,
    })
        .populate("participants", "fullname email profilePic role")
        .populate("relatedJob", "title company")
        .populate("relatedApplication")
        .populate({
            path: "lastMessage",
            select: "content createdAt sender isRead",
        })
        .sort({ lastMessageAt: -1 });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
        conversations.map(async (conv) => {
            const unreadCount = await Message.countDocuments({
                conversation: conv._id,
                sender: { $ne: userId },
                isRead: false,
            });

            return {
                ...conv.toObject(),
                unreadCount,
            };
        })
    );

    res.status(200).json(new ApiResponse(200, conversationsWithUnread));
});

// Get or create conversation
const getOrCreateConversation = asyncHandler(async (req, res) => {
    const { participantId, jobId, applicationId } = req.body;
    const userId = req.user._id;

    if (!participantId) {
        throw new AppError(400, "Participant ID is required");
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
        throw new AppError(404, "Participant not found");
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, participantId] },
        ...(jobId && { relatedJob: jobId }),
    })
        .populate("participants", "fullname email profilePic role")
        .populate("relatedJob", "title company")
        .populate("relatedApplication");

    // Create new conversation if doesn't exist
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, participantId],
            relatedJob: jobId || null,
            relatedApplication: applicationId || null,
        });

        conversation = await Conversation.findById(conversation._id)
            .populate("participants", "fullname email profilePic role")
            .populate("relatedJob", "title company")
            .populate("relatedApplication");
    }

    res.status(200).json(new ApiResponse(200, conversation));
});

// Get messages for a conversation
const getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new AppError(400, "Invalid conversation ID");
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });

    if (!conversation) {
        throw new AppError(404, "Conversation not found");
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ conversation: conversationId })
        .populate("sender", "fullname email profilePic role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const totalMessages = await Message.countDocuments({ conversation: conversationId });

    // Mark messages as read
    await Message.updateMany(
        {
            conversation: conversationId,
            sender: { $ne: userId },
            isRead: false,
        },
        {
            isRead: true,
            readAt: new Date(),
        }
    );

    res.status(200).json(new ApiResponse(200, {
        messages: messages.reverse(), // Reverse to show oldest first
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: Number(page),
    }));
});

// Send message
const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
        throw new AppError(400, "Message content is required");
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new AppError(400, "Invalid conversation ID");
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    }).populate("participants", "fullname");

    if (!conversation) {
        throw new AppError(404, "Conversation not found");
    }

    // Create message
    const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content: content.trim(),
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate("sender", "fullname email profilePic role");

    // Real-time: deliver to every participant (clients dedupe by message _id)
    conversation.participants.forEach((p) => {
        emitToUser(p._id, "message:new", { conversationId, message });
    });

    res.status(201).json(new ApiResponse(201, message));
});

// Delete conversation
const deleteConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new AppError(400, "Invalid conversation ID");
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });

    if (!conversation) {
        throw new AppError(404, "Conversation not found");
    }

    // Delete all messages
    await Message.deleteMany({ conversation: conversationId });

    // Delete conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json(new ApiResponse(200, null, "Conversation deleted"));
});

// Get unread message count
const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get all user's conversations
    const conversations = await Conversation.find({
        participants: userId,
    });

    const conversationIds = conversations.map((c) => c._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
        conversation: { $in: conversationIds },
        sender: { $ne: userId },
        isRead: false,
    });

    res.status(200).json(new ApiResponse(200, { unreadCount }));
});

export {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    deleteConversation,
    getUnreadCount,
};
