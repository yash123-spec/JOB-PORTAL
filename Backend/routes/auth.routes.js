import express from "express";
import passportConfig from "../config/passport.js";
import {
    googleAuthCallback,
    getAuthUser
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();


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


// Get authenticated user (for OAuth success page)
router.get("/me", verifyJWT, getAuthUser);

export default router;
