import { AppError } from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js";
import { createAuditLog } from "../utils/logAudit.js";
import bufferToStream from "../utils/bufferToStream.js"
import cloudinary from "../utils/cloudinary.js"
import { createNotification } from "./notification.controller.js";


// Derive a Cloudinary raw public_id from a resume's secure_url.
// URL: https://res.cloudinary.com/<cloud>/raw/upload/v123/job-portal/resumes/<file>.pdf
// public_id must include the folder path AND the extension (raw resources keep it).
const getResumePublicId = (resumeUrl) => {
  const afterUpload = resumeUrl.split('/upload/')[1];
  if (!afterUpload) return null;
  return afterUpload.replace(/^v\d+\//, ''); // strip version, keep folders + extension
};



//jobCreation logic
const createJob = asyncHandler(async (req, res) => {
  const { title, company, responsibilities, skills, jobTime, salaryMin, salaryMax, location, type, companyWebsite } = req.body;

  // Safer validation
  if ([title, company, jobTime, location, type].some(field => typeof field !== 'string' || field.trim() === '')) {
    throw new AppError(400, "All required fields must be provided!!");
  }

  // Validate responsibilities and skills arrays
  if (!responsibilities || !Array.isArray(responsibilities) || responsibilities.length === 0) {
    throw new AppError(400, "At least one responsibility is required!!");
  }

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    throw new AppError(400, "At least one skill is required!!");
  }

  //check if user is active
  if (!req.user.isActive) {
    throw new AppError(403, "Your account has been deactivated! Please contact support!!");
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
      throw new AppError(400, "Minimum salary must be less than maximum salary");
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

  return res.status(201).json(
    new ApiResponse(201, job, "Job posted successfully!!")
  );
});

//get All Jobs
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    company, jobTime, location, search, type,
    salaryMin, salaryMax, postedDays,
    minApplicants, maxApplicants,
    createdBy, page = 1, limit = 10, sort
  } = req.query;

  // ─── Step 1: Build $match filter (same as before) ───────────────
  const matchFilter = {};

  if (type) matchFilter.type = type;
  if (jobTime) matchFilter.jobTime = jobTime;
  if (createdBy) matchFilter.createdBy = new mongoose.Types.ObjectId(createdBy);
  if (company) matchFilter.company = { $regex: company, $options: "i" };
  if (location) matchFilter.location = { $regex: location, $options: "i" };

  if (search) {
    matchFilter.$or = [
      { title: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { responsibilities: { $elemMatch: { $regex: search, $options: "i" } } },
      { skills: { $elemMatch: { $regex: search, $options: "i" } } }
    ];
  }

  if (salaryMin || salaryMax) {
    const userMin = salaryMin ? Number(salaryMin) : 0;
    const userMax = salaryMax ? Number(salaryMax) : Number.MAX_SAFE_INTEGER;

    matchFilter.$and = matchFilter.$and || [];
    matchFilter.$and.push({
      $and: [
        { salaryMin: { $ne: null, $exists: true } },
        { salaryMax: { $ne: null, $exists: true } },
        { salaryMin: { $lte: userMax } },
        { salaryMax: { $gte: userMin } }
      ]
    });
  }

  if (postedDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(postedDays));
    matchFilter.createdAt = { $gte: daysAgo };
  }

  // ─── Step 2: Build aggregation pipeline ─────────────────────────
  const pipeline = [
    // Apply all standard filters first
    { $match: matchFilter },

    // Add applicantsCount as computed field from applicants array length
    {
      $addFields: {
        applicantsCount: {
          $size: { $ifNull: ["$applicants", []] }
        }
      }
    }
  ];

  // Apply applicants filter INSIDE pipeline (fixes pagination bug)
  if (minApplicants || maxApplicants) {
    const applicantsFilter = {};
    if (minApplicants) applicantsFilter.$gte = Number(minApplicants);
    if (maxApplicants) applicantsFilter.$lte = Number(maxApplicants);

    pipeline.push({
      $match: { applicantsCount: applicantsFilter }
    });
  }

  // "trending" ranks by most applicants (then newest); default is newest-first
  const sortStage = sort === "trending"
    ? { applicantsCount: -1, createdAt: -1 }
    : { createdAt: -1 };

  // ─── Step 3 + 4: Count AND fetch the page in ONE round-trip ──────
  // $facet runs both branches on the same filtered dataset in a single
  // aggregation, so we avoid a second trip to the database.
  pipeline.push({
    $facet: {
      // Total matching documents (before pagination)
      metadata: [{ $count: "total" }],
      // The actual page of results: sort → skip → limit
      data: [
        { $sort: sortStage },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
      ],
    },
  });

  const result = await Job.aggregate(pipeline);
  const jobs = result[0]?.data || [];
  const totalJobs = result[0]?.metadata[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      totalJobs,
      totalPages: Math.ceil(totalJobs / Number(limit)),
      currentPage: Number(page),
      data: jobs,
    })
  );
});

