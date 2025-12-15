
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  resumeUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["applied", "shortlisted", "rejected", "hired"],
    default: "applied",
  },
}, { timestamps: true });

export const Application = mongoose.model("Application", applicationSchema);
