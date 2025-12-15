import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { createAuditLog } from "../utils/logAudit.js";
import bufferToStream from "../utils/bufferToStream.js"
import cloudinary from "../utils/cloudinary.js"
import { createNotification } from "./notification.controller.js";


//jobCreation logic
const createJob = asyncHandler(async (req, res) => {
  const { title, company, responsibilities, skills, jobTime, salaryMin, salaryMax, location, type, companyWebsite } = req.body;

  // Safer validation
  if ([title, company, jobTime, location, type].some(field => typeof field !== 'string' || field.trim() === '')) {
    return res.status(400).json({ success: false, message: "All required fields must be provided!!" });
  }

  // Validate responsibilities and skills arrays
  if (!responsibilities || !Array.isArray(responsibilities) || responsibilities.length === 0) {
    return res.status(400).json({ success: false, message: "At least one responsibility is required!!" });
  }

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ success: false, message: "At least one skill is required!!" });
  }

  //check if user is active
  if (!req.user.isActive) {
    return res.status(407)
      .json({
        success: false,
        message: "Your account has been deactivated! Please contact support!!"
      })
  }

  const jobData = {
    title,
    company,
    responsibilities,
    skills,
    jobTime,
    location,
    type,
    createdBy: req.user._id
  };

  // Add optional companyWebsite if provided
  if (companyWebsite && companyWebsite.trim()) {
    jobData.companyWebsite = companyWebsite.trim();
  }

  // Add numeric salary values and auto-generate display string
  if (salaryMin && salaryMax) {
    const min = Number(salaryMin);
    const max = Number(salaryMax);

    if (min >= max) {
      return res.status(400).json({
        success: false,
        message: "Minimum salary must be less than maximum salary"
      });
    }

    jobData.salaryMin = min;
    jobData.salaryMax = max;
    // Auto-generate display string from numeric values
    jobData.salaryRange = `₹${min} - ₹${max} LPA`;
  }

  const job = await Job.create(jobData);

  // AUDIT LOG
  await createAuditLog({
    userId: req.user._id,
    action: "CREATE_JOB",
    metadata: { jobId: job._id, title },
  });

  res.status(201).json({
    success: true,
    data: job,
    message: "Job posted successfully!!"
  });
});

//get All Jobs
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    company,
    jobTime,
    location,
    search,
    type,
    salaryMin,
    salaryMax,
    postedDays,
    minApplicants,
    maxApplicants,
    createdBy,
    page = 1,
    limit = 10
  } = req.query;

  const filter = {};

  // Exact match filters
  if (type) filter.type = type;
  if (jobTime) filter.jobTime = jobTime;
  if (createdBy) filter.createdBy = createdBy;

  // Partial match + case-insensitive filters
  if (company) filter.company = { $regex: company, $options: "i" };
  if (location) filter.location = { $regex: location, $options: "i" };

  // Search filter (case-insensitive regex)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { responsibilities: { $elemMatch: { $regex: search, $options: "i" } } },
      { skills: { $elemMatch: { $regex: search, $options: "i" } } }
    ]
  }

  // Salary range overlap filter
  // User wants jobs where salary ranges intersect with their filter
  // Overlap condition: userMin <= jobMax AND userMax >= jobMin
  if (salaryMin || salaryMax) {
    const userMin = salaryMin ? Number(salaryMin) : 0;
    const userMax = salaryMax ? Number(salaryMax) : Number.MAX_SAFE_INTEGER;

    filter.$and = filter.$and || [];
    filter.$and.push({
      // Job MUST have numeric salary range that overlaps
      $and: [
        { salaryMin: { $ne: null, $exists: true } },
        { salaryMax: { $ne: null, $exists: true } },
        { salaryMin: { $lte: userMax } },
        { salaryMax: { $gte: userMin } }
      ]
    });
  }

  // Posted date filter (last X days)
  if (postedDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(postedDays));
    filter.createdAt = { $gte: daysAgo };
  }

  const skip = (Number(page) - 1) * Number(limit);

  let jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Filter by applicants count (done after query since it's array length)
  if (minApplicants || maxApplicants) {
    jobs = jobs.filter(job => {
      const count = job.applicants?.length || 0;
      if (minApplicants && count < Number(minApplicants)) return false;
      if (maxApplicants && count > Number(maxApplicants)) return false;
      return true;
    });
  }

  const totalJobs = await Job.countDocuments(filter);

  res.status(200).json({
    success: true,
    totalJobs,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: Number(page),
    data: jobs,
  });
});

//finding job by Id
const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job Id!!"
    })
  }

  const job = await Job.findById(id).populate("createdBy", "fullname email")

  if (!job) {
    return res.status(400).json({
      success: false,
      message: "Job not found!!"
    })

  }

  res.status(201)
    .json({
      success: true,
      data: job,
      message: "Job fetched successfully!!"
    })

})


