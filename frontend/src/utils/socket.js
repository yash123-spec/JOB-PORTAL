// Singleton Socket.io client. Connects to the backend and authenticates
// automatically via the existing accessToken cookie (withCredentials).
import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
