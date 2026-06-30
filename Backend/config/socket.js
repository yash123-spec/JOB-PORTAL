import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

let io = null;

// Track how many active sockets each user has (a user may have multiple tabs)
const onlineUsers = new Map(); // userId -> connection count

// Minimal cookie parser for the socket handshake header
const parseCookies = (cookieHeader = "") => {
    return cookieHeader.split(";").reduce((acc, part) => {
        const [key, ...v] = part.trim().split("=");
        if (key) acc[key] = decodeURIComponent(v.join("="));
        return acc;
    }, {});
};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:5174"],
            credentials: true,
        },
    });

    // Authenticate every socket using the same accessToken cookie as the REST API
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers?.cookie || "");
            const token =
                cookies.accessToken ||
                socket.handshake.auth?.token; // fallback if sent explicitly

            if (!token) return next(new Error("Unauthorized"));

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded?._id).select("_id fullname role");
            if (!user) return next(new Error("User not found"));

            socket.userId = String(user._id);
            next();
        } catch (err) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.userId;

        // Join a personal room so we can target this user from anywhere
        socket.join(userId);

        // Presence: mark online
        const prev = onlineUsers.get(userId) || 0;
        onlineUsers.set(userId, prev + 1);
        if (prev === 0) {
            socket.broadcast.emit("user:online", { userId });
        }
        // Send the current online list to the newly connected client
        socket.emit("presence:init", { online: Array.from(onlineUsers.keys()) });

        // Typing indicators — relay to the other participant only
        socket.on("typing", ({ toUserId, conversationId }) => {
            if (toUserId) io.to(String(toUserId)).emit("typing", { conversationId, fromUserId: userId });
        });
        socket.on("stopTyping", ({ toUserId, conversationId }) => {
            if (toUserId) io.to(String(toUserId)).emit("stopTyping", { conversationId, fromUserId: userId });
        });

        socket.on("disconnect", () => {
            const count = (onlineUsers.get(userId) || 1) - 1;
            if (count <= 0) {
                onlineUsers.delete(userId);
                socket.broadcast.emit("user:offline", { userId });
            } else {
                onlineUsers.set(userId, count);
            }
        });
    });

    return io;
};

export const getIO = () => io;

// Emit an event to a specific user's room (no-op if sockets aren't initialized)
export const emitToUser = (userId, event, payload) => {
    if (io && userId) io.to(String(userId)).emit(event, payload);
};
