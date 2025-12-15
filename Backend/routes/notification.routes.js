import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const notificationRouter = express.Router();

// All routes require authentication
notificationRouter.use(verifyJWT);

// GET routes
notificationRouter.get("/notifications", getNotifications);

// PUT routes
notificationRouter.put("/notifications/:id/read", markAsRead);
notificationRouter.put("/notifications/read-all", markAllAsRead);

// DELETE routes
notificationRouter.delete("/notifications/:id", deleteNotification);

export default notificationRouter;
