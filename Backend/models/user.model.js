import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";  // Needed for password encryption
import jwt from "jsonwebtoken"

const userSchema = new Schema({
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address with a proper domain"]
  },
  password: {
    type: String,
    required: function () {
      // Password required only for local auth (email/password registration)
      return this.authProvider === 'local';
    },
    minlength: 6   // Minimum password length
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'apple'],
    default: 'local'
  },
  providerId: {
    type: String,
    default: null
    // Note: Unique index with partial filter is created via migration script
    // Only non-null string values are enforced to be unique
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["candidate", "recruiter", "admin"],  // restrict to 3 valid roles
    default: "candidate"
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked'],
    default: function () {
      // Auto-approve candidates and admins, pending for recruiters
      return this.role === 'recruiter' ? 'pending' : 'approved';
    }
  },
  refreshToken: {
    type: String,
    default: ""
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  profilePic: {
    type: String,
    default: null,
  }
}, { timestamps: true });


userSchema.pre("save", async function (next) {
  // Only hash password if it exists and is modified
  if (!this.password || !this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
  // Return false if user has no password (OAuth users)
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      fullname: this.fullname,
      email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}


userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}


export const User = mongoose.model("User", userSchema)