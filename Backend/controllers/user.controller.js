import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import { bufferToStream } from "../utils/bufferToStream.js";


//Registration logic
// NOTE: This endpoint is for LEGACY users only (existing users before OAuth implementation)
// New candidates must use Google/Apple OAuth
// New recruiters must use /auth/recruiter/register endpoint with OTP verification
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, role } = req.body;

  // 1. Check empty fields
  if ([fullname, email, password, role].some((field) => !field?.trim())) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are mandatory" });
  }

  // 2. Validate email format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide a valid email address" });
  }

  // 3. Role check: Only allow candidate or recruiter from request
  if (!["candidate", "recruiter"].includes(role)) {
    return res
      .status(400)
      .json({ success: false, message: `Role must be "candidate" or "recruiter"` });
  }

  // 4. Check if user already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return res
      .status(409)
      .json({ success: false, message: "User with this email already exists" });
  }

  // 4. Create user (legacy local auth)
  // New users created here will have authProvider: 'local' (default)
  // accountStatus will be 'approved' for candidates, 'pending' for recruiters (default)
  const user = await User.create({
    fullname,
    password,
    email,
    role,
    authProvider: 'local',
    emailVerified: true // Auto-verify for legacy users
  });

  // 5. Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // 6. Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 7. Set cookies
  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  // 8. Clean up sensitive info
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering the user",
    });
  }

  // 9. Final response
  return res.status(201).json({
    success: true,
    data: createdUser,
    message: "User registration successful!",
  });
});

//Login logic
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password || email.trim() === "" || password.trim() === "") {
    return res.status(409).json({ success: false, message: "Email and password are required" })
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address" });
  }

  const user = await User.findOne({ email })

  if (!user) {
    return res.status(400).json({ success: false, message: "User does not exist with this email" })
  }

  // Check if user is OAuth user (no password)
  if (user.authProvider !== 'local') {
    return res.status(400).json({
      success: false,
      message: `This account uses ${user.authProvider} login. Please use the "Sign in with ${user.authProvider === 'google' ? 'Google' : 'Apple'}" button.`
    })
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: "Password is incorrect!!" })
  }

  //check if user is active
  if (!user.isActive) {
    return res.status(407)
      .json({
        success: false,
        message: "Your account has been deactivated! Please contact support!!"
      })
  }

  // Check recruiter account status
  if (user.role === 'recruiter' && user.accountStatus !== 'approved') {
    const statusMessages = {
      'pending': 'Your recruiter account is pending admin approval. You will receive an email once approved.',
      'rejected': 'Your recruiter account has been rejected. Please contact support for more information.',
      'blocked': 'Your account has been blocked. Please contact support.'
    };

    return res.status(403).json({
      success: false,
      message: statusMessages[user.accountStatus] || 'Access denied',
      accountStatus: user.accountStatus
    })
  }

  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false })

  res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000
    })

    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    })


  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")



  res
    .status(201)
    .json({
      success: true,
      data: loggedInUser,
      message: "Successfully logged in!!"
    })


})

//me logic
const getCurrentUser = asyncHandler(async (req, res) => {
  // Fetch fresh user data
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Calculate applied jobs count from Application collection
  const appliedJobsCount = await Application.countDocuments({ user: user._id });

  // Clean up bookmarks - check which jobs still exist
  if (user.bookmarks && user.bookmarks.length > 0) {
    const originalCount = user.bookmarks.length;
    const validBookmarks = [];

    for (const bookmarkId of user.bookmarks) {
      const jobExists = await Job.findById(bookmarkId);
      if (jobExists) {
        validBookmarks.push(bookmarkId);
      }
    }

    // Update if any were removed
    if (validBookmarks.length !== originalCount) {
      await User.findByIdAndUpdate(
        user._id,
        { bookmarks: validBookmarks }
      );
      user.bookmarks = validBookmarks;
    }
  }

  return res
    .status(200)
    .json({
      success: true,
      data: {
        ...user.toObject(),
        appliedJobsCount
      },
      message: "User fetched successfully!!"
    })
})

//Generating new AccessToken from refreshToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized request!!" })
  }

  try {
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)

    if (!decodedToken) {
      return res.status(403).json({ success: false, message: "Forbidden" })
    }

    const user = await User.findById(decodedToken._id)

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!!" })
    }

    if (user.refreshToken !== token) {
      return res.status(403).json({ success: false, message: "Invalid refresh token!!" })
    }

    const newAccessToken = user.generateAccessToken()

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000
    })

    res
      .status(201)
      .json({
        success: true,
        message: "AccessToken refreshed Successfully!!"
      })
  } catch (error) {
    res
      .status(405)
      .json({
        success: false,
        message: "Invalid or Expired RefreshToken!!"
      })
  }
})

//logout logic
const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  return res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    })
    .clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict"
    })
    .status(200)
    .json({
      success: true,
      message: "User logout successfully!!"
    })
})

//Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, removeProfilePic } = req.body;

  // Get user
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
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
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture. Please try again."
      });
    }
  }

  // Save updated user
  await user.save({ validateBeforeSave: false });

  // Return updated user without sensitive fields
  const updatedUser = await User.findById(user._id).select("-password -refreshToken"); return res.status(200).json({
    success: true,
    data: updatedUser,
    message: "Profile updated successfully!"
  });
});


// Cleanup orphaned bookmarks (jobs that were deleted)
const cleanupOrphanedBookmarks = asyncHandler(async (req, res) => {
  try {
    // Get all users with bookmarks
    const users = await User.find({ bookmarks: { $exists: true, $ne: [] } });

    let totalCleaned = 0;
    let usersAffected = 0;

    for (const user of users) {
      const originalCount = user.bookmarks.length;

      // Check which bookmarks still exist
      const validBookmarks = [];
      for (const bookmarkId of user.bookmarks) {
        const jobExists = await Job.findById(bookmarkId);
        if (jobExists) {
          validBookmarks.push(bookmarkId);
        }
      }

      // Update if any bookmarks were removed
      if (validBookmarks.length !== originalCount) {
        await User.findByIdAndUpdate(user._id, { bookmarks: validBookmarks });
        totalCleaned += (originalCount - validBookmarks.length);
        usersAffected++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cleanup completed",
      data: {
        usersAffected,
        totalBookmarksRemoved: totalCleaned
      }
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return res.status(500).json({
      success: false,
      message: "Cleanup failed",
      error: error.message
    });
  }
});

export { registerUser, loginUser, getCurrentUser, refreshAccessToken, logoutUser, updateProfile, cleanupOrphanedBookmarks }