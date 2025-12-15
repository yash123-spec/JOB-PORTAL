// src/Pages/Jobs.jsx
import React, { useEffect, useState } from "react";
import { Search, MapPin, Clock, Briefcase, DollarSign, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import AddJobButton from "../Components/AddJobButton";
import { useAuth } from "../context/AuthContext";
import { jobAPI } from "../utils/api";
import toast from "react-hot-toast";

/* -------------------------
   JobCard (self-contained)
   ------------------------- */
const JobCard = ({ job, onOpen }) => {
    // Generate company logo initials
    const getCompanyInitial = (company) => {
        return company ? company.charAt(0).toUpperCase() : 'C';
    };

    return (
        <div className="bg-white rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-gray-200">
            <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {getCompanyInitial(job.company)}
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>

                    {/* Job Details */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <Briefcase size={14} className="text-gray-400" />
                            <span className="capitalize">{job.jobTime || 'Full Time'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign size={14} className="text-gray-400" />
                            <span>{job.salaryRange || job.salary || 'Not disclosed'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="capitalize">{job.location}</span>
                        </div>
                    </div>

                    {/* Posted Date & Apply Button */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>{moment(job.createdAt).fromNow()}</span>
                        </div>
                        <button
                            onClick={() => onOpen(job._id)}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            APPLY
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* -------------------------
   Jobs Page (full)
   ------------------------- */
const Jobs = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [jobList, setJobList] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: "",
        company: "",
        location: "",
        jobTime: "",
        salaryMin: "",
        salaryMax: "",
        postedDays: "",
        minApplicants: "",
        maxApplicants: ""
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalJobs: 0
    });

    // Fetch jobs from backend
    const fetchJobs = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                search: query || undefined,
                ...filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === undefined) {
                    delete params[key];
                }
            });

            const response = await jobAPI.getAllJobs(params);

            if (response.success) {
                setJobList(response.data);
                setPagination({
                    currentPage: response.currentPage,
                    totalPages: response.totalPages,
                    totalJobs: response.totalJobs
                });
            }
        } catch (error) {
            console.error("fetchJobs error:", error);
            toast.error(error.message || "Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    // Fetch when component mounts or when filters/query changes
    useEffect(() => {
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, filters]);

    const openJob = (jobId) => {
        navigate(`/jobs/${jobId}`);
    };

    const handleAddJob = (newJob) => {
        setJobList((prev) => [newJob, ...prev]);
        toast.success("Job posted successfully!");
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchJobs(newPage);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            type: "",
            company: "",
            location: "",
            jobTime: "",
            salaryMin: "",
            salaryMax: "",
            postedDays: "",
            minApplicants: "",
            maxApplicants: ""
        });
        setQuery("");
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== "").length + (query ? 1 : 0);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header with Search */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
                        {user?.role === "recruiter" && <AddJobButton onCreate={handleAddJob} />}
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Job Title or Keyword"
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    <div className="text-sm text-gray-600 mt-2">
                        Showing {jobList.length} of {pagination.totalJobs} results
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* LEFT SIDEBAR - Filters */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg p-5 border border-gray-200 sticky top-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Location Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Location</h3>
                                <input
                                    type="text"
                                    value={filters.location}
                                    onChange={(e) => handleFilterChange("location", e.target.value)}
                                    placeholder="Enter location"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Job Type Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Type</h3>
                                <div className="space-y-2">
                                    {['on-site', 'hybrid', 'remote'].map((type) => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="jobType"
                                                checked={filters.type === type}
                                                onChange={() => handleFilterChange("type", filters.type === type ? "" : type)}
                                                className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                                            />
                                            <span className="text-sm text-gray-700 capitalize">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Job Time Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Time</h3>
                                <div className="space-y-2">
                                    {[
                                        { value: 'full-time', label: 'Full Time' },
                                        { value: 'part-time', label: 'Part Time' }
                                    ].map((time) => (
                                        <label key={time.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="jobTime"
                                                checked={filters.jobTime === time.value}
                                                onChange={() => handleFilterChange("jobTime", filters.jobTime === time.value ? "" : time.value)}
                                                className="w-4 h-4 text-teal-500 focus:ring-teal-500"
                                            />
                                            <span className="text-sm text-gray-700">{time.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Salary Range Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Salary Range</h3>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        value={filters.salaryMin}
                                        onChange={(e) => handleFilterChange("salaryMin", e.target.value)}
                                        placeholder="Min (LPA)"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                    <input
                                        type="number"
                                        value={filters.salaryMax}
                                        onChange={(e) => handleFilterChange("salaryMax", e.target.value)}
                                        placeholder="Max (LPA)"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Posted Date Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Date Posted</h3>
                                <select
                                    value={filters.postedDays}
                                    onChange={(e) => handleFilterChange("postedDays", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Any time</option>
                                    <option value="1">Last 24 hours</option>
                                    <option value="7">Last 7 days</option>
                                    <option value="14">Last 14 days</option>
                                    <option value="30">Last 30 days</option>
                                </select>
                            </div>

                            {/* Company Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Company</h3>
                                <input
                                    type="text"
                                    value={filters.company}
                                    onChange={(e) => handleFilterChange("company", e.target.value)}
                                    placeholder="Company name"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Applicants Range Filter */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Applicants</h3>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        value={filters.minApplicants}
                                        onChange={(e) => handleFilterChange("minApplicants", e.target.value)}
                                        placeholder="Min"
                                        min="0"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                    <input
                                        type="number"
                                        value={filters.maxApplicants}
                                        onChange={(e) => handleFilterChange("maxApplicants", e.target.value)}
                                        placeholder="Max"
                                        min="0"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Promotional Card */}
                            <div className="mt-6 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg p-6 text-white text-center">
                                <div className="mb-3">
                                    <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-90" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">WE ARE HIRING</h3>
                                <p className="text-sm mb-4 opacity-90">Apply Today!</p>
                                <button className="bg-white text-teal-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT - Job List */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="text-center text-gray-600 py-12">Loading jobs...</div>
                        ) : jobList.length === 0 ? (
                            <div className="text-center text-gray-600 py-12 bg-white rounded-lg">
                                <p className="text-xl mb-2">No jobs found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {jobList.map((job) => (
                                        <JobCard key={job._id} job={job} onOpen={openJob} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="mt-6 flex justify-center items-center gap-2">
                                        {/* Generate page numbers */}
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-10 h-10 rounded-md font-medium transition-colors ${pagination.currentPage === page
                                                    ? 'bg-teal-500 text-white'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        {pagination.currentPage < pagination.totalPages && (
                                            <button
                                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                className="px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                                            >
                                                Next
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Jobs;
