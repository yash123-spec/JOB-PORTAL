import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { Application } from "../models/application.model.js"
import {AuditLog} from "../models/auditLog.model.js";


//getting all Users
const getAllUsers = asyncHandler(async (req, res) => {

    const {role, search="", page=1, limit=10} = req.query

const filter ={}

    if (role) {
        filter.role = role
    }

    if (search) {
        filter.$or=[
            { fullname:{$regex: search, $options:"i"}},
            { email:{$regex: search, $options:"i"}}
        ]
    }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password -refreshToken") 
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const totalUsers = await User.countDocuments();

  res.status(200).json({
    success: true,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    data: users,
  });
});


//Deleting the user
const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID",
    });
  }

  // 2. Prevent deleting own account
  if (req.user._id.toString() === userId) {
    return res.status(403).json({
      success: false,
      message: "You cannot delete your own admin account",
    });
  }

  // 3. Find user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // 4. Delete user
  await User.findByIdAndDelete(userId);

  // 5. Success response
  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
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
  if (location) filter.location = location;

  // Query jobs
  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalJobs = await Job.countDocuments(filter);

  res.status(200).json({
    success: true,
    totalJobs,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: page,
    data: jobs,
  });
});


//Deleting the job
const deleteJobByAdmin = asyncHandler(async (req, res) => {
  const { id: jobId } = req.params;

  // 1. Validate Job ID
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID",
    });
  }

  // 2. Find the job
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // 3. Delete the job
  await Job.findByIdAndDelete(jobId);

  // 4. Send success response
  res.status(200).json({
    success: true,
    message: "Job deleted successfully by admin",
  });
});

//Update user role by Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { role } = req.body;

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid User ID",
    });
  }

  // 2. Check for allowed roles
  const validRoles = ["candidate", "recruiter"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role must be one of: ${validRoles.join(", ")}`,
    });
  }

  // 3. Find user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // 4. Prevent changing to admin via API
  if (role === "admin") {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to assign admin role via this route",
    });
  }

  // 5. Update role and save
  user.role = role;
  await user.save();

  // 6. Respond
  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    },
  });
});


//Toggle User status(activate and deactivate)
const toggleUserStatus = asyncHandler(async (req,res)=>{
     const {id:userId} = req.params
     const {isActive} = req.body

     if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "`isActive` must be a boolean value (true or false)",
    });
  }

  if (req.user._id.toString() === userId) {
    return res.status(403).json({
      success: false,
      message: "You cannot change your own status",
    });
  }

  const updatedUser = await User.findByIdAndUpdate(userId,{isActive},{new:true, runValidators: true}).select("-password -refreshToken")

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success:true,
    message:`User account has been ${isActive?"Activated":"Deactivated"} successfully!`,
    data:updatedUser
  })
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
        _id: "$recruiter", // recruiter user ID
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
        _id: "$candidate",
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

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalJobs,
      applicationsPerJob,
      weeklySignups,
      topRecruiters,
      topCandidates,
    },
  });
});

//get Audit Logs
const getAuditLogs = asyncHandler(async (req, res) => {
  // 1. Protect route — only for admins
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

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
  res.status(200).json({
    success: true,
    data: logs,
    pagination: {
      total: totalLogs,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalLogs / limit),
    },
  });
});

export {getAllUsers, deleteUserByAdmin,getAllJobsForAdmin,deleteJobByAdmin, 
    updateUserRole,toggleUserStatus,getAdminStats,getAuditLogs}