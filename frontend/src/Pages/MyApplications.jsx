// src/Pages/MyApplications.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";
import {
    FileText,
    Building2,
    MapPin,
    Clock,
    Eye,
    CheckCircle,
    XCircle,
    Trash2,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    X,
    Download,
} from "lucide-react";
import { JobCardSkeleton } from "../Components/ui/Skeleton";

/**
 * MyApplications page
 * - Fetches applied jobs from backend
 * - Withdraw application functionality
 * - View Job navigates to /jobs/:jobId
 */

// Presentation-only mapping: status -> badge colors + icon
const getStatusMeta = (status) => {
    switch (status) {
        case "hired":
            return { label: "hired", classes: "bg-green-600 text-white", Icon: CheckCircle };
        case "shortlisted":
            return { label: "shortlisted", classes: "bg-green-100 text-green-800", Icon: CheckCircle };
        case "under review":
            return { label: "under review", classes: "bg-blue-100 text-blue-800", Icon: Eye };
        case "rejected":
            return { label: "rejected", classes: "bg-red-100 text-red-800", Icon: XCircle };
        default:
            return { label: status || "applied", classes: "bg-amber-100 text-amber-800", Icon: Clock };
    }
};

const WithdrawConfirmModal = ({ open, onClose, onConfirm, jobTitle }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-ink">Withdraw Application</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Are you sure you want to withdraw your application for <strong>{jobTitle}</strong>? This action can be undone only via backend (if supported).
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                        <Trash2 size={16} /> Withdraw
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResumePreviewModal = ({ open, onClose, resumeUrl, jobTitle }) => {
    if (!open) return null;

    const handleDownload = async () => {
        const safeName = `${(jobTitle || "resume").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-resume.pdf`;
        try {
            // Fetch as a blob so the download happens in-page — a plain <a download>
            // to a cross-origin Cloudinary URL is ignored by browsers and just navigates away.
            const res = await fetch(resumeUrl);
            if (!res.ok) throw new Error("fetch failed");
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = safeName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } catch {
            // Fallback: Cloudinary's fl_attachment forces a download in a new tab,
            // so the current tab (the website) stays put.
            const attachmentUrl = resumeUrl.replace("/upload/", "/upload/fl_attachment/");
            window.open(attachmentUrl, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                            <FileText size={18} />
                        </span>
                        <div className="min-w-0">
                            <h3 className="truncate font-display text-base font-semibold text-ink">Your Resume</h3>
                            <p className="truncate text-xs text-gray-500">{jobTitle}</p>
                        </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                        >
                            <Download size={15} /> Download
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-50">
                    <iframe
                        src={resumeUrl}
                        title="Resume preview"
                        className="h-full w-full border-0"
                    />
                </div>
            </div>
        </div>
    );
};

const ApplicationCard = ({ job, onView, onWithdrawClick, onViewResume }) => {
    const { label, classes, Icon } = getStatusMeta(job.applicationStatus);

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 text-lg font-bold text-white">
                        {(job?.company || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-display text-lg font-bold text-ink truncate">{job?.title || "Job removed"}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                            <Building2 size={14} className="text-brand" /> {job?.company || "—"}
                        </p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ${classes}`}>
                    <Icon size={12} /> {label}
                </span>
            </div>

            <p className="mt-4 line-clamp-2 text-sm text-gray-600">
                {job?.description ?? "No description available."}
            </p>

            <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 capitalize">
                        <MapPin size={16} className="text-brand" /> {job?.location || "—"}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={16} className="text-brand" /> Applied {moment(job.appliedAt || job.createdAt).fromNow()}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onView(job?._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                    >
                        <Eye size={16} /> View Job
                    </button>

                    {job.resumeUrl && (
                        <button
                            onClick={() => onViewResume(job)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand hover:text-brand"
                        >
                            <FileText size={16} /> Resume
                        </button>
                    )}

                    {job.applicationStatus !== 'hired' && job.applicationStatus !== 'rejected' && (
                        <button
                            onClick={() => onWithdrawClick(job)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                        >
                            <Trash2 size={16} /> Withdraw
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const MyApplications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    // modal state
    const [toWithdraw, setToWithdraw] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // resume preview state
    const [resumePreview, setResumePreview] = useState(null); // { resumeUrl, title }

    // pagination
    const PER_PAGE = 6;
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (user.role === "recruiter") {
            toast.error("Recruiters cannot access My Applications page.");
            navigate("/profile");
            return;
        }

        const fetchAppliedJobs = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getAppliedJobs();
                if (response.success) {
                    // Each item is { job: {...}, applicationStatus, appliedAt, applicationId }.
                    // Flatten so the card gets the job's fields + the job's _id (used by View/Withdraw),
                    // while keeping the application's status/date.
                    const items = Array.isArray(response.data?.data) ? response.data.data : [];
                    setApplications(
                        items
                            .filter((item) => item.job) // skip any without a job
                            .map((item) => ({
                                ...item.job,
                                applicationId: item.applicationId,
                                applicationStatus: item.applicationStatus,
                                appliedAt: item.appliedAt,
                                resumeUrl: item.resumeUrl,
                            }))
                    );
                }
            } catch (error) {
                console.error("Error fetching applied jobs:", error);
                toast.error(error.message || "Failed to fetch applications");
            } finally {
                setLoading(false);
            }
        };

        fetchAppliedJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Derived page items
    const totalPages = Math.max(1, Math.ceil(applications.length / PER_PAGE));
    const pageItems = applications.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleViewJob = (jobId) => {
        if (!jobId) {
            toast.error("Job not available.");
            return;
        }
        navigate(`/jobs/${jobId}`);
    };

    const handleViewResume = (job) => {
        if (!job?.resumeUrl) {
            toast.error("Resume not available.");
            return;
        }
        setResumePreview({ resumeUrl: job.resumeUrl, title: job?.title || "Application" });
    };

    // Withdraw action (local simulation)
    const handleWithdrawClick = (job) => {
        setToWithdraw(job);
        setModalOpen(true);
    };

    const handleConfirmWithdraw = async () => {
        if (!toWithdraw) return;

        try {
            const response = await jobAPI.withdrawApplication(toWithdraw._id);
            if (response.success) {
                // Remove from local state
                setApplications((prev) => prev.filter((job) => job._id !== toWithdraw._id));
                toast.success(response.message || "Application withdrawn successfully");
            }
        } catch (error) {
            console.error("Error withdrawing application:", error);
            toast.error(error.message || "Failed to withdraw application");
        } finally {
            setModalOpen(false);
            setToWithdraw(null);
        }
    };

    if (!user) return null; // redirect handled in effect

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero band ===== */}
            <section className="bg-ink py-14 text-center text-white">
                <h1 className="font-display text-4xl font-bold md:text-5xl">My Applications</h1>
                <p className="mx-auto mt-3 max-w-xl px-4 text-gray-300">
                    Track your job applications and withdraw if needed.
                </p>
            </section>

            <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
                {loading ? (
                    <div className="grid gap-4">
                        {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
                    </div>
                ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
                            <FileText size={30} />
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold text-ink">No applications yet</h3>
                        <p className="mt-1 text-sm text-gray-500">You have not applied to any jobs yet.</p>
                        <button
                            onClick={() => navigate("/jobs")}
                            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                        >
                            Browse Jobs <ChevronRight size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4">
                            {pageItems.map((job) => (
                                <ApplicationCard
                                    key={job._id}
                                    job={job}
                                    onView={handleViewJob}
                                    onWithdrawClick={handleWithdrawClick}
                                    onViewResume={handleViewResume}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {applications.length > PER_PAGE && (
                            <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-5">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="group inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-medium text-brand shadow-sm transition-all hover:border-brand hover:bg-brand/10 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-brand/5"
                                >
                                    <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5 group-disabled:translate-x-0" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <span>Page</span>
                                    <span className="font-semibold text-gray-900">{page}</span>
                                    <span>of</span>
                                    <span className="font-semibold text-gray-900">{totalPages}</span>
                                </div>

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-brand"
                                >
                                    Next
                                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <WithdrawConfirmModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmWithdraw}
                jobTitle={toWithdraw?.title || "this job"}
            />

            <ResumePreviewModal
                open={!!resumePreview}
                onClose={() => setResumePreview(null)}
                resumeUrl={resumePreview?.resumeUrl}
                jobTitle={resumePreview?.title}
            />
        </div>
    );
};

export default MyApplications;