//finding job by Id
const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid Job Id!!")
  }

  const job = await Job.findById(id).populate("createdBy", "fullname email")

  if (!job) {
    throw new AppError(404, "Job not found!!")
  }

  return res.status(200).json(
    new ApiResponse(200, job, "Job fetched successfully!!")
  )
})


//Aplying for job through jobId
const applyforJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job Id");
  }

  // 2. Find the job
  const job = await Job.findById(jobId)

  if (!job) {
    throw new AppError(404, "Could not find the job!!");
  }

  // 3. Prevent recruiter from applying
  if (req.user.role !== "candidate") {
    throw new AppError(403, "Only candidate can apply for the JOB!!");
  }

  //check if user is active
  if (!req.user.isActive) {
    throw new AppError(403, "Your account has been deactivated! Please contact support!!");
  }

  // 4. Prevent duplicate applications - check Application collection
  const existingApplication = await Application.findOne({
    user: req.user._id,
    job: jobId
  });

  if (existingApplication) {
    throw new AppError(409, "You have already applied for this JOB!!");
  }

  //validate file presence
  if (!req.file) {
    throw new AppError(400, "resume file required")
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
          return reject(new AppError(500, "Failed to upload resume", error));
        }
        resolve(result);
      }
    )

    bufferToStream(req.file.buffer).pipe(uploadStream);
  })



  let application = await Application.create({
    user: req.user._id,
    job: jobId,
    resumeUrl: uploadedResume.secure_url,
    status: "applied"
  });


  // Add user ID to job's applicants array
  job.applicants.push(req.user._id);
  await job.save();

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

  return res.status(200).json(
    new ApiResponse(200, {
      applicationId: application._id,
      resumeUrl: uploadedResume.secure_url
    }, "Job application successful!!")
  );
});


//get all Applied Jobs
const getAppliedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Base pipeline — filters deleted jobs at DB level
  const basePipeline = [
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "jobs",
        localField: "job",
        foreignField: "_id",
        as: "jobData"
      }
    },
    { $match: { jobData: { $ne: [] } } },  // only where job still exists
    { $sort: { createdAt: -1 } }
  ];

  // ✅ Count runs on same filtered pipeline
  const countResult = await Application.aggregate([
    ...basePipeline,
    { $count: "total" }
  ]);
  const total = countResult[0]?.total || 0;

  // ✅ Pagination applied AFTER filtering
  const applications = await Application.aggregate([
    ...basePipeline,
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        job: { $arrayElemAt: ["$jobData", 0] },  // unwrap array to object
        applicationId: "$_id",
        appliedAt: "$createdAt",
        applicationStatus: "$status",
        resumeUrl: 1
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      total,                                    // ✅ number, not array
      totalPages: Math.ceil(total / limit),     // ✅ correct
      currentPage: page,
      data: applications,
    })
  );
});

//get all candidates that had applied to particular job(Applicants)
const getJobApplicants = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job ID");
  }

  // 2. Find the job
  const job = await Job.findById(jobId).populate("createdBy", "fullname email");

  // 3. If job not found
  if (!job) {
    throw new AppError(404, "Job not found");
  }

  // 4. Ensure that only the recruiter who posted it can view applicants
  if (job.createdBy._id.toString() !== req.user._id.toString()) {
    throw new AppError(403, "You are not allowed to view applicants for this job");
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
  return res.status(200).json(
    new ApiResponse(200, {
      totalApplicants: applicants.length,
      data: applicants,
    })
  );
});

//Edit Job
const editJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job Id!!");
  }

  // 2. Find Job
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, "Job not found!");
  }

  // 3. Authorization check
  if (job.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError(403, "You are not allowed to edit the job!!");
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
      throw new AppError(400, "Minimum salary must be less than maximum salary");
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
  return res.status(200).json(
    new ApiResponse(200, updatedJob, "Job updated successfully")
  );
});

