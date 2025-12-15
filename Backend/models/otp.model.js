import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"]
    },
    otp: {
        type: String,
        required: true,
        length: 6
    },
    purpose: {
        type: String,
        enum: ['registration', 'password-reset'],
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Maximum 3 attempts
    }
}, { timestamps: true });

// Automatically delete OTP documents after they expire
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if OTP is expired
otpSchema.methods.isExpired = function () {
    return Date.now() > this.expiresAt;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = async function () {
    this.attempts += 1;
    await this.save();
    return this.attempts;
};

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