//Aplying for job through jobId
const applyforJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(409).json({
      success: false,
      message: "Invalid Job Id"
    });
  }

  // 2. Find the job
  const job = await Job.findById(jobId)

  if (!job) {
    return res.status(403).json({
      success: false,
      message: "Could not find the job!!"
    });
  }

  // 3. Prevent recruiter from applying
  if (req.user.role !== "candidate") {
    return res.status(404).json({
      success: false,
      message: "Only candidate can apply for the JOB!!"
    });
  }

  //check if user is active
  if (!req.user.isActive) {
    return res.status(407)
      .json({
        success: false,
        message: "Your account has been deactivated! Please contact support!!"
      })
  }

  // 4. Prevent duplicate applications - check Application collection
  const existingApplication = await Application.findOne({
    user: req.user._id,
    job: jobId
  });

  if (existingApplication) {
    return res.status(404).json({
      success: false,
      message: "You have already applied for this JOB!!"
    });
  }

  //validate file presence
  if (!req.file) {
    return res.status(402).json({
      success: false,
      message: "resume file required"
    })
  }

  //Extraction extensions from original file name
  const originalExtension = req.file.originalname.split(".").pop()
  const filename = `${req.user._id}-${Date.now()}.${originalExtension}`

  //Upload resume on cloudinary
  const uploadedResume = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "job-portal/resumes",
        public_id: filename
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    )

    bufferToStream(req.file.buffer).pipe(uploadStream);
  })



  let application;
  try {
    application = await Application.create({
      user: req.user._id,
      job: jobId,
      resumeUrl: uploadedResume.secure_url,
      status: "applied"
    });


  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to create application",
      error: error.message
    });
  }


  // Add user ID to job's applicants array
  if (!job.applicants.includes(req.user._id)) {
    job.applicants.push(req.user._id);
    await job.save();
  }

  // Create notification for recruiter
  await createNotification({
    recipient: job.createdBy,
    sender: req.user._id,
    type: "application",
    title: "New Job Application",
    message: `${req.user.fullname} applied for ${job.title}`,
    relatedJob: jobId,
    relatedApplication: application._id,
    link: `/recruiter-dashboard`,
  });

  // AUDIT LOG
  await createAuditLog({
    userId: req.user._id,
    action: "APPLY_JOB",
    metadata: { jobId, applicationId: application._id },
  });

  res.status(200).json({
    success: true,
    message: "Job application successful!!",
    data: {
      applicationId: application._id,
      resumeUrl: uploadedResume.secure_url
    }
  });
});


//get all Applied Jobs
const getAppliedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Fetch applications with job details populated
  const applications = await Application.find({ user: userId })
    .populate('job')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out applications where job has been deleted
  const validApplications = applications.filter(app => app.job !== null);

  // Extract just the job data with application metadata
  const jobs = validApplications.map(app => ({
    ...app.job.toObject(),
    applicationId: app._id,
    appliedAt: app.createdAt,
    applicationStatus: app.status,
    resumeUrl: app.resumeUrl
  }));

  const totalAppliedJobs = await Application.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    totalAppliedJobs,
    totalPages: Math.ceil(totalAppliedJobs / limit),
    currentPage: page,
    data: jobs,
  });
});

//get all candidates that had applied to particular job(Applicants)
const getJobApplicants = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job ID",
    });
  }

  // 2. Find the job
  const job = await Job.findById(jobId).populate("createdBy", "fullName email");

  // 3. If job not found
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // 4. Ensure that only the recruiter who posted it can view applicants
  if (job.createdBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to view applicants for this job",
    });
  }

  // 5. Fetch applications for this job with user details
  const applications = await Application.find({ job: jobId })
    .populate('user', 'fullname email profilePic')
    .sort({ createdAt: -1 });

  // 6. Format the applicants data
  const applicants = applications.map(app => ({
    applicationId: app._id,
    userId: app.user._id,
    fullname: app.user.fullname,
    email: app.user.email,
    profilePic: app.user.profilePic,
    resumeUrl: app.resumeUrl,
    status: app.status,
    appliedAt: app.createdAt
  }));

  // 7. Return the list of applicants
  res.status(200).json({
    success: true,
    totalApplicants: applicants.length,
    data: applicants,
  });
});

