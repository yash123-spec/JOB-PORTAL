import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import RecruiterApproval from "../models/recruiterApproval.model.js";
import { AppError } from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createNotification } from "./notification.controller.js";



// Generate Access and Refresh Tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new AppError(500, "Error generating tokens: " + error.message);
    }
};

// Recruiter Registration 
export const recruiterRegister = asyncHandler(async (req, res) => {
    const { fullname, email, password, companyName, companyWebsite, designation } = req.body;

    if (!fullname || !email || !password || !companyName) {
        throw new AppError(400, "Full name, email, password and company name are required");
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw new AppError(400, "Please provide a valid email address");
    }
    if (password.length < 6) {
        throw new AppError(400, "Password must be at least 6 characters");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError(400, "Email already registered");
    }

    const user = await User.create({
        fullname,
        email,
        password,
        role: 'recruiter',
        authProvider: 'local',
        emailVerified: true,
        accountStatus: 'pending'
    });

    await RecruiterApproval.create({
        user: user._id,
        companyName,
        companyWebsite: companyWebsite || null,
        designation: designation || null
    });

    // Notify all admins in-app about the new pending recruiter (non-blocking — must not fail registration)
    try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        await Promise.all(admins.map((admin) =>
            createNotification({
                recipient: admin._id,
                sender: user._id,
                type: 'recruiter_request',
                title: 'New Recruiter Pending Approval',
                message: `${user.fullname} (${companyName}) has registered and is awaiting your approval.`,
                link: '/admin'
            })
        ));
    } catch (notifyError) {
        console.error("Failed to create admin notification for pending recruiter:", notifyError);
    }

    return res.status(201).json(new ApiResponse(201, {
        email: user.email,
        fullname: user.fullname,
        accountStatus: user.accountStatus
    }, "Registration successful. Pending admin approval."));
});


// Google OAuth Callback (after successful Google authentication)
export const googleAuthCallback = asyncHandler(async (req, res) => {
    // This will be called after Passport Google strategy authenticates
    // req.user will contain the authenticated user
    const user = req.user;

    if (!user) {
        throw new AppError(401, "Authentication failed");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000           // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });


    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/jobs`);
});


// Get authenticated user info (for OAuth success page)
export const getAuthUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if (!user) {
        throw new AppError(404, "User not found");
    }

    res.status(200).json(new ApiResponse(200, user));
});
