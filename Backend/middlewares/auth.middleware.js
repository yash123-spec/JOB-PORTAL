import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

        if (!token) {
            return res.status(404).json({ success: false, message: "Unauthorized request" })
        }


        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!!" })
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support."
            })
        }

        // Check recruiter approval status for recruiter-specific routes
        // Skip this check for general routes (like profile, bookmarks)
        if (user.role === 'recruiter' && user.accountStatus !== 'approved') {
            // Allow access to profile and general routes, but block recruiter-specific actions
            const isRecruiterAction = req.path.includes('/jobs') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE');

            if (isRecruiterAction) {
                const statusMessages = {
                    'pending': 'Your recruiter account is pending admin approval.',
                    'rejected': 'Your recruiter account has been rejected.',
                    'blocked': 'Your account has been blocked.'
                };

                return res.status(403).json({
                    success: false,
                    message: statusMessages[user.accountStatus] || 'Access denied',
                    accountStatus: user.accountStatus
                })
            }
        }

        req.user = user
        next()


    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
})


