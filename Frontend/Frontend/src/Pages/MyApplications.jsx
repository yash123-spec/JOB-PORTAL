// src/Pages/MyApplications.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";

/**
 * MyApplications page
 * - Fetches applied jobs from backend
 * - Withdraw application functionality
 * - View Job navigates to /jobs/:jobId
 */

const statusColors = {
    applied: "bg-amber-100 text-amber-800",
    "under review": "bg-blue-100 text-blue-800",
    shortlisted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    hired: "bg-green-600 text-white",
};

const WithdrawConfirmModal = ({ open, onClose, onConfirm, jobTitle }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">Withdraw Application</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to withdraw your application for <strong>{jobTitle}</strong>? This action can be undone only via backend (if supported).
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md border hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                        Withdraw
                    </button>
                </div>
            </div>
        </div>
    );
};

const ApplicationCard = ({ job, onView, onWithdrawClick }) => {
    const statusColor =
        job.applicationStatus === 'hired' ? 'bg-green-600 text-white' :
            job.applicationStatus === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                job.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800';

    return (
        <div className="bg-white/6 border border-white/10 rounded-2xl p-4 transition hover:shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-white/95">{job?.title || "Job removed"}</h3>
                            <p className="text-sm text-gray-300 mt-1">{job?.company || "—"}</p>
                            <div className="text-xs text-gray-400 mt-1">{job?.location || "—"}</div>
                        </div>
                        <div className="text-xs flex flex-col items-end gap-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                {job.applicationStatus || 'applied'}
                            </span>
                            <div className="text-xs text-gray-400 mt-1">Applied {moment(job.appliedAt || job.createdAt).fromNow()}</div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-300 mt-3 line-clamp-2">
                        {job?.description ?? "No description available."}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                        <button
                            onClick={() => onView(job?._id)}
                            className="px-3 py-1 rounded-md bg-teal-500 text-white hover:bg-teal-600"
                        >
                            View Job
                        </button>

                        {job.applicationStatus !== 'hired' && job.applicationStatus !== 'rejected' && (
                            <button
                                onClick={() => onWithdrawClick(job)}
                                className="px-3 py-1 rounded-md border border-red-400 text-red-400 hover:bg-red-500 hover:text-white"
                            >
                                Withdraw
                            </button>
                        )}
                    </div>
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
                    setApplications(response.data);
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
        <div className="min-h-screen bg-linear-to-b from-[#071025] via-[#071b2b] to-[#05141b] py-12 px-4 text-white">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold">My Applications</h1>
                        <p className="text-gray-300 mt-1">Track your job applications and withdraw if needed.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="text-center text-gray-300">Loading applications...</div>
                ) : applications.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-gray-300 mb-4">You have not applied to any jobs yet.</div>
                        <button
                            onClick={() => navigate("/jobs")}
                            className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-600"
                        >
                            Browse Jobs
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
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {applications.length > PER_PAGE && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-300">
                                    Page {page} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 rounded-md border disabled:opacity-60"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1 rounded-md border disabled:opacity-60"
                                    >
                                        Next
                                    </button>
                                </div>
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
        </div>
    );
};

export default MyApplications;