//Delete Job
const deleteJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job Id!!");
  }

  // 2. Find Job
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, "Job doesn't exist");
  }

  // 3. Check Authorization
  if (job.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError(403, "You are not allowed to delete this job.");
  }

  // 4. Delete all Application documents for this job
  const applications = await Application.find({ job: jobId });

  // Delete resumes from Cloudinary
  for (const application of applications) {
    if (application.resumeUrl) {
      try {
        const publicId = getResumePublicId(application.resumeUrl);
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
          if (result?.result !== 'ok') {
            console.warn(`Cloudinary resume delete returned "${result?.result}" for ${publicId}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to delete resume from Cloudinary: ${error.message}`);
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
  return res.status(200).json(
    new ApiResponse(200, {}, "Job deleted successfully!")
  );
});

//Saving Job Bookmarks
const bookmarkJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params


  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job Id!!");
  }

  // 2. Find Job
  const job = await Job.findById(jobId);

  if (!job) {
    throw new AppError(404, "Job doesn't exist");
  }

  //3. Checking Role
  if (req.user.role !== "candidate") {
    throw new AppError(403, "Only candidate can bookmark the Job!!");
  }

  //check if user is active
  if (!req.user.isActive) {
    throw new AppError(403, "Your account has been deactivated! Please contact support!!");
  }

  //4.already Bookmarked
  const alreadyBookmarked = req.user.bookmarks.some(
    (bookmark) => bookmark.toString() === jobId
  );

  if (alreadyBookmarked) {
    throw new AppError(409, "Job already Bookmarked!!");
  }


  //5.Saving bookmark
  req.user.bookmarks.push(jobId)
  await req.user.save()

  await createAuditLog({
    userId: req.user._id,
    action: "BOOKMARK_JOB",
    metadata: { jobId },
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Job Bookmarked Successfully!!")
  );
})


//Getting Bookmarking Jobs
const getBookmarkedJobs = asyncHandler(async (req, res) => {
  if (req.user.role !== "candidate") {
    throw new AppError(403, "Only candidates can view bookmarked jobs");
  }

  const userWithBookmarks = await User.findById(req.user._id).populate("bookmarks")

  if (!userWithBookmarks) {
    throw new AppError(404, "User not found");
  }

  // Filter out null values (deleted jobs) and clean up bookmarks array
  const validBookmarks = userWithBookmarks.bookmarks.filter(job => job !== null);

  // If any bookmarks were removed (null), update the user document
  if (validBookmarks.length !== userWithBookmarks.bookmarks.length) {
    userWithBookmarks.bookmarks = validBookmarks.map(job => job._id);
    await userWithBookmarks.save();
  }

  return res.status(200).json(
    new ApiResponse(200, validBookmarks)
  );
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
  return res.status(200).json(
    new ApiResponse(200, {
      totalJobsPosted,
      totalApplicants,
      mostAppliedJob: mostAppliedJob || null,
    })
  );
});

// Recruiter analytics: application status funnel across the recruiter's jobs
const getRecruiterAnalytics = asyncHandler(async (req, res) => {
  const recruiterId = req.user._id;

  const jobs = await Job.find({ createdBy: recruiterId }).select("_id");
  const jobIds = jobs.map((j) => j._id);

  // Count applications by current status across those jobs
  const funnel = { applied: 0, shortlisted: 0, rejected: 0, hired: 0 };
  if (jobIds.length > 0) {
    const grouped = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    grouped.forEach((g) => {
      if (g._id in funnel) funnel[g._id] = g.count;
    });
  }

  const totalApplications = funnel.applied + funnel.shortlisted + funnel.rejected + funnel.hired;

  return res.status(200).json(
    new ApiResponse(200, { totalApplications, funnel }, "Recruiter analytics fetched")
  );
});

//Candidate Dashboard API
const getCandidateStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Total jobs applied
  const appliedJobs = await Job.find({ applicants: userId })
    .sort({ createdAt: -1 }) // newest first
    .limit(5); // last 5 jobs

  const totalAppliedJobs = await Application.countDocuments({ user: userId });

  // 2. Bookmarked jobs
  const user = await User.findById(userId).select("bookmarks");
  const totalBookmarkedJobs = user.bookmarks.length;

  // 3. Send response
  return res.status(200).json(
    new ApiResponse(200, {
      totalAppliedJobs,
      recentAppliedJobs: appliedJobs,
      totalBookmarkedJobs,
    })
  );
});


