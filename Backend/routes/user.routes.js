import express from "express";
import { registerUser, loginUser, getCurrentUser, refreshAccessToken, logoutUser, updateProfile, cleanupOrphanedBookmarks } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadProfilePicture } from "../middlewares/multer.middleware.js";

const router = express.Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/me", verifyJWT, getCurrentUser)
router.post("/refreshAccessToken", refreshAccessToken)
router.post("/logout", verifyJWT, logoutUser)
router.post("/cleanup-bookmarks", verifyJWT, cleanupOrphanedBookmarks)
router.put("/profile", verifyJWT, (req, res, next) => {
    uploadProfilePicture.single('profilePic')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, updateProfile)
export default router