import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, BookmarkX, Wallet, Eye, Building2 } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";
import { JobCardSkeleton } from "../Components/ui/Skeleton";

const BookmarkedJobCard = ({ job, onView, onRemoveBookmark }) => {
    return (
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 text-lg font-bold text-white">
                    {(job.company || "C").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-ink truncate">{job.title}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                        <Building2 size={14} className="text-brand" /> {job.company}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5 capitalize"><MapPin size={16} className="text-brand" /> {job.location}</span>
                <span className="flex items-center gap-1.5 capitalize"><Clock size={16} className="text-brand" /> {job.type}</span>
                <span className="flex items-center gap-1.5"><Wallet size={16} className="text-brand" /> {job.salaryRange || "—"}</span>
            </div>

            <p className="mt-4 line-clamp-3 text-sm text-gray-600">{job.description}</p>

            <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4">
                <button
                    onClick={() => onView(job._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                    <Eye size={16} /> View Details
                </button>
                <button
                    onClick={() => onRemoveBookmark(job._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                >
                    <BookmarkX size={16} /> Remove
                </button>
            </div>

            <div className="mt-3 text-xs text-gray-400">Posted {moment(job.createdAt).fromNow()}</div>
        </div>
    );
};

const Bookmarked = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (user.role === "recruiter") {
            toast.error("Recruiters cannot access bookmarks page.");
            navigate("/profile");
            return;
        }

        const fetchBookmarkedJobs = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getBookmarkedJobs();
                if (response.success) {
                    setBookmarkedJobs(response.data);
                }
            } catch (error) {
                console.error("Error fetching bookmarked jobs:", error);
                toast.error(error.message || "Failed to fetch bookmarks");
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarkedJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleViewJob = (jobId) => {
        navigate(`/jobs/${jobId}`);
    };

    const handleRemoveBookmark = async (jobId) => {
        try {
            const response = await jobAPI.unbookmarkJob(jobId);
            if (response.success) {
                setBookmarkedJobs((prev) => prev.filter((job) => job._id !== jobId));
                // Refresh user data to update bookmark count in context
                await refreshUser();
                toast.success("Removed from bookmarks");
            }
        } catch (error) {
            console.error("Error removing bookmark:", error);
            toast.error(error.message || "Failed to remove bookmark");
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero band ===== */}
            <section className="bg-ink py-14 px-4 text-center text-white">
                <h1 className="font-display text-4xl font-bold md:text-5xl">Bookmarked Jobs</h1>
                <p className="mx-auto mt-3 max-w-xl text-gray-300">Jobs you've saved for later.</p>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
                {loading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
                    </div>
                ) : bookmarkedJobs.length === 0 ? (
                    <div className="flex flex-col items-center py-24 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
                            <BookmarkX size={30} />
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold text-ink">No bookmarks yet</h3>
                        <p className="mt-1 text-sm text-gray-500">You haven't bookmarked any jobs yet.</p>
                        <button
                            onClick={() => navigate("/jobs")}
                            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                        >
                            Browse Jobs
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {bookmarkedJobs.map((job) => (
                            <BookmarkedJobCard
                                key={job._id}
                                job={job}
                                onView={handleViewJob}
                                onRemoveBookmark={handleRemoveBookmark}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookmarked;
