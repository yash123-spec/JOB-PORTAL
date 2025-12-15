import express from "express";
import {
    getPendingRecruiters,
    getRecruiterDetails,
    approveRecruiter,
    rejectRecruiter,
    deleteRecruiterApplication,
    getRecruiterStats
} from "../controllers/recruiterApproval.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(verifyJWT, authorizeRoles("admin"));

// Get recruiter statistics
router.get("/stats", getRecruiterStats);

// Get all pending/approved/rejected recruiters
router.get("/", getPendingRecruiters);

// Get single recruiter details
router.get("/:id", getRecruiterDetails);

// Approve recruiter
router.put("/:id/approve", approveRecruiter);

// Reject recruiter with custom block duration
router.put("/:id/reject", rejectRecruiter);

// Delete recruiter application
router.delete("/:id", deleteRecruiterApplication);

export default router;
