import mongoose, { Schema } from "mongoose";


const jobSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    responsibilities: [{
        type: String
    }],
    skills: [{
        type: String
    }],
    company: {
        type: String,
        required: true
    },
    companyWebsite: {
        type: String,
        default: null
    },
    location: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["on-site", "hybrid", "remote"],
        default: "on-site"
    },
    jobTime: {
        type: String,
        enum: ["full-time", "part-time"],
        default: "full-time"
    },
    salaryRange: {
        type: String,
    },
    salaryMin: {
        type: Number,
        default: null
    },
    salaryMax: {
        type: Number,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    applicants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true })

jobSchema.index({ createdBy: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ type: 1, jobTime: 1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });

export const Job = mongoose.model("Job", jobSchema)