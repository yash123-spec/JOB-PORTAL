import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, Bookmark, BookmarkCheck, ArrowLeft, Briefcase, Clock, Wallet, Users, Send, ExternalLink, Link as LinkIcon, CheckCircle2, X } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { jobAPI, messageAPI } from "../utils/api";
import { addRecentlyViewed } from "../utils/recentlyViewed";
import { useAuth } from "../context/AuthContext";



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
                onClose(true, response.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Apply failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" style={{ backdropFilter: "blur(3px)" }}>
            <div className="card w-full max-w-lg animate-scale-in p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-ink">Apply to {job.title}</h3>
                    <button onClick={() => onClose(false)} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                <p className="mb-4 text-sm text-gray-500">{job.company} • {job.location}</p>

                <label className="mb-2 block">
                    <div className="mb-2 text-sm font-medium text-gray-700">Upload resume (PDF / DOCX)</div>
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFile}
                        className="w-full rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-600 transition-colors hover:border-brand file:mr-4 file:rounded-lg file:border-0 file:bg-brand-light file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark hover:file:bg-brand-light"
                    />
                    {file && <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-dark"><CheckCircle2 size={14} /> Selected: {file.name}</div>}
                </label>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={applyToJob}
                        disabled={submitting}
                        className="btn btn-primary flex-1"
                    >
                        {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                    <button
                        onClick={() => onClose(false)}
                        className="btn btn-secondary"
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

    // Effect 1: fetch job + related jobs — runs ONLY when jobId changes (real network call)
    useEffect(() => {
        const fetchJobDetails = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getJobById(jobId);
                if (response.success) {
                    setJob(response.data);
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
    }, [jobId]);

    // Effect 2: recompute applied/bookmarked status — runs when user, job, or jobId changes
    // No network call here, so re-running this after refreshUser() is harmless.
    useEffect(() => {
        if (user && job?.applicants) {
            setAlreadyApplied(job.applicants.includes(user._id));
        }
        if (user && user.bookmarks) {
            setIsBookmarked(user.bookmarks.includes(jobId));
        }
    }, [user, job, jobId]);

    // Remember this job locally for the "Recently viewed" strip
    useEffect(() => {
        if (job?._id) addRecentlyViewed(job);
    }, [job?._id]);

    // After
    const fetchRelatedJobs = async (location, type) => {
        try {
            const response = await jobAPI.getAllJobs({
                location,
                type,
                limit: 4
            });
            if (response.success) {
                const jobs = Array.isArray(response.data?.data) ? response.data.data : [];
                const filtered = jobs.filter(j => j._id !== jobId);
                setRelatedJobs(filtered.slice(0, 3));
            }
        } catch (error) {
            console.error("Error fetching related jobs:", error);
        }
    };

    const handleBookmark = async () => {
        const next = !isBookmarked;
        // Optimistic: flip the icon instantly, then confirm with the server
        setIsBookmarked(next);
        try {
            if (next) {
                await jobAPI.bookmarkJob(jobId);
                toast.success("Added to bookmarks");
            } else {
                await jobAPI.unbookmarkJob(jobId);
                toast.success("Removed from bookmarks");
            }
            // Sync the user object in the background (non-blocking)
            refreshUser();
        } catch (error) {
            // Revert on failure
            setIsBookmarked(!next);
            toast.error(error.message || "Failed to update bookmark");
        }
    };

    const handleSendMessage = async () => {
        if (!job?.createdBy?._id) return;
        try {
            // Create (or reuse) a conversation with the recruiter, linked to this job,
            // then open the thread directly.
            const response = await messageAPI.getOrCreateConversation({
                participantId: job.createdBy._id,
                jobId: job._id,
            });
            if (response.success) {
                navigate(`/messages/${response.data._id}`);
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error(error.message || "Failed to start conversation");
        }
    };

    const handleCopyLink = async () => {
        if (!navigator.clipboard) {
            toast.error("Clipboard not supported in this browser.");
            return;
        }
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy link:", error);
            toast.error("Failed to copy link. Please try again.");
        }
    };

    const getCompanyInitial = (company) => {
        return company ? company.charAt(0).toUpperCase() : 'C';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="bg-ink py-14 text-center">
                    <div className="skeleton mx-auto h-9 w-48 rounded-lg" style={{ background: "rgba(255,255,255,.12)" }} />
                </div>
                <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:px-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="card p-6"><div className="skeleton h-24 w-full" /></div>
                        <div className="card p-6"><div className="skeleton h-40 w-full" /></div>
                    </div>
                    <div className="card p-6"><div className="skeleton h-80 w-full" /></div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-6">
                <div className="text-center">
                    <Briefcase className="mx-auto mb-3 text-gray-300" size={44} />
                    <p className="mb-4 font-display text-lg font-semibold text-ink">Job not found.</p>
                    <button onClick={() => navigate("/jobs")} className="btn btn-primary">
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    const salaryText = job.salaryRange || `₹${job.salaryMin} - ₹${job.salaryMax} LPA`;

    // Job Overview rows — built only from data the job actually has
    const overview = [
        { icon: Calendar, label: "Date Posted", value: moment(job.createdAt).format("MMM D, YYYY") },
        { icon: Briefcase, label: "Job Type", value: job.type, cap: true },
        { icon: Clock, label: "Job Time", value: job.jobTime, cap: true },
        { icon: Wallet, label: "Offered Salary", value: salaryText },
        { icon: MapPin, label: "Location", value: job.location, cap: true },
        { icon: Users, label: "Applicants", value: `${job.applicants?.length || 0} Applied` },
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero band ===== */}
            <section className="bg-ink py-14 text-center text-white">
                <h1 className="font-display text-4xl font-bold md:text-5xl">Job Details</h1>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 text-gray-600 transition-colors hover:text-brand"
                >
                    <ArrowLeft size={18} /> <span className="font-medium">Back</span>
                </button>

                {/* Main Content Grid */}
                <div className="grid animate-fade-in grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* LEFT COLUMN - Main Job Info */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Job Header Card */}
                        <div className="card p-6 md:p-8">
                            <div className="flex items-start justify-between">
                                <span className="badge badge-brand">{moment(job.createdAt).fromNow()}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyLink}
                                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-brand hover:text-brand"
                                        title="Copy link"
                                    >
                                        <LinkIcon size={18} />
                                    </button>
                                    {user?.role === "candidate" && (
                                        <button
                                            onClick={handleBookmark}
                                            className="rounded-lg border border-gray-200 p-2 transition-colors hover:border-brand"
                                            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                                        >
                                            {isBookmarked
                                                ? <BookmarkCheck size={18} className="text-brand" />
                                                : <Bookmark size={18} className="text-gray-500" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex items-start gap-4">
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-teal-500 text-2xl font-bold text-white">
                                    {getCompanyInitial(job.company)}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">{job.title}</h1>
                                    <div className="mt-1 flex items-center gap-2 text-gray-500">
                                        <span className="font-medium">{job.company}</span>
                                        {job.companyWebsite && (
                                            <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-dark">
                                                <ExternalLink size={15} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Meta row */}
                            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-100 pt-5 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5 capitalize"><Clock size={16} className="text-brand" /> {job.jobTime}</span>
                                <span className="flex items-center gap-1.5"><Wallet size={16} className="text-brand" /> {salaryText}</span>
                                <span className="flex items-center gap-1.5 capitalize"><MapPin size={16} className="text-brand" /> {job.location}</span>
                            </div>
                        </div>

                        {/* Job Description */}
                        {job.responsibilities && job.responsibilities.length > 0 && (
                            <div className="card p-6 md:p-8">
                                <h2 className="mb-4 font-display text-xl font-bold text-ink">Description</h2>
                                <div className="leading-relaxed whitespace-pre-line text-gray-600">
                                    {job.responsibilities[0]}
                                </div>
                            </div>
                        )}

                        {/* Key Responsibilities */}
                        {job.responsibilities && job.responsibilities.length > 1 && (
                            <div className="card p-6 md:p-8">
                                <h2 className="mb-4 font-display text-xl font-bold text-ink">Responsibilities</h2>
                                <ul className="space-y-3">
                                    {job.responsibilities.slice(1).map((resp, index) => (
                                        <li key={index} className="flex gap-3 text-gray-600">
                                            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-brand" />
                                            <span>{resp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Professional Skills */}
                        {job.skills && job.skills.length > 0 && (
                            <div className="card p-6 md:p-8">
                                <h2 className="mb-4 font-display text-xl font-bold text-ink">Professional Skills</h2>
                                <ul className="space-y-3">
                                    {job.skills.map((skill, index) => (
                                        <li key={index} className="flex gap-3 text-gray-600">
                                            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-brand" />
                                            <span>{skill}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Sidebar */}
                    <div className="space-y-6">
                        <div className="sticky top-4 space-y-6">
                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {user?.role === "candidate" && (
                                    <>
                                        {!alreadyApplied ? (
                                            <button
                                                onClick={() => setShowApplyModal(true)}
                                                className="btn btn-primary w-full py-3.5 text-base"
                                            >
                                                Apply Now
                                            </button>
                                        ) : (
                                            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-light px-4 py-3.5 text-center font-semibold text-brand-dark">
                                                <CheckCircle2 size={18} /> Already Applied
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Message Recruiter — candidates only */}
                                {user?.role === "candidate" && job.createdBy?._id !== user._id && (
                                    <button onClick={handleSendMessage} className="btn btn-secondary w-full py-3.5">
                                        <Send size={18} /> Message Recruiter
                                    </button>
                                )}
                            </div>

                            {/* Job Overview Card */}
                            <div className="rounded-2xl bg-brand-mint p-6">
                                <h3 className="mb-5 font-display text-lg font-bold text-ink">Job Overview</h3>
                                <div className="space-y-5">
                                    {overview.map((row) => {
                                        const Icon = row.icon;
                                        return (
                                            <div key={row.label} className="flex items-start gap-3">
                                                <Icon size={20} className="mt-0.5 flex-shrink-0 text-brand" />
                                                <div>
                                                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{row.label}</div>
                                                    <div className={`font-semibold text-ink ${row.cap ? "capitalize" : ""}`}>{row.value}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Map */}
                                <div className="mt-6 overflow-hidden rounded-xl border border-white/60">
                                    <iframe
                                        title="Job Location"
                                        width="100%"
                                        height="200"
                                        frameBorder="0"
                                        style={{ border: 0, display: "block" }}
                                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(job.location)}&zoom=12`}
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Jobs Section */}
                {relatedJobs.length > 0 && (
                    <div className="mt-14">
                        <h2 className="mb-6 font-display text-2xl font-bold text-ink">Related Jobs</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {relatedJobs.map((relJob) => (
                                <div
                                    key={relJob._id}
                                    onClick={() => navigate(`/jobs/${relJob._id}`)}
                                    className="card card-hover cursor-pointer p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-teal-500 text-lg font-bold text-white">
                                            {getCompanyInitial(relJob.company)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-display font-bold text-ink">{relJob.title}</h3>
                                            <p className="truncate text-sm text-gray-500">{relJob.company}</p>
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
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
                    onClose={(applied, message) => {
                        setShowApplyModal(false);
                        if (applied) {
                            setAlreadyApplied(true);
                            // Optimistically reflect the new applicant locally so the
                            // "N Applied" stat updates instantly without a refetch
                            setJob((prev) =>
                                prev && user && !prev.applicants?.map(String).includes(String(user._id))
                                    ? { ...prev, applicants: [...(prev.applicants || []), user._id] }
                                    : prev
                            );
                            toast.success(
                                message
                                    ? `${message} Redirecting to My Applications...`
                                    : "Application submitted! Redirecting to My Applications..."
                            );
                            setTimeout(() => navigate("/my-applications"), 2000);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default JobDetails;
