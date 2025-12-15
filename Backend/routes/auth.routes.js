import express from "express";
import passportConfig from "../config/passport.js";
import {
    recruiterRegister,
    verifyOTP,
    resendOTP,
    googleAuthCallback,
    appleAuthCallback,
    getAuthUser
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Recruiter Registration Routes
router.post("/recruiter/register", recruiterRegister);
router.post("/recruiter/verify-otp", verifyOTP);
router.post("/recruiter/resend-otp", resendOTP);

// Google OAuth Routes
router.get("/google", passportConfig.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"  // Force account selection every time
}));
router.get("/google/callback",
    passportConfig.authenticate("google", {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
        session: false
    }),
    googleAuthCallback
);

// Apple OAuth Routes
router.get("/apple", passportConfig.authenticate("apple"));
router.post("/apple/callback",
    passportConfig.authenticate("apple", {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
        session: false
    }),
    appleAuthCallback
);

// Get authenticated user (for OAuth success page)
router.get("/me", verifyJWT, getAuthUser);

export default router;
