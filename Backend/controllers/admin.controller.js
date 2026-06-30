import { AppError } from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js"
import { AuditLog } from "../models/auditLog.model.js";


//getting all Users
const getAllUsers = asyncHandler(async (req, res) => {

  const { role, search = "", page = 1, limit = 10 } = req.query

  const filter = {}

  if (role) {
    filter.role = role
  }

  if (search) {
    filter.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ]
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password -refreshToken")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalUsers = await User.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: users,
    })
  );
});


//Deleting the user
const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "Invalid User ID");
  }

  // 2. Prevent deleting own account
  if (req.user._id.toString() === userId) {
    throw new AppError(403, "You cannot delete your own admin account");
  }

  // 3. Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // 4. Delete user
  const userJobs = await Job.find({ createdBy: userId });
  const jobIds = userJobs.map(job => job._id);

  // Delete all applications for this user's jobs
  await Application.deleteMany({ job: { $in: jobIds } });

  // Delete this user's own applications
  await Application.deleteMany({ user: userId });

  // Remove their jobs from everyone's bookmarks
  if (jobIds.length > 0) {
    await User.updateMany(
      { bookmarks: { $in: jobIds } },
      { $pull: { bookmarks: { $in: jobIds } } }
    );
  }

  // Delete all their jobs
  await Job.deleteMany({ createdBy: userId });

  // Finally delete the user
  await User.findByIdAndDelete(userId);

  // 5. Success response
  return res.status(200).json(
    new ApiResponse(200, {}, "User deleted successfully")
  );
});


//Getting all Jobs
const getAllJobsForAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Optional filters
  const { title, company, type, location } = req.query;
  const filter = {};

  if (title) filter.title = { $regex: title, $options: "i" };
  if (company) filter.company = { $regex: company, $options: "i" };
  if (type) filter.type = type;
  if (location) filter.location = { $regex: location, $options: "i" };

  // Query jobs
  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalJobs = await Job.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
      data: jobs,
    })
  );
});


//Deleting the job
const deleteJobByAdmin = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw new AppError(400, "Invalid job ID");
  }

  // 2. Find the job
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(404, "Job not found");
  }

  // 3. Delete the job

  const applications = await Application.find({ job: jobId });

  // Batch delete resumes from Cloudinary
  const publicIds = applications
    .filter(app => app.resumeUrl)
    .map(app =>
      app.resumeUrl.split('/').slice(-2).join('/').split('.')[0]
    );

  if (publicIds.length > 0) {
    try {
      await cloudinary.api.delete_resources(publicIds, { resource_type: 'raw' });
    } catch (error) {
      // continue even if cloudinary fails
    }
  }

  await Application.deleteMany({ job: jobId });
  await User.updateMany(
    { bookmarks: jobId },
    { $pull: { bookmarks: jobId } }
  );
  await Job.findByIdAndDelete(jobId);

  // 4. Send success response
  return res.status(200).json(
    new ApiResponse(200, {}, "Job deleted successfully by admin")
  );
});

//Update user role by Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { role } = req.body;

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "Invalid User ID");
  }

  // 2. Check for allowed roles
  const validRoles = ["candidate", "recruiter"];
  if (!validRoles.includes(role)) {
    throw new AppError(400, `Role must be one of: ${validRoles.join(", ")}`);
  }

  // 3. Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }


  // 5. Update role and save
  user.role = role;
  await user.save();

  // 6. Respond
  return res.status(200).json(
    new ApiResponse(200, {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    }, "User role updated successfully")
  );
});


//Toggle User status(activate and deactivate)
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id: userId } = req.params
  const { isActive } = req.body

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(400, "Invalid user ID");
  }

  if (typeof isActive !== "boolean") {
    throw new AppError(400, "`isActive` must be a boolean value (true or false)");
  }

  if (req.user._id.toString() === userId) {
    throw new AppError(403, "You cannot change your own status");
  }

  const userExists = await User.findById(userId);
  if (!userExists) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { isActive }, { new: true, runValidators: true }).select("-password -refreshToken")



  return res.status(200).json(
    new ApiResponse(200, updatedUser, `User account has been ${isActive ? "Activated" : "Deactivated"} successfully!`)
  )
})


//Full stats
const getAdminStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // 1. Total Users by Role
  const usersByRole = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert array to object { candidate: 10, recruiter: 5 }
  const totalUsers = usersByRole.reduce((acc, roleGroup) => {
    acc[roleGroup._id] = roleGroup.count;
    return acc;
  }, {});

  // 2. Total Jobs
  const totalJobs = await Job.countDocuments();

  // 3. Applications per Job
  const applicationsPerJob = await Application.aggregate([
    {
      $group: {
        _id: "$job", // group by job ID
        applicationCount: { $sum: 1 },
      },
    },
    {
      $sort: { applicationCount: -1 }, // optional: top applied jobs
    },
  ]);

  // 4. Weekly Signups
  const weeklySignups = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // 5. Top Recruiters by Job Count
  const topRecruiters = await Job.aggregate([
    {
      $group: {
        _id: "$createdBy", // recruiter user ID
        jobCount: { $sum: 1 },
      },
    },
    {
      $sort: { jobCount: -1 },
    },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "recruiterDetails",
      },
    },
    {
      $unwind: "$recruiterDetails",
    },
    {
      $project: {
        name: "$recruiterDetails.fullname",
        email: "$recruiterDetails.email",
        jobCount: 1,
      },
    },
  ]);

  // 6. Top Candidates by Applications
  const topCandidates = await Application.aggregate([
    {
      $group: {
        _id: "$user", // candidate user ID
        applicationCount: { $sum: 1 },
      },
    },
    {
      $sort: { applicationCount: -1 },
    },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "candidateDetails",
      },
    },
    {
      $unwind: "$candidateDetails",
    },
    {
      $project: {
        name: "$candidateDetails.fullname",
        email: "$candidateDetails.email",
        applicationCount: 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      totalUsers,
      totalJobs,
      applicationsPerJob,
      weeklySignups,
      topRecruiters,
      topCandidates,
    })
  );
});

//get Audit Logs
const getAuditLogs = asyncHandler(async (req, res) => {
  // 1. Protect route — only for admins


  // 2. Extract query params for filtering and pagination
  const { action, userId, startDate, endDate, page = 1, limit = 10 } = req.query;

  const query = {};

  // 3. Add filters (if provided)
  if (action) query.action = action;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.user = userId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 4. Count total logs for pagination
  const totalLogs = await AuditLog.countDocuments(query);

  // 5. Fetch logs with population and pagination
  const logs = await AuditLog.find(query)
    .populate("user", "email role") // just show email & role
    .sort({ createdAt: -1 }) // recent first
    .skip((page - 1) * limit)
    .limit(Number(limit));

  // 6. Respond
  return res.status(200).json(
    new ApiResponse(200, {
      data: logs,
      pagination: {
        total: totalLogs,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalLogs / limit),
      },
    })
  );
});

export {
  getAllUsers, deleteUserByAdmin, getAllJobsForAdmin, deleteJobByAdmin,
  updateUserRole, toggleUserStatus, getAdminStats, getAuditLogs
}