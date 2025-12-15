import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
})

import connectDB from "./config/db.js";
import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"
import router from "./routes/user.routes.js"
import jobRouter from "./routes/job.routes.js"
import adminRouter from "./routes/admin.routes.js"
import notificationRouter from "./routes/notification.routes.js"
import messageRouter from "./routes/message.routes.js"
import authRouter from "./routes/auth.routes.js"
import recruiterApprovalRouter from "./routes/recruiterApproval.routes.js"

// Import passport AFTER dotenv is loaded
import passport from "./config/passport.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Initialize Passport
app.use(passport.initialize())

// Routes
app.use("/api/v1/user", router)
app.use("/api/v1", jobRouter)
app.use("/api/v1", adminRouter)
app.use("/api/v1", notificationRouter)
app.use("/api/v1", messageRouter)
app.use("/api/auth", authRouter)  // OAuth and OTP routes
app.use("/api/admin/recruiters", recruiterApprovalRouter)  // Admin approval routes



connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on PORT:${process.env.PORT}`)
        })
    })

    .catch((error) => {
        console.log(`Connection failed:${error.message}`)
    })