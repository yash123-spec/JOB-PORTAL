import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import RecruiterApproval from "../models/recruiterApproval.model.js";
import { sendOTPEmail } from "../utils/sendEmail.js";

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

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
        throw new Error("Error generating tokens");
    }
};

// Recruiter Registration with OTP
export const recruiterRegister = asyncHandler(async (req, res) => {
    const { fullname, email, password, companyName, companyWebsite, designation } = req.body;

    // Validation
    if (!fullname || !email || !password || !companyName) {
        return res.status(400).json({
            success: false,
            message: "Full name, email, password, and company name are required"
        });
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    // Password length validation
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long"
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "Email already registered"
        });
    }

    // Check if there's a pending/rejected application
    const existingApproval = await RecruiterApproval.findOne({
        companyName,
        status: { $in: ['pending', 'rejected'] }
    }).populate('user');

    if (existingApproval) {
        if (existingApproval.status === 'pending') {
            return res.status(400).json({
                success: false,
                message: "An application for this company is already pending approval"
            });
        }

        // Check if recruiter can reapply
        if (existingApproval.status === 'rejected' && !existingApproval.canReapply()) {
            const blockedUntil = existingApproval.blockedUntil;
            return res.status(403).json({
                success: false,
                message: `You are blocked from reapplying until ${blockedUntil ? blockedUntil.toLocaleDateString() : 'permanently'}`
            });
        }
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Save OTP to database
    const otpDoc = await OTP.create({
        email,
        otp,
        purpose: 'registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP via email
    try {
        await sendOTPEmail(email, otp, 'registration');
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP email. Please try again."
        });
    }

    // Store registration data temporarily (you might want to use a session or cache)
    // For now, we'll send it back and expect it in verify-otp request
    res.status(200).json({
        success: true,
        message: "OTP sent to your email. Please verify to complete registration.",
        data: {
            email,
            otpExpiry: otpDoc.expiresAt
        }
    });
});

// Verify OTP and Complete Registration
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp, fullname, password, companyName, companyWebsite, designation } = req.body;

    if (!email || !otp || !fullname || !password || !companyName) {
        return res.status(400).json({
            success: false,
            message: "All required fields must be provided"
        });
    }

    // Find OTP
    const otpDoc = await OTP.findOne({ email, purpose: 'registration' }).sort({ createdAt: -1 });

    if (!otpDoc) {
        return res.status(400).json({
            success: false,
            message: "OTP not found or expired. Please request a new one."
        });
    }

    // Check if OTP is expired
    if (otpDoc.isExpired()) {
        await OTP.deleteOne({ _id: otpDoc._id });
        return res.status(400).json({
            success: false,
            message: "OTP has expired. Please request a new one."
        });
    }

    // Check if max attempts exceeded
    if (otpDoc.attempts >= 3) {
        await OTP.deleteOne({ _id: otpDoc._id });
        return res.status(400).json({
            success: false,
            message: "Maximum OTP attempts exceeded. Please request a new one."
        });
    }

    // Verify OTP
    if (otpDoc.otp !== otp.toString()) {
        await otpDoc.incrementAttempts();
        const remainingAttempts = 3 - (otpDoc.attempts + 1);
        return res.status(400).json({
            success: false,
            message: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
        });
    }

    // Create user with pending status
    const user = await User.create({
        fullname,
        email,
        password,
        role: 'recruiter',
        authProvider: 'local',
        emailVerified: true,
        accountStatus: 'pending'
    });

    // Create recruiter approval record
    await RecruiterApproval.create({
        user: user._id,
        status: 'pending',
        companyName,
        companyWebsite: companyWebsite || null,
        designation: designation || null
    });

    // Mark OTP as verified and delete
    await OTP.deleteOne({ _id: otpDoc._id });

    res.status(201).json({
        success: true,
        message: "Registration successful! Your account is pending admin approval. You will receive an email once approved.",
        data: {
            email: user.email,
            fullname: user.fullname,
            accountStatus: user.accountStatus
        }
    });
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required"
        });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "Email already registered"
        });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Delete existing OTPs
    await OTP.deleteMany({ email });

    // Create new OTP
    const otpDoc = await OTP.create({
        email,
        otp,
        purpose: 'registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP
    try {
        await sendOTPEmail(email, otp, 'registration');
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP email. Please try again."
        });
    }

    res.status(200).json({
        success: true,
        message: "New OTP sent to your email",
        data: {
            otpExpiry: otpDoc.expiresAt
        }
    });
});

// Google OAuth Callback (after successful Google authentication)
export const googleAuthCallback = asyncHandler(async (req, res) => {
    // This will be called after Passport Google strategy authenticates
    // req.user will contain the authenticated user
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    // Redirect to frontend with tokens
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
});

// Apple OAuth Callback
export const appleAuthCallback = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed"
        });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`);
});

// Get authenticated user info (for OAuth success page)
export const getAuthUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    res.status(200).json({
        success: true,
        data: user
    });
});
