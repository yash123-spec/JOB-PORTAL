// src/Pages/Jobs.jsx - EXAMPLE WITH REAL API INTEGRATION
// This is an example of how to update Jobs.jsx to use the real backend API
// Copy the changes you need from this file to your actual Jobs.jsx

import React, { useEffect, useState } from "react";
import { Search, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import AddJobButton from "../Components/AddJobButton";
import { useAuth } from "../context/AuthContext";
import { jobAPI } from "../utils/api"; // <-- Import the API utility

/* -------------------------
   JobCard (same as before)
   ------------------------- */
const JobCard = ({ job, onOpen }) => {
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
                <span className="ml-auto text-teal-300 font-medium">{job.salary}</span>
            </div>

            <p className="text-sm text-gray-300 mt-4 line-clamp-3">{job.description}</p>

            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => onOpen(job._id)}
                    className="ml-auto bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md transition"
                >
                    Apply Now
                </button>
            </div>

            <div className="text-xs text-gray-500 mt-3">
                Posted {moment(job.createdAt).fromNow()}
            </div>
        </div>
    );
};

/* -------------------------
   Jobs Page - WITH REAL API
   ------------------------- */
const Jobs = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [jobList, setJobList] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch jobs from backend API instead of using dummy data
    const fetchJobs = async () => {
        setLoading(true);
        try {
            // Call the real backend API
            const response = await jobAPI.getAllJobs({
                search: query // Backend can handle search parameter
            });

            if (response.success) {
                setJobList(response.data);
            }
        } catch (error) {
            console.error("fetchJobs error:", error);
            toast.error(error.message || "Failed to fetch jobs");
            // On error, you can either show empty list or keep previous data
            setJobList([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch when component mounts and whenever query changes
    // Debounce the search for better performance
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchJobs();
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(debounceTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const openJob = (jobId) => {
        navigate(`/jobs/${jobId}`);
    };

    // Handle newly created job from AddJobModal
    const handleAddJob = (newJob) => {
        setJobList((prev) => [newJob, ...prev]);
        toast.success("Job posted successfully!");
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-[#071025] via-[#071b2b] to-[#05141b] py-12 px-4 text-white">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-extrabold">Featured Jobs</h1>
                        <p className="text-gray-300 mt-2">
                            Browse latest openings — refine results with search and filters.
                        </p>
                    </div>

                    {/* Right side: Search + Add Job (if recruiter) */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-full max-w-md relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search job title, company, or location..."
                                className="w-full pl-12 pr-4 py-3 rounded-full bg-white/6 focus:bg-white/10 placeholder-gray-400 outline-none transition"
                            />
                        </div>

                        {/* Show AddJobButton only if user is recruiter */}
                        {user?.role === "recruiter" && <AddJobButton onCreate={handleAddJob} />}
                    </div>
                </header>

                {loading ? (
                    <div className="text-center text-gray-300">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                        <p className="mt-2">Loading jobs...</p>
                    </div>
                ) : jobList.length === 0 ? (
                    <div className="text-center text-gray-300 py-12">
                        <p className="text-xl">No jobs found</p>
                        <p className="text-sm mt-2">Try adjusting your search criteria</p>
                    </div>
                ) : (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {jobList.map((job) => (
                            <JobCard key={job._id} job={job} onOpen={openJob} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Jobs;

/* 
CHANGES MADE FROM ORIGINAL:
1. Imported jobAPI from '../utils/api'
2. Imported toast for error messages
3. Updated fetchJobs() to call jobAPI.getAllJobs() instead of using dummy data
4. Added proper error handling with try-catch
5. Added debouncing to search (300ms delay)
6. Improved loading state with spinner
7. Better empty state messages
8. Made handleAddJob show success toast

TO USE THIS IN YOUR ACTUAL Jobs.jsx:
1. Copy the fetchJobs function
2. Copy the useEffect with debouncing
3. Add the toast import
4. Make sure jobAPI is imported
*/
