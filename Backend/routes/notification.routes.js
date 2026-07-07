import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const notificationRouter = express.Router();



// GET routes
notificationRouter.get("/notifications", verifyJWT, getNotifications);

// PUT routes
notificationRouter.put("/notifications/:id/read", verifyJWT, markAsRead);
notificationRouter.put("/notifications/read-all", verifyJWT, markAllAsRead);
// DELETE routes
notificationRouter.delete("/notifications/:id", verifyJWT, deleteNotification);

export default notificationRouter;
