import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, BookmarkX } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";

const BookmarkedJobCard = ({ job, onView, onRemoveBookmark }) => {
    return (
        <div className="bg-white/6 border border-white/10 rounded-2xl p-5 hover:shadow-2xl transition transform hover:-translate-y-0.5">
            <div className="flex justify-between items-start gap-2">
                <div>
                    <h3 className="text-lg font-semibold text-white/95">{job.title}</h3>
                    <p className="text-sm text-gray-300 mt-1">{job.company}</p>
                </div>
                <div className="text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{job.type}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 mt-3 text-sm text-gray-400">
                <MapPin size={14} />
                <span>{job.location}</span>
                <span className="ml-auto text-teal-300 font-medium">{job.salaryRange}</span>
            </div>

            <p className="text-sm text-gray-300 mt-4 line-clamp-3">{job.description}</p>

            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => onView(job._id)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md transition"
                >
                    View Details
                </button>
                <button
                    onClick={() => onRemoveBookmark(job._id)}
                    className="px-4 py-2 border border-red-400 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition flex items-center gap-2"
                >
                    <BookmarkX size={16} />
                    Remove
                </button>
            </div>

            <div className="text-xs text-gray-500 mt-3">Posted {moment(job.createdAt).fromNow()}</div>
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
        <div className="min-h-screen bg-linear-to-b from-[#071025] via-[#071b2b] to-[#05141b] py-12 px-4 text-white">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold">Bookmarked Jobs</h1>
                    <p className="text-gray-300 mt-2">Jobs you've saved for later</p>
                </header>

                {loading ? (
                    <div className="text-center text-gray-300">Loading bookmarks...</div>
                ) : bookmarkedJobs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-gray-300 mb-4">You haven't bookmarked any jobs yet.</div>
                        <button
                            onClick={() => navigate("/jobs")}
                            className="px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-600"
                        >
                            Browse Jobs
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
