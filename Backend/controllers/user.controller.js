import { AppError } from "../utils/AppError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";


//Login logic
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password || email.trim() === "" || password.trim() === "") {
    throw new AppError(400, "Email and password are required")
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new AppError(400, "Please provide a valid email address")
  }

  const user = await User.findOne({ email })

  if (!user) {
    throw new AppError(404, "User does not exist with this email")
  }

  // Check if user is OAuth user (no password)
  if (user.authProvider !== 'local') {
    throw new AppError(400, `This account uses Google login. Please use the "Sign in with Google" button.`)
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new AppError(401, "Password is incorrect!!")
  }

  //check if user is active
  if (!user.isActive) {
    throw new AppError(403, "Your account has been deactivated! Please contact support!!")
  }

  // Check recruiter account status
  if (user.role === 'recruiter' && user.accountStatus !== 'approved') {
    const statusMessages = {
      'pending': 'Your recruiter account is pending admin approval. You will receive an email once approved.',
      'rejected': 'Your recruiter account has been rejected. Please contact support for more information.',
      'blocked': 'Your account has been blocked. Please contact support.'
    };

    throw new AppError(403, statusMessages[user.accountStatus] || 'Access denied', { accountStatus: user.accountStatus })
  }

  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false })

  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000
    })

    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })


  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  return res.status(200).json(
    new ApiResponse(200, loggedInUser, "Successfully logged in!!")
  )
});

//me logic
const getCurrentUser = asyncHandler(async (req, res) => {
  // Fetch fresh user data
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Calculate applied jobs count from Application collection
  const appliedJobsCount = await Application.countDocuments({ user: user._id });


  if (user.bookmarks && user.bookmarks.length > 0) {

    // 1 query total — find all valid bookmarks at once
    const existingJobs = await Job.find(
      { _id: { $in: user.bookmarks } },
      { _id: 1 }  // only fetch IDs, nothing else
    );

    const validIds = new Set(existingJobs.map(j => j._id.toString()));

    const validBookmarks = user.bookmarks.filter(id =>
      validIds.has(id.toString())
    );

    if (validBookmarks.length !== user.bookmarks.length) {
      await User.findByIdAndUpdate(user._id, { bookmarks: validBookmarks });
      user.bookmarks = validBookmarks;
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { ...user.toObject(), appliedJobsCount }, "User fetched successfully!!")
  )
})

//Generating new AccessToken from refreshToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    throw new AppError(401, "Unauthorized request!!")
  }

  try {
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new AppError(404, "User not found!!")
    }

    if (user.refreshToken !== token) {
      throw new AppError(403, "Invalid refresh token!!")
    }

    const newAccessToken = user.generateAccessToken()
    const newRefreshToken = user.generateRefreshToken()

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(
      new ApiResponse(200, {}, "AccessToken refreshed Successfully!!")
    )
  } catch (error) {
    throw new AppError(401, "Invalid or Expired RefreshToken!!")
  }
})

//logout logic
const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: ""
      }
    },
    {
      new: true
    }
  )

  return res
    .status(200)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    })
    .json(new ApiResponse(200, {}, "User logout successfully!!"))
})

//Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, removeProfilePic } = req.body;

  // Get user
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Update text fields if provided
  if (fullname) user.fullname = fullname;

  // Handle profile picture removal
  if (removeProfilePic === 'true') {
    user.profilePic = null;
  }
  // Handle profile picture upload if file is present
  else if (req.file) {
    try {
      // Convert buffer to base64
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Upload to Cloudinary using upload preset
      const uploadedImage = await cloudinary.uploader.upload(base64Image, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        folder: "job-portal/profiles"
      });

      // Update profile picture URL
      user.profilePic = uploadedImage.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError(500, "Failed to upload profile picture. Please try again.");
    }
  }

  // Save updated user
  await user.save({ validateBeforeSave: false });

  // Return updated user without sensitive fields
  const updatedUser = await User.findById(user._id).select("-password -refreshToken");
  return res.status(200).json(
    new ApiResponse(200, updatedUser, "Profile updated successfully!")
  );
});


// Cleanup orphaned bookmarks (jobs that were deleted)
const cleanupOrphanedBookmarks = asyncHandler(async (req, res) => {
  // Step 1 — get all users with bookmarks (1 query)
  const users = await User.find(
    { bookmarks: { $exists: true, $ne: [] } },
    { _id: 1, bookmarks: 1 }  // only fetch what we need
  );

  if (users.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, { usersAffected: 0, totalBookmarksRemoved: 0 }, "Nothing to clean")
    );
  }

  // Step 2 — collect ALL bookmark IDs across ALL users (no query)
  const allBookmarkIds = [
    ...new Set(
      users.flatMap(u => u.bookmarks.map(id => id.toString()))
    )
  ];

  // Step 3 — find which ones still exist (1 query total)
  const existingJobs = await Job.find(
    { _id: { $in: allBookmarkIds } },
    { _id: 1 }
  );

  const validIds = new Set(existingJobs.map(j => j._id.toString()));

  // Step 4 — update only affected users
  let totalCleaned = 0;
  let usersAffected = 0;

  for (const user of users) {
    const validBookmarks = user.bookmarks.filter(id =>
      validIds.has(id.toString())
    );

    if (validBookmarks.length !== user.bookmarks.length) {
      await User.findByIdAndUpdate(user._id, { bookmarks: validBookmarks });
      totalCleaned += (user.bookmarks.length - validBookmarks.length);
      usersAffected++;
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { usersAffected, totalBookmarksRemoved: totalCleaned }, "Cleanup completed")
  );
});
export { loginUser, getCurrentUser, refreshAccessToken, logoutUser, updateProfile, cleanupOrphanedBookmarks }