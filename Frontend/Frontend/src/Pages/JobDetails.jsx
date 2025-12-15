import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Bookmark, BookmarkCheck, ArrowLeft, Briefcase, Clock, DollarSign, Users, Send, ExternalLink, Share2, Link as LinkIcon } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/**
 * JobDetails page with new design matching the reference image
 */

const ApplyModal = ({ job, onClose }) => {
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleFile = (e) => {
        const f = e.target.files?.[0];
        if (f) {
            // Validate file type
            if (!f.name.match(/\.(pdf|doc|docx)$/i)) {
                toast.error("Please upload a PDF or DOCX file");
                return;
            }
            // Validate file size (5MB max)
            if (f.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            setFile(f);
        }
    };

    const applyToJob = async () => {
        if (!file) {
            toast.error("Please select a resume file before applying.");
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('resume', file);

            const response = await jobAPI.applyForJob(job._id, formData);

            if (response.success) {
                toast.success(response.message || "Applied successfully!");
                onClose(true);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Apply failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Apply to {job.title}</h3>
                    <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">{job.company} • {job.location}</p>

                <label className="block mb-4">
                    <div className="text-sm text-gray-700 mb-2">Upload resume (PDF / DOCX)</div>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFile}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                    />
                    {file && <div className="text-xs text-gray-500 mt-2">Selected: {file.name}</div>}
                </label>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={applyToJob}
                        disabled={submitting}
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                    <button
                        onClick={() => onClose(false)}
                        className="px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const JobDetails = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    const [job, setJob] = useState(null);
    const [relatedJobs, setRelatedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Fetch job details
    useEffect(() => {
        const fetchJobDetails = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getJobById(jobId);
                if (response.success) {
                    setJob(response.data);
                    // Check if already applied
                    if (user && response.data.applicants) {
                        setAlreadyApplied(response.data.applicants.includes(user._id));
                    }
                    // Check if bookmarked
                    if (user && user.bookmarks) {
                        setIsBookmarked(user.bookmarks.includes(jobId));
                    }

                    // Fetch related jobs (same location or same type)
                    fetchRelatedJobs(response.data.location, response.data.type);
                }
            } catch (error) {
                console.error("Error fetching job:", error);
                toast.error(error.message || "Failed to fetch job details");
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();
    }, [jobId, user]);

    const fetchRelatedJobs = async (location, type) => {
        try {
            const response = await jobAPI.getAllJobs({
                location,
                type,
                limit: 4
            });
            if (response.success) {
                // Filter out current job
                const filtered = response.data.filter(j => j._id !== jobId);
                setRelatedJobs(filtered.slice(0, 3));
            }
        } catch (error) {
            console.error("Error fetching related jobs:", error);
        }
    };

    const handleBookmark = async () => {
        try {
            if (isBookmarked) {
                const response = await jobAPI.unbookmarkJob(jobId);
                if (response.success) {
                    setIsBookmarked(false);
                    await refreshUser();
                    toast.success("Removed from bookmarks");
                }
            } else {
                const response = await jobAPI.bookmarkJob(jobId);
                if (response.success) {
                    setIsBookmarked(true);
                    await refreshUser();
                    toast.success("Added to bookmarks");
                }
            }
        } catch (error) {
            toast.error(error.message || "Failed to update bookmark");
        }
    };

    const handleSendMessage = () => {
        if (job?.createdBy?._id) {
            navigate(`/messages?userId=${job.createdBy._id}`);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    const getCompanyInitial = (company) => {
        return company ? company.charAt(0).toUpperCase() : 'C';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center text-gray-600">Loading job details...</div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Job not found.</p>
                    <button
                        onClick={() => navigate("/jobs")}
                        className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600"
                    >
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN - Main Job Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Job Header Card */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex items-start gap-4">
                                {/* Company Logo */}
                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                                    {getCompanyInitial(job.company)}
                                </div>

                                {/* Job Title & Company */}
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                                        <span className="font-medium">{job.company}</span>
                                        {job.companyWebsite && (
                                            <a
                                                href={job.companyWebsite}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-teal-500 hover:text-teal-600"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                    </div>

                                    {/* Quick Info Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full capitalize">
                                            {job.type}
                                        </span>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full capitalize">
                                            {job.jobTime}
                                        </span>
                                        <span className="px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full font-medium">
                                            {job.salaryRange || `₹${job.salaryMin} - ₹${job.salaryMax} LPA`}
                                        </span>
                                    </div>
                                </div>

                                {/* Share & Bookmark */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyLink}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                        title="Copy link"
                                    >
                                        <LinkIcon size={20} className="text-gray-600" />
                                    </button>
                                    {user?.role === "candidate" && (
                                        <button
                                            onClick={handleBookmark}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                                            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                        >
                                            {isBookmarked ? (
                                                <BookmarkCheck size={20} className="text-teal-500" />
                                            ) : (
                                                <Bookmark size={20} className="text-gray-600" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Job Description */}
                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {job.responsibilities[0]}
                                </div>
                            </div>
                        )}

                        {/* Key Responsibilities */}
                        {job.responsibilities && job.responsibilities.length > 1 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Responsibilities</h2>
                                <ul className="space-y-3">
                                    {job.responsibilities.slice(1).map((resp, index) => (
                                        <li key={index} className="flex gap-3 text-gray-700">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Professional Skills */}
                        {job.skills && job.skills.length > 0 && (
                            <div className="bg-white rounded-lg p-6 border border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Skills</h2>
                                <ul className="space-y-3">
                                    {job.skills.map((skill, index) => (
                                        <li key={index} className="flex gap-3 text-gray-700">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span>{skill}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Sidebar */}
                    <div className="space-y-6">
                        {/* Job Overview Card */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Overview</h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-sm text-gray-500">Date Posted</div>
                                        <div className="text-gray-900 font-medium">{moment(job.createdAt).format('MMM D, YYYY')}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-sm text-gray-500">Location</div>
                                        <div className="text-gray-900 font-medium capitalize">{job.location}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Briefcase size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-sm text-gray-500">Job Type</div>
                                        <div className="text-gray-900 font-medium capitalize">{job.type}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-sm text-gray-500">Job Time</div>
                                        <div className="text-gray-900 font-medium capitalize">{job.jobTime}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <DollarSign size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-sm text-gray-500">Salary</div>
                                        <div className="text-gray-900 font-medium">{job.salaryRange || `₹${job.salaryMin} - ₹${job.salaryMax} LPA`}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Users size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <div className="text-sm text-gray-500">Applicants</div>
                                        <div className="text-gray-900 font-medium">{job.applicants?.length || 0} Applied</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                {user?.role === "candidate" && (
                                    <>
                                        {!alreadyApplied ? (
                                            <button
                                                onClick={() => setShowApplyModal(true)}
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                            >
                                                APPLY NOW
                                            </button>
                                        ) : (
                                            <div className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-center font-medium">
                                                Already Applied
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Send Message Button */}
                                <button
                                    onClick={handleSendMessage}
                                    className="w-full flex items-center justify-center gap-2 bg-white border-2 border-teal-500 text-teal-500 hover:bg-teal-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                >
                                    <Send size={18} />
                                    <span>Send Message</span>
                                </button>
                            </div>
                        </div>

                        {/* Google Maps */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                            <div className="rounded-lg overflow-hidden">
                                <iframe
                                    title="Job Location"
                                    width="100%"
                                    height="200"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(job.location)}&zoom=12`}
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Jobs Section */}
                {relatedJobs.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Jobs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedJobs.map((relJob) => (
                                <div
                                    key={relJob._id}
                                    onClick={() => navigate(`/jobs/${relJob._id}`)}
                                    className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {getCompanyInitial(relJob.company)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{relJob.title}</h3>
                                            <p className="text-sm text-gray-600 truncate">{relJob.company}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <span className="capitalize">{relJob.type}</span>
                                                <span>•</span>
                                                <span className="capitalize">{relJob.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showApplyModal && (
                <ApplyModal
                    job={job}
                    onClose={(applied) => {
                        setShowApplyModal(false);
                        if (applied) {
                            setAlreadyApplied(true);
                            toast.success("Application submitted! Redirecting to My Applications...");
                            setTimeout(() => navigate("/my-applications"), 2000);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default JobDetails;
