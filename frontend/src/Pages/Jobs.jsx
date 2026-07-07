// src/Pages/Jobs.jsx
import { useEffect, useState } from "react";
import { MapPin, Wallet, Clock, Bookmark, BookmarkCheck, CheckCircle, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import moment from "moment";
import { useAuth } from "../context/AuthContext";
import { jobAPI } from "../utils/api";
import toast from "react-hot-toast";
import axios from "axios";
import { JobCardSkeleton } from "../Components/ui/Skeleton";
import SearchAutocomplete from "../Components/jobs/SearchAutocomplete";
import { getRecentlyViewed } from "../utils/recentlyViewed";

/* -------------------------
   JobCard (self-contained)
   ------------------------- */
const JobCard = ({ job, onOpen, isCandidate, isBookmarked, isApplied, onToggleBookmark }) => {
    const getCompanyInitial = (company) => {
        return company ? company.charAt(0).toUpperCase() : 'C';
    };

    const open = () => onOpen(job._id);

    // Keyboard accessibility: Enter / Space open the job
    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    };

    const handleBookmarkClick = (e) => {
        e.stopPropagation(); // don't trigger card navigation
        onToggleBookmark(job._id, isBookmarked);
    };

    return (
        <div
            onClick={open}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`View ${job.title} at ${job.company}`}
            className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
            {/* Top row: posted time + bookmark */}
            <div className="flex items-start justify-between">
                <span className="rounded-md bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark">
                    {moment(job.createdAt).fromNow()}
                </span>
                {isCandidate && (
                    <button
                        onClick={handleBookmarkClick}
                        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this job"}
                        title={isBookmarked ? "Remove bookmark" : "Bookmark this job"}
                        className="text-gray-300 transition-colors hover:text-brand"
                    >
                        {isBookmarked ? <BookmarkCheck size={20} className="text-brand" /> : <Bookmark size={20} />}
                    </button>
                )}
            </div>

            {/* Logo + title */}
            <div className="mt-4 flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 text-lg font-bold text-white">
                    {getCompanyInitial(job.company)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold text-ink truncate">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company}</p>
                </div>
            </div>

            {/* Status badges */}
            {isCandidate && (isApplied || isBookmarked) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isApplied && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            <CheckCircle size={12} /> Applied
                        </span>
                    )}
                    {isBookmarked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
                            <BookmarkCheck size={12} /> Bookmarked
                        </span>
                    )}
                </div>
            )}

            {/* Meta row + Job Details */}
            <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 capitalize">
                        <Clock size={16} className="text-brand" /> {job.jobTime || "Full time"}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Wallet size={16} className="text-brand" /> {job.salaryRange || job.salary || "Not disclosed"}
                    </span>
                    <span className="flex items-center gap-1.5 capitalize">
                        <MapPin size={16} className="text-brand" /> {job.location}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); open(); }}
                    className="shrink-0 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                    Job Details
                </button>
            </div>
        </div>
    );
};

/* -------------------------
   Jobs Page (full)
   ------------------------- */
