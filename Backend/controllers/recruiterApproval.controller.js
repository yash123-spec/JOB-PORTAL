import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import RecruiterApproval from "../models/recruiterApproval.model.js";
import { sendApprovalEmail, sendRejectionEmail } from "../utils/sendEmail.js";

// Get all pending recruiter applications
export const getPendingRecruiters = asyncHandler(async (req, res) => {
    const { status = 'pending', page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'all') {
        query.status = status;
    }

    const skip = (page - 1) * limit;

    const recruiters = await RecruiterApproval.find(query)
        .populate('user', '-password -refreshToken')
        .populate('approvedBy', 'fullname email')
        .populate('rejectedBy', 'fullname email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await RecruiterApproval.countDocuments(query);

    res.status(200).json({
        success: true,
        data: recruiters,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    });
});

// Get single recruiter application details
export const getRecruiterDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const recruiter = await RecruiterApproval.findById(id)
        .populate('user', '-password -refreshToken')
        .populate('approvedBy', 'fullname email')
        .populate('rejectedBy', 'fullname email');

    if (!recruiter) {
        return res.status(404).json({
            success: false,
            message: "Recruiter application not found"
        });
    }

    res.status(200).json({
        success: true,
        data: recruiter
    });
});

// Approve recruiter
export const approveRecruiter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const recruiterApproval = await RecruiterApproval.findById(id).populate('user');

    if (!recruiterApproval) {
        return res.status(404).json({
            success: false,
            message: "Recruiter application not found"
        });
    }

    if (recruiterApproval.status === 'approved') {
        return res.status(400).json({
            success: false,
            message: "Recruiter already approved"
        });
    }

    // Update recruiter approval record
    recruiterApproval.status = 'approved';
    recruiterApproval.approvedBy = adminId;
    recruiterApproval.approvedAt = new Date();
    recruiterApproval.adminNotes = adminNotes || null;
    recruiterApproval.blockDuration = 'none';
    recruiterApproval.blockedUntil = null;
    await recruiterApproval.save();

    // Update user account status
    const user = await User.findById(recruiterApproval.user._id);
    user.accountStatus = 'approved';
    await user.save();

    // Send approval email
    try {
        await sendApprovalEmail(user.email, user.fullname);
    } catch (error) {
        console.error("Error sending approval email:", error);
        // Don't fail the approval if email fails
    }

    res.status(200).json({
        success: true,
        message: "Recruiter approved successfully",
        data: recruiterApproval
    });
});

// Reject recruiter with custom block duration
export const rejectRecruiter = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason, blockDuration, adminNotes } = req.body;
    const adminId = req.user._id;

    if (!rejectionReason) {
        return res.status(400).json({
            success: false,
            message: "Rejection reason is required"
        });
    }

    if (!blockDuration || !['1week', '2weeks', '1month', '2months', 'permanent', 'none'].includes(blockDuration)) {
        return res.status(400).json({
            success: false,
            message: "Valid block duration is required (1week, 2weeks, 1month, 2months, permanent, or none)"
        });
    }

    const recruiterApproval = await RecruiterApproval.findById(id).populate('user');

    if (!recruiterApproval) {
        return res.status(404).json({
            success: false,
            message: "Recruiter application not found"
        });
    }

    if (recruiterApproval.status === 'approved') {
        return res.status(400).json({
            success: false,
            message: "Cannot reject an approved recruiter"
        });
    }

    // Update recruiter approval record
    recruiterApproval.status = 'rejected';
    recruiterApproval.rejectionReason = rejectionReason;
    recruiterApproval.rejectedBy = adminId;
    recruiterApproval.rejectedAt = new Date();
    recruiterApproval.adminNotes = adminNotes || null;
    recruiterApproval.setBlockDuration(blockDuration);
    await recruiterApproval.save();

    // Update user account status
    const user = await User.findById(recruiterApproval.user._id);
    user.accountStatus = 'rejected';
    await user.save();

    // Send rejection email
    try {
        await sendRejectionEmail(user.email, user.fullname, rejectionReason, blockDuration);
    } catch (error) {
        console.error("Error sending rejection email:", error);
        // Don't fail the rejection if email fails
    }

    res.status(200).json({
        success: true,
        message: "Recruiter rejected successfully",
        data: recruiterApproval
    });
});

// Delete recruiter application (soft delete - mark as rejected permanently)
export const deleteRecruiterApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const recruiterApproval = await RecruiterApproval.findById(id);

    if (!recruiterApproval) {
        return res.status(404).json({
            success: false,
            message: "Recruiter application not found"
        });
    }

    // Delete the application
    await RecruiterApproval.findByIdAndDelete(id);

    // Also delete the user if they're still pending
    if (recruiterApproval.status === 'pending') {
        await User.findByIdAndDelete(recruiterApproval.user);
    }

    res.status(200).json({
        success: true,
        message: "Recruiter application deleted successfully"
    });
});

// Get recruiter statistics for admin dashboard
export const getRecruiterStats = asyncHandler(async (req, res) => {
    const pending = await RecruiterApproval.countDocuments({ status: 'pending' });
    const approved = await RecruiterApproval.countDocuments({ status: 'approved' });
    const rejected = await RecruiterApproval.countDocuments({ status: 'rejected' });

    const recentApplications = await RecruiterApproval.find()
        .populate('user', 'fullname email')
        .sort({ createdAt: -1 })
        .limit(5);

    res.status(200).json({
        success: true,
        data: {
            stats: {
                pending,
                approved,
                rejected,
                total: pending + approved + rejected
            },
            recentApplications
        }
    });
});