//Edit Job
const editJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job Id!!",
    });
  }

  // 2. Find Job
  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found!",
    });
  }

  // 3. Authorization check
  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(401).json({
      success: false,
      message: "You are not allowed to edit the job!!",
    });
  }

  // 4. Update fields conditionally
  const {
    title,
    company,
    responsibilities,
    skills,
    jobTime,
    salaryMin,
    salaryMax,
    location,
    type,
    companyWebsite,
  } = req.body;

  if (title) job.title = title;
  if (company) job.company = company;
  if (responsibilities && Array.isArray(responsibilities)) job.responsibilities = responsibilities;
  if (skills && Array.isArray(skills)) job.skills = skills;
  if (jobTime) job.jobTime = jobTime;
  if (location) job.location = location;
  if (type) job.type = type;
  if (companyWebsite !== undefined) job.companyWebsite = companyWebsite;

  // Update salary fields and auto-generate display string
  if (salaryMin && salaryMax) {
    const min = Number(salaryMin);
    const max = Number(salaryMax);

    if (min >= max) {
      return res.status(400).json({
        success: false,
        message: "Minimum salary must be less than maximum salary"
      });
    }

    job.salaryMin = min;
    job.salaryMax = max;
    job.salaryRange = `₹${min} - ₹${max} LPA`;
  }

  // 5. Save updated job
  const updatedJob = await job.save();

  // AUDIT LOG
  await createAuditLog({
    userId: req.user._id,
    action: "EDIT_JOB",
    metadata: { jobId },
  });

  // 6. Send response
  res.status(200).json({
    success: true,
    message: "Job updated successfully",
    data: updatedJob,
  });
});

//Delete Job
const deleteJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job Id!!",
    });
  }

  // 2. Find Job
  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job doesn't exist",
    });
  }

  // 3. Check Authorization
  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to delete this job.",
    });
  }

  // 4. Delete all Application documents for this job
  const applications = await Application.find({ job: jobId });

  // Delete resumes from Cloudinary
  for (const application of applications) {
    if (application.resumeUrl) {
      try {
        const publicId = application.resumeUrl.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      } catch (error) {
        // Silently continue if Cloudinary deletion fails
      }
    }
  }

  // Delete all applications
  await Application.deleteMany({ job: jobId });

  // 5. Remove this job from all users' bookmarks
  await User.updateMany(
    { bookmarks: jobId },
    { $pull: { bookmarks: jobId } }
  );

  // 6. Delete Job
  await Job.findByIdAndDelete(jobId);

  await createAuditLog({
    userId: req.user._id,
    action: "DELETE_JOB",
    metadata: {
      jobId: job._id,
      title: job.title,
      deletedApplications: applications.length
    }
  });

  // 7. Response
  res.status(200).json({
    success: true,
    message: "Job deleted successfully!",
  });
});

//Saving Job Bookmarks
const bookmarkJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params


  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job Id!!",
    });
  }

  // 2. Find Job
  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job doesn't exist",
    });
  }

  //3. Checking Role
  if (req.user.role !== "candidate") {
    return res.status(409)
      .json({
        success: false,
        message: "Only candidate can bookmark the Job!!"
      })
  }

  //check if user is active
  if (!req.user.isActive) {
    return res.status(407)
      .json({
        success: false,
        message: "Your account has been deactivated! Please contact support!!"
      })
  }

  //4.already Bookmarked
  const alreadyBookmarked = req.user.bookmarks.some(
    (bookmark) => bookmark.toString() === jobId
  );

  if (alreadyBookmarked) {
    return res.status(404)
      .json({
        success: false,
        message: "Job already Bookmarked!!"
      })
  }


  //5.Saving bookmark
  req.user.bookmarks.push(jobId)
  await req.user.save()

  await createAuditLog({
    userId: req.user._id,
    action: "BOOKMARK_JOB",
    metadata: { jobId },
  });

  res.status(200)
    .json({
      success: true,
      message: "Job Bookmarked Successfully!!"
    })
})


//Getting Bookmarking Jobs
const getBookmarkedJobs = asyncHandler(async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({
      success: false,
      message: "Only candidates can view bookmarked jobs",
    });
  }

  const userWithBookmarks = await User.findById(req.user._id).populate("bookmarks")

  if (!userWithBookmarks) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Filter out null values (deleted jobs) and clean up bookmarks array
  const validBookmarks = userWithBookmarks.bookmarks.filter(job => job !== null);

  // If any bookmarks were removed (null), update the user document
  if (validBookmarks.length !== userWithBookmarks.bookmarks.length) {
    userWithBookmarks.bookmarks = validBookmarks.map(job => job._id);
    await userWithBookmarks.save();
  }

  res.status(200)
    .json({
      success: true,
      data: validBookmarks
    })
})

//Recruiter dashboard API:
/* Total Jobs they posted.

   Total Applicants across all those jobs.

   Most Applied Job (job with highest number of applicants).*/