const Jobs = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, refreshUser } = useAuth();
    const isCandidate = user?.role === "candidate";
    // Track bookmarked job ids locally for instant toggle feedback
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [jobList, setJobList] = useState([]);
    // Snapshot of recently opened jobs (from localStorage) for the quick-access strip
    const [recentlyViewed] = useState(() => getRecentlyViewed());
    // Seed the search + location from the URL (e.g. arriving from the Home search bar)
    const [query, setQuery] = useState(() => searchParams.get("search") || "");
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(() => ({
        type: "",
        company: "",
        location: searchParams.get("location") || "",
        jobTime: "",
        salaryMin: "",
        salaryMax: "",
        postedDays: "",
        minApplicants: "",
        maxApplicants: ""
    }));
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalJobs: 0
    });

    // Keep local bookmark set in sync with the logged-in user's bookmarks
    useEffect(() => {
        setBookmarkedIds(new Set((user?.bookmarks || []).map((id) => String(id))));
    }, [user]);

    // Sync search + location from the URL when it changes (e.g. a new search from Home)
    useEffect(() => {
        setQuery(searchParams.get("search") || "");
        setFilters((prev) => ({ ...prev, location: searchParams.get("location") || "" }));
    }, [searchParams]);

    const handleToggleBookmark = async (jobId, currentlyBookmarked) => {
        // Optimistic UI update
        setBookmarkedIds((prev) => {
            const next = new Set(prev);
            currentlyBookmarked ? next.delete(jobId) : next.add(jobId);
            return next;
        });

        try {
            if (currentlyBookmarked) {
                await jobAPI.unbookmarkJob(jobId);
                toast.success("Removed from bookmarks");
            } else {
                await jobAPI.bookmarkJob(jobId);
                toast.success("Saved to bookmarks");
            }
            // Sync the user object so other pages (Bookmarked, Profile count) stay correct
            refreshUser?.();
        } catch (error) {
            // Revert on failure
            setBookmarkedIds((prev) => {
                const next = new Set(prev);
                currentlyBookmarked ? next.add(jobId) : next.delete(jobId);
                return next;
            });
            toast.error(error.message || "Failed to update bookmark");
        }
    };

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

            // Don't send an inverted range (max < min) — it would silently return nothing
            if (params.salaryMin && params.salaryMax && Number(params.salaryMax) < Number(params.salaryMin)) {
                delete params.salaryMin;
                delete params.salaryMax;
            }
            if (params.minApplicants && params.maxApplicants && Number(params.maxApplicants) < Number(params.minApplicants)) {
                delete params.minApplicants;
                delete params.maxApplicants;
            }

            const response = await jobAPI.getAllJobs(params);

            if (response.success) {
                setJobList(Array.isArray(response.data?.data) ? response.data.data : []);
                setPagination({
                    currentPage: response.data?.currentPage || 1,
                    totalPages: response.data?.totalPages || 1,
                    totalJobs: response.data?.totalJobs || 0
                });
            }
        } catch (error) {
            console.error("fetchJobs error:", error);
            toast.error(error.message || "Failed to fetch jobs");
        } finally {
            setLoading(false);
        }
    };

    // Fetch when component mounts or when filters/query changes (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchJobs();
        }, 500); // wait 500ms after the last change before fetching

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, filters]);

    const openJob = (jobId) => {
        navigate(`/jobs/${jobId}`);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchJobs(newPage);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Numeric filters (salary / applicants): reject negatives so the range stays valid
    const handleNumericFilterChange = (key, value) => {
        if (value !== "" && (Number(value) < 0 || Number.isNaN(Number(value)))) return;
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Live range validation — max must not be smaller than min
    const salaryRangeInvalid =
        filters.salaryMin !== "" && filters.salaryMax !== "" &&
        Number(filters.salaryMax) < Number(filters.salaryMin);
    const applicantsRangeInvalid =
        filters.minApplicants !== "" && filters.maxApplicants !== "" &&
        Number(filters.maxApplicants) < Number(filters.minApplicants);

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

    // Small helper for the filter section headings
    const FilterHeading = ({ children }) => (
        <h3 className="mb-3 font-display text-sm font-semibold text-ink">{children}</h3>
    );

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero band ===== */}
            <section className="bg-ink py-14 text-center text-white">
                <h1 className="font-display text-4xl font-bold md:text-5xl">Jobs</h1>
                <p className="mx-auto mt-3 max-w-xl px-4 text-gray-300">
                    Find the role that fits your skills from our latest openings.
                </p>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
                {/* Recently viewed strip */}
                {recentlyViewed.length > 0 && (
                    <div className="mb-8">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-brand" />
                            <h2 className="font-display text-sm font-semibold text-ink">Recently viewed</h2>
                        </div>
                        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                            {recentlyViewed.map((job) => (
                                <button
                                    key={job._id}
                                    onClick={() => navigate(`/jobs/${job._id}`)}
                                    className="flex w-56 flex-shrink-0 items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-all hover:border-brand/30 hover:shadow-md"
                                >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 text-sm font-bold text-white">
                                        {job.company ? job.company.charAt(0).toUpperCase() : "C"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{job.title}</p>
                                        <p className="truncate text-xs text-gray-500">{job.company}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="mb-6 flex items-center justify-between gap-3">
                    {/* Mobile/tablet filter toggle — hidden on desktop where the sidebar is always visible */}
                    <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        aria-expanded={showFilters}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-gray-50 lg:hidden"
                    >
                        <SlidersHorizontal size={16} className="text-brand" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    <p className="text-base font-medium text-gray-700 md:text-lg">
                        Showing <span className="font-bold text-ink">{jobList.length}</span> of{" "}
                        <span className="font-bold text-ink">{pagination.totalJobs}</span> results
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* LEFT SIDEBAR - Filters (collapsible on mobile/tablet, always shown on desktop) */}
                    <div className="lg:col-span-1">
                        <div className={`${showFilters ? "block" : "hidden"} sticky top-4 rounded-2xl bg-brand-mint p-6 lg:block`}>
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="font-display text-lg font-bold text-ink">Filters</h2>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs font-medium text-red-500 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Search by Job Title */}
                            <div className="mb-6">
                                <FilterHeading>Search by Job Title</FilterHeading>
                                <SearchAutocomplete
                                    value={query}
                                    onChange={setQuery}
                                    placeholder="Job title or company"
                                />
                            </div>

                            {/* Location Filter */}
                            <div className="mb-6">
                                <FilterHeading>Location</FilterHeading>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange("location", e.target.value)}
                                        placeholder="Choose city"
                                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                                    />
                                </div>
                            </div>

                            {/* Job Type Filter */}
                            <div className="mb-6">
                                <FilterHeading>Job Type</FilterHeading>
                                <div className="space-y-2">
                                    {['on-site', 'hybrid', 'remote'].map((type) => (
                                        <label key={type} className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                name="jobType"
                                                checked={filters.type === type}
                                                onChange={() => handleFilterChange("type", filters.type === type ? "" : type)}
                                                className="h-4 w-4 accent-brand"
                                            />
                                            <span className="text-sm capitalize text-gray-700">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Job Time Filter */}
                            <div className="mb-6">
                                <FilterHeading>Job Time</FilterHeading>
                                <div className="space-y-2">
                                    {[
                                        { value: 'full-time', label: 'Full Time' },
                                        { value: 'part-time', label: 'Part Time' }
                                    ].map((time) => (
                                        <label key={time.value} className="flex cursor-pointer items-center gap-2">
                                            <input
                                                type="radio"
                                                name="jobTime"
                                                checked={filters.jobTime === time.value}
                                                onChange={() => handleFilterChange("jobTime", filters.jobTime === time.value ? "" : time.value)}
                                                className="h-4 w-4 accent-brand"
                                            />
                                            <span className="text-sm text-gray-700">{time.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Salary Range Filter */}
                            <div className="mb-6">
                                <FilterHeading>Salary Range</FilterHeading>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        min="0"
                                        value={filters.salaryMin}
                                        onChange={(e) => handleNumericFilterChange("salaryMin", e.target.value)}
                                        placeholder="Min (LPA)"
                                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 ${salaryRangeInvalid ? "border-red-400" : "border-gray-200 focus:border-brand"}`}
                                    />
                                    <input
                                        type="number"
                                        min={filters.salaryMin || "0"}
                                        value={filters.salaryMax}
                                        onChange={(e) => handleNumericFilterChange("salaryMax", e.target.value)}
                                        placeholder="Max (LPA)"
                                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 ${salaryRangeInvalid ? "border-red-400" : "border-gray-200 focus:border-brand"}`}
                                    />
                                    {salaryRangeInvalid && (
                                        <p className="text-xs font-medium text-red-500">Max salary can't be less than min.</p>
                                    )}
                                </div>
                            </div>

                            {/* Posted Date Filter */}
                            <div className="mb-6">
                                <FilterHeading>Date Posted</FilterHeading>
                                <select
                                    value={filters.postedDays}
                                    onChange={(e) => handleFilterChange("postedDays", e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
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
                                <FilterHeading>Company</FilterHeading>
                                <input
                                    type="text"
                                    value={filters.company}
                                    onChange={(e) => handleFilterChange("company", e.target.value)}
                                    placeholder="Company name"
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                                />
                            </div>

                            {/* Applicants Range Filter */}
                            <div className="mb-6">
                                <FilterHeading>Applicants</FilterHeading>
                                <div className="space-y-3">
                                    <input
                                        type="number"
                                        value={filters.minApplicants}
                                        onChange={(e) => handleNumericFilterChange("minApplicants", e.target.value)}
                                        placeholder="Min"
                                        min="0"
                                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 ${applicantsRangeInvalid ? "border-red-400" : "border-gray-200 focus:border-brand"}`}
                                    />
                                    <input
                                        type="number"
                                        value={filters.maxApplicants}
                                        onChange={(e) => handleNumericFilterChange("maxApplicants", e.target.value)}
                                        placeholder="Max"
                                        min={filters.minApplicants || "0"}
                                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand/30 ${applicantsRangeInvalid ? "border-red-400" : "border-gray-200 focus:border-brand"}`}
                                    />
                                    {applicantsRangeInvalid && (
                                        <p className="text-xs font-medium text-red-500">Max can't be less than min.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT - Job List */}
                    <div className="lg:col-span-3">
                        {loading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => <JobCardSkeleton key={i} />)}
                            </div>
                        ) : jobList.length === 0 ? (
                            <div className="rounded-2xl bg-brand-mint py-16 text-center text-gray-600">
                                <p className="mb-2 text-xl font-semibold text-ink">No jobs found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {jobList.map((job) => (
                                        <JobCard
                                            key={job._id}
                                            job={job}
                                            onOpen={openJob}
                                            isCandidate={isCandidate}
                                            isBookmarked={bookmarkedIds.has(String(job._id))}
                                            isApplied={Array.isArray(job.applicants) && user?._id ? job.applicants.map(String).includes(String(user._id)) : false}
                                            onToggleBookmark={handleToggleBookmark}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-5">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage <= 1}
                                            className="group inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-medium text-brand shadow-sm transition-all hover:border-brand hover:bg-brand/10 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:bg-brand/5"
                                        >
                                            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5 group-disabled:translate-x-0" />
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                            <span className="font-semibold text-gray-900">
                                                {(pagination.currentPage - 1) * 12 + 1}–{Math.min(pagination.currentPage * 12, pagination.totalJobs)}
                                            </span>
                                            <span>of</span>
                                            <span className="font-semibold text-gray-900">{pagination.totalJobs}</span>
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage >= pagination.totalPages}
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
                </div>
            </div>
        </div>
    );
};

export default Jobs;
