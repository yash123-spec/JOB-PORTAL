import express from "express";
import {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    deleteConversation,
    getUnreadCount,
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const messageRouter = express.Router();

// All routes require authentication
messageRouter.use(verifyJWT);

// GET routes
messageRouter.get("/conversations", getConversations);
messageRouter.get("/conversations/:conversationId/messages", getMessages);
messageRouter.get("/messages/unread-count", getUnreadCount);

// POST routes
messageRouter.post("/conversations", getOrCreateConversation);
messageRouter.post("/conversations/:conversationId/messages", sendMessage);

// DELETE routes
messageRouter.delete("/conversations/:conversationId", deleteConversation);

export default messageRouter;