const getRecruiterStats = asyncHandler(async (req, res) => {
  // 1. Get current recruiter ID
  const recruiterId = req.user._id;

  // 2. Find all jobs posted by this recruiter
  const jobs = await Job.find({ createdBy: recruiterId });

  // 3. Count total jobs
  const totalJobsPosted = jobs.length;

  // 4. Count total applicants across all jobs
  let totalApplicants = 0;
  jobs.forEach(job => {
    totalApplicants += job.applicants.length;
  });

  // 5. Find job with the most applicants
  let mostAppliedJob = null;
  let maxApplicants = 0;

  jobs.forEach(job => {
    if (job.applicants.length > maxApplicants) {
      maxApplicants = job.applicants.length;
      mostAppliedJob = job;
    }
  });

  // 6. Send response
  res.status(200).json({
    success: true,
    totalJobsPosted,
    totalApplicants,
    mostAppliedJob: mostAppliedJob || null,
  });
});

//Candidate Dashboard API
const getCandidateStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Total jobs applied
  const appliedJobs = await Job.find({ applicants: userId })
    .sort({ createdAt: -1 }) // newest first
    .limit(5); // last 5 jobs

  const totalAppliedJobs = await Job.countDocuments({ applicants: userId });

  // 2. Bookmarked jobs
  const user = await User.findById(userId).select("bookmarks");
  const totalBookmarkedJobs = user.bookmarks.length;

  // 3. Send response
  res.status(200).json({
    success: true,
    totalAppliedJobs,
    recentAppliedJobs: appliedJobs,
    totalBookmarkedJobs,
  });
});


//Unbookmark the job
const unbookmarkJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ success: false, message: "Invalid Job Id!" });
  }

  if (req.user.role !== "candidate") {
    return res.status(403).json({ success: false, message: "Only candidates can unbookmark jobs!" });
  }

  const isBookmarked = req.user.bookmarks.includes(jobId);

  // ❗ If not bookmarked, return error
  if (!isBookmarked) {
    return res.status(404).json({
      success: false,
      message: "Job is not bookmarked.",
    });
  }

  // ❗ Proceed to remove bookmark
  req.user.bookmarks = req.user.bookmarks.filter(
    (id) => id.toString() !== jobId.toString()
  );

  await req.user.save();

  await createAuditLog({
    userId: req.user._id,
    action: "UNBOOKMARK_JOB",
    metadata: { jobId },
  });

  res.status(200).json({ success: true, message: "Job unbookmarked successfully!" });
});



//Withdraw job application
const withdrawJobApplication = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Job Id!!",
    });
  }

  // 2. Find Job
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found!",
    });
  }

  // 3. Role Check
  if (req.user.role !== "candidate") {
    return res.status(403).json({
      success: false,
      message: "Only candidates can withdraw job applications",
    });
  }

  // 4. Find and delete the Application document
  const application = await Application.findOneAndDelete({
    user: req.user._id,
    job: jobId
  });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "You have not applied to this job",
    });
  }

  // 5. Remove user from job's applicants array
  job.applicants = job.applicants.filter(
    (applicantId) => applicantId.toString() !== req.user._id.toString()
  );

  // 6. Save the job
  await job.save();

  // 7. Optional: Delete resume from Cloudinary
  if (application.resumeUrl) {
    try {
      const publicId = application.resumeUrl.split('/').slice(-2).join('/').split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (error) {
      // Don't fail the request if Cloudinary deletion fails
    }
  }

  await createAuditLog({
    userId: req.user._id,
    action: "WITHDRAW_APPLICATION",
    metadata: { jobId, applicationId: application._id },
  });

  // 8. Send Response
  res.status(200).json({
    success: true,
    message: "Application withdrawn successfully!",
  });
});

// Update application status (recruiter only)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  // 1. Validate status
  const validStatuses = ["applied", "shortlisted", "rejected", "hired"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // 2. Find application
  const application = await Application.findById(applicationId).populate("job");

  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  // 3. Verify recruiter owns this job
  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this application",
    });
  }

  // 4. Update status
  application.status = status;
  await application.save();

  // Create notification for candidate
  const statusMessages = {
    shortlisted: `Great news! You've been shortlisted for ${application.job.title}`,
    rejected: `Your application for ${application.job.title} was not selected`,
    hired: `Congratulations! You've been hired for ${application.job.title}`,
    applied: `Your application status for ${application.job.title} has been updated`,
  };

  await createNotification({
    recipient: application.user,
    sender: req.user._id,
    type: "status_update",
    title: `Application Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status],
    relatedJob: application.job._id,
    relatedApplication: applicationId,
    link: `/my-applications`,
  });

  // AUDIT LOG
  await createAuditLog({
    userId: req.user._id,
    action: "UPDATE_APPLICATION_STATUS",
    metadata: { applicationId, status, jobId: application.job._id },
  });

  res.status(200).json({
    success: true,
    message: `Application status updated to ${status}`,
    data: application,
  });
});


export {
  createJob, getAllJobs, getJobById, applyforJob,
  getAppliedJobs, getJobApplicants, editJob, deleteJob, bookmarkJob, getBookmarkedJobs,
  getRecruiterStats, getCandidateStats, unbookmarkJob, withdrawJobApplication, updateApplicationStatus
}