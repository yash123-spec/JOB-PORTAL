import express from "express";
import {
    createJob, getAllJobs, getJobById, applyforJob, getAppliedJobs,
    getJobApplicants, editJob, deleteJob, bookmarkJob, getBookmarkedJobs,
    getCandidateStats, getRecruiterStats, unbookmarkJob, withdrawJobApplication, updateApplicationStatus
} from "../controllers/job.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware.js";
import { uploadResume } from '../middlewares/multer.middleware.js';

const jobRouter = express.Router();

// POST routes
jobRouter.post("/jobs", verifyJWT, authorizeRoles("recruiter"), createJob);

// GET routes - IMPORTANT: specific routes MUST come before dynamic :id routes
jobRouter.get("/jobs/applied", verifyJWT, authorizeRoles("candidate"), getAppliedJobs);
jobRouter.get("/jobs/bookmarked", verifyJWT, authorizeRoles("candidate"), getBookmarkedJobs);
jobRouter.get("/jobs/candidate/stats", verifyJWT, authorizeRoles("candidate"), getCandidateStats);
jobRouter.get("/jobs/recruiter/stats", verifyJWT, authorizeRoles("recruiter"), getRecruiterStats);
jobRouter.get("/jobs", getAllJobs);
jobRouter.get("/jobs/:id", getJobById);
jobRouter.get("/jobs/:id/applicants", verifyJWT, authorizeRoles("recruiter"), getJobApplicants);

// POST routes with :id
jobRouter.post("/jobs/:id/apply", verifyJWT, authorizeRoles("candidate"), uploadResume.single('resume'), applyforJob);
jobRouter.post("/jobs/:id/bookmark", verifyJWT, authorizeRoles("candidate"), bookmarkJob);

// PUT routes
jobRouter.put("/jobs/:id", verifyJWT, authorizeRoles("recruiter"), editJob);
jobRouter.put("/applications/:applicationId/status", verifyJWT, authorizeRoles("recruiter"), updateApplicationStatus);

// DELETE routes
jobRouter.delete('/jobs/:id/unbookmark', verifyJWT, authorizeRoles("candidate"), unbookmarkJob);
jobRouter.delete("/jobs/:id/withdraw", verifyJWT, authorizeRoles("candidate"), withdrawJobApplication);
jobRouter.delete("/jobs/:id", verifyJWT, authorizeRoles("recruiter"), deleteJob);




export default jobRouter;
