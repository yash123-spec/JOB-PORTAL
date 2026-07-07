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



// GET routes
messageRouter.get("/conversations", verifyJWT, getConversations);
messageRouter.get("/conversations/:conversationId/messages", verifyJWT, getMessages);
messageRouter.get("/messages/unread-count", verifyJWT, getUnreadCount);

// POST routes
messageRouter.post("/conversations", verifyJWT, getOrCreateConversation);
messageRouter.post("/conversations/:conversationId/messages", verifyJWT, sendMessage);

// DELETE routes
messageRouter.delete("/conversations/:conversationId", verifyJWT, deleteConversation);

export default messageRouter;
