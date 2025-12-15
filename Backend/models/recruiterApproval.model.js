import mongoose from "mongoose";

const recruiterApprovalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: null
    },
    blockDuration: {
        type: String,
        enum: ['1week', '2weeks', '1month', '2months', 'permanent', 'none'],
        default: 'none'
    },
    blockedUntil: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    companyName: {
        type: String,
        required: true
    },
    companyWebsite: {
        type: String,
        default: null
    },
    designation: {
        type: String,
        default: null
    },
    adminNotes: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Method to check if user can reapply
recruiterApprovalSchema.methods.canReapply = function () {
    if (this.blockDuration === 'none') return true;
    if (this.blockDuration === 'permanent') return false;
    if (!this.blockedUntil) return true;

    return Date.now() > this.blockedUntil;
};

// Method to calculate blocked until date based on duration
recruiterApprovalSchema.methods.setBlockDuration = function (duration) {
    this.blockDuration = duration;

    if (duration === 'none' || duration === 'permanent') {
        this.blockedUntil = null;
        return;
    }

    const now = new Date();
    switch (duration) {
        case '1week':
            this.blockedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
        case '2weeks':
            this.blockedUntil = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            break;
        case '1month':
            this.blockedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        case '2months':
            this.blockedUntil = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
            break;
    }
};

const RecruiterApproval = mongoose.model("RecruiterApproval", recruiterApprovalSchema);

export default RecruiterApproval;
