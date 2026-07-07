import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})

import connectDB from "./config/db.js";
import http from "http";
import { initSocket } from "./config/socket.js";
import express from "express";
import cors from "cors"
import compression from "compression"
import cookieParser from "cookie-parser"
import router from "./routes/user.routes.js"
import jobRouter from "./routes/job.routes.js"
import adminRouter from "./routes/admin.routes.js"
import notificationRouter from "./routes/notification.routes.js"
import messageRouter from "./routes/message.routes.js"
import authRouter from "./routes/auth.routes.js"
import recruiterApprovalRouter from "./routes/recruiterApproval.routes.js"
import { errorHandler } from "./middlewares/error.middleware.js";

// Import passport AFTER dotenv is loaded
import passport from "./config/passport.js"

const app = express()
app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true
}))

// Gzip all responses — shrinks JSON payloads (like the jobs list) by ~60-80%
app.use(compression())

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Initialize Passport
app.use(passport.initialize())

// Root route for health check
app.get("/", (req, res) => {
    res.json({
        message: "Job Portal API is running",
        status: "success",
        endpoints: {
            users: "/api/v1/user",
            jobs: "/api/v1/jobs",
            admin: "/api/v1/admin",
            auth: "/api/v1/auth"
        }
    })
})

// Routes
// Routes
app.use("/api/v1/user", router)
app.use("/api/auth", authRouter)  // Google OAuth routes
app.use("/api/v1", jobRouter)
app.use("/api/v1", adminRouter)
app.use("/api/v1", notificationRouter)
app.use("/api/v1", messageRouter)
app.use("/api/v1/admin/recruiters", recruiterApprovalRouter)  // Admin approval routes

// Error Handling Middleware
app.use(errorHandler);

// Connect to DB immediately for Vercel serverless
connectDB().catch(err => console.error('MongoDB connection error:', err));

// Start server only in non-serverless environment
const PORT = process.env.PORT || 8000;
// Use an HTTP server so Socket.io can attach for real-time chat
const httpServer = http.createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`)
});


// Export for Vercel serverless
export default app