//Unbookmark the job
const unbookmarkJob = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job Id!");
  }

  if (req.user.role !== "candidate") {
    throw new AppError(403, "Only candidates can unbookmark jobs!");
  }

  const isBookmarked = req.user.bookmarks.some(
    id => id.toString() === jobId
  );

  // ❗ If not bookmarked, return error
  if (!isBookmarked) {
    throw new AppError(404, "Job is not bookmarked.");
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

  return res.status(200).json(
    new ApiResponse(200, {}, "Job unbookmarked successfully!")
  );
});



//Withdraw job application
const withdrawJobApplication = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid Job Id!!");
  }

  // 2. Find Job
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(404, "Job not found!");
  }

  // 3. Role Check
  if (req.user.role !== "candidate") {
    throw new AppError(403, "Only candidates can withdraw job applications");
  }

  // 4. Find and delete the Application document
  const application = await Application.findOneAndDelete({
    user: req.user._id,
    job: jobId
  });

  if (!application) {
    throw new AppError(404, "You have not applied to this job");
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
      const publicId = getResumePublicId(application.resumeUrl);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        if (result?.result !== 'ok') {
          console.warn(`Cloudinary resume delete returned "${result?.result}" for ${publicId}`);
        }
      }
    } catch (error) {
      // Don't fail the request if Cloudinary deletion fails
      console.warn(`Failed to delete resume from Cloudinary: ${error.message}`);
    }
  }

  await createAuditLog({
    userId: req.user._id,
    action: "WITHDRAW_APPLICATION",
    metadata: { jobId, applicationId: application._id },
  });

  // 8. Send Response
  return res.status(200).json(
    new ApiResponse(200, {}, "Application withdrawn successfully!")
  );
});

// Update application status (recruiter only)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  // 1. Validate status
  const validStatuses = ["applied", "shortlisted", "rejected", "hired"];
  if (!status || !validStatuses.includes(status)) {
    throw new AppError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // 2. Find application
  const application = await Application.findById(applicationId).populate("job");

  if (!application) {
    throw new AppError(404, "Application not found");
  }

  // 3. Verify recruiter owns this job
  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError(403, "You are not authorized to update this application");
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

  return res.status(200).json(
    new ApiResponse(200, application, `Application status updated to ${status}`)
  );
});






// Lightweight search suggestions for the autocomplete dropdown.
// Returns distinct job titles + company names matching the typed query.
const getJobSuggestions = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();

  // Require at least 2 chars to avoid noisy/expensive lookups
  if (q.length < 2) {
    return res.status(200).json(new ApiResponse(200, [], "No suggestions"));
  }

  // Escape regex metacharacters so user input can't break the query
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(safe, "i");

  const [titles, companies] = await Promise.all([
    Job.distinct("title", { title: regex }),
    Job.distinct("company", { company: regex }),
  ]);

  const suggestions = [
    ...titles.slice(0, 6).map((value) => ({ type: "title", value })),
    ...companies.slice(0, 4).map((value) => ({ type: "company", value })),
  ].slice(0, 8);

  return res.status(200).json(new ApiResponse(200, suggestions, "Suggestions fetched"));
});


// Public platform-wide stats (homepage + about page counters)
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalJobs, totalCandidates, totalRecruiters, totalHired, companies] = await Promise.all([
    Job.countDocuments(),
    User.countDocuments({ role: "candidate" }),
    User.countDocuments({ role: "recruiter" }),
    Application.countDocuments({ status: "hired" }),
    Job.distinct("company"),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalJobs,
      totalCandidates,
      totalRecruiters,
      totalCompanies: companies.length,
      totalHired,
    })
  );
});


export {
  createJob, getAllJobs, getJobById, applyforJob,
  getAppliedJobs, getJobApplicants, editJob, deleteJob, bookmarkJob, getBookmarkedJobs,
  getRecruiterStats, getCandidateStats, unbookmarkJob, withdrawJobApplication, updateApplicationStatus,
  getPlatformStats, getJobSuggestions, getRecruiterAnalytics
}