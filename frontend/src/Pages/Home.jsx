// src/Pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search, MapPin, Briefcase, Clock, Wallet, Bookmark, ArrowRight,
    Users, Building2, Flame,
} from "lucide-react";
import { jobAPI } from "../utils/api";
import moment from "moment";
import Reveal from "../Components/ui/Reveal";
import { JobCardSkeleton } from "../Components/ui/Skeleton";
import CountUp from "../Components/ui/CountUp";

const Home = () => {
    const navigate = useNavigate();
    const [trendingJobs, setTrendingJobs] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch trending jobs + platform stats on component mount
    useEffect(() => {
        fetchTrendingJobs();
        fetchStats();
    }, []);

    const fetchTrendingJobs = async () => {
        setLoading(true);
        try {
            const response = await jobAPI.getAllJobs({ limit: 6, sort: "trending" });
            if (response.success) {
                setTrendingJobs(response.data?.data || []);
            }
        } catch (error) {
            console.error("Error fetching trending jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await jobAPI.getPlatformStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (searchLocation) params.append("location", searchLocation);
        navigate(`/jobs?${params.toString()}`);
    };

    const getCompanyInitial = (company) => {
        return company ? company.charAt(0).toUpperCase() : 'C';
    };

    // Shared job card used by both the Recent and Trending sections
    const renderJobCard = (job, i) => (
        <div
            key={job._id}
            onClick={() => navigate(`/jobs/${job._id}`)}
            style={{ animation: `fade-up 0.5s var(--ease-out-quart) ${i * 70}ms both` }}
            className="card card-hover group cursor-pointer p-6"
        >
            <div className="flex items-start justify-between">
                <span className="badge badge-brand">
                    {moment(job.createdAt).fromNow()}
                </span>
                <Bookmark className="text-gray-300 transition-colors group-hover:text-brand" size={20} />
            </div>

            <div className="mt-4 flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 text-lg font-bold text-white transition-transform duration-300 group-hover:scale-105">
                    {getCompanyInitial(job.company)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold text-ink transition-colors group-hover:text-brand-dark">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.company}</p>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 capitalize">
                        <Clock size={16} className="text-brand" /> {job.jobTime || "Full time"}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Wallet size={16} className="text-brand" /> {job.salaryRange || "Not disclosed"}
                    </span>
                    <span className="flex items-center gap-1.5 capitalize">
                        <MapPin size={16} className="text-brand" /> {job.location}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job._id}`); }}
                    className="btn btn-primary shrink-0 px-6 py-2.5 text-sm"
                >
                    Job Details
                </button>
            </div>
        </div>
    );

    // Format helpers: full number (25,850) for hero, compact (12k+) for the stats band
    const fmt = (n) => (n ?? 0).toLocaleString();
    const fmtCompact = (n) => {
        n = n ?? 0;
        return n >= 1000 ? `${Math.floor(n / 1000)}k+` : `${n}`;
    };

    const heroStats = [
        { icon: Briefcase, value: stats?.totalJobs, label: "Jobs" },
        { icon: Users, value: stats?.totalCandidates, label: "Candidates" },
        { icon: Building2, value: stats?.totalCompanies, label: "Companies" },
    ];

    const companyStats = [
        { value: stats?.totalRecruiters, label: "Clients worldwide" },
        { value: stats?.totalCandidates, label: "Active resume" },
        { value: stats?.totalCompanies, label: "Companies" },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero ===== */}
            <section className="relative overflow-hidden bg-ink text-white">
                {/* Ambient brand glow */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black" />
                </div>

                <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 text-center md:px-8 md:pt-24">
                    <h1 className="animate-fade-up font-display text-4xl font-bold leading-[1.05] md:text-6xl">
                        Find Your Dream Job Today!
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-base text-gray-300 md:text-lg" style={{ animation: "fade-up 0.6s var(--ease-out-quart) 0.1s both" }}>
                        Connecting Talent with Opportunity: Your Gateway to Career Success
                    </p>

                    {/* Search pill */}
                    <form
                        onSubmit={handleSearch}
                        style={{ animation: "fade-up 0.6s var(--ease-out-quart) 0.2s both" }}
                        className="mx-auto mt-10 flex max-w-4xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl md:flex-row md:items-center md:rounded-full"
                    >
                        <div className="flex flex-1 items-center gap-3 px-4">
                            <Search className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Job Title or Company"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-3 text-gray-700 outline-none"
                            />
                        </div>
                        <div className="flex flex-1 items-center gap-3 px-4 md:border-l md:border-gray-200">
                            <MapPin className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Select Location"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                className="w-full py-3 text-gray-700 outline-none"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary md:rounded-full md:px-8 md:py-3.5">
                            <Search size={18} /> Search Job
                        </button>
                    </form>

                    {/* Stats */}
                    <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-12 gap-y-6" style={{ animation: "fade-up 0.6s var(--ease-out-quart) 0.3s both" }}>
                        {heroStats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex items-center gap-3">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_20px_-6px_rgba(48,150,137,0.6)]">
                                        <Icon size={24} />
                                    </span>
                                    <div className="text-left">
                                        <p className="font-display text-2xl font-bold">
                                            <CountUp value={stat.value} ready={!!stats} format={fmt} />
                                        </p>
                                        <p className="text-sm text-gray-300">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </section>

            {/* ===== Trending Jobs (most applied) ===== */}
            <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
                <Reveal className="flex items-end justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 font-display text-3xl font-bold text-ink md:text-4xl">
                            <Flame className="text-brand" size={30} /> Trending Jobs
                        </h2>
                        <p className="mt-2 text-gray-500">
                            The most sought-after roles candidates are applying to right now.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/jobs")}
                        className="hidden shrink-0 font-semibold text-brand underline-offset-4 hover:underline md:block"
                    >
                        View all
                    </button>
                </Reveal>

                {loading ? (
                    <div className="mt-8 space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
                    </div>
                ) : trendingJobs.length === 0 ? (
                    <div className="mt-8 rounded-2xl bg-brand-mint py-16 text-center">
                        <Briefcase className="mx-auto mb-3 text-brand/50" size={40} />
                        <p className="font-semibold text-ink">No jobs available right now</p>
                        <p className="mt-1 text-sm text-gray-500">Check back soon for fresh openings.</p>
                    </div>
                ) : (
                    <div className="mt-8 space-y-4">
                        {trendingJobs.map((job, i) => renderJobCard(job, i))}
                    </div>
                )}
            </section>

            {/* ===== Good Life Begins With A Good Company ===== */}
            <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
                <div className="grid items-center gap-10 md:grid-cols-2">
                    <Reveal className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand/20 via-gray-200 to-gray-300 shadow-card">
                        <div className="flex h-full w-full items-center justify-center">
                            <Building2 className="text-brand/40" size={96} strokeWidth={1} />
                        </div>
                    </Reveal>
                    <Reveal delay={120}>
                        <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">
                            Good Life Begins With<br />A Good Company
                        </h2>
                        <p className="mt-5 text-gray-500">
                            Join a platform trusted by thousands of professionals and leading employers.
                            Discover roles that match your ambitions and take the next step in your career
                            with confidence.
                        </p>
                        <div className="mt-8 flex items-center gap-4">
                            <button onClick={() => navigate("/jobs")} className="btn btn-primary">
                                Search Job
                            </button>
                            <button onClick={() => navigate("/about")} className="btn btn-ghost text-brand-dark">
                                Learn more <ArrowRight size={16} />
                            </button>
                        </div>
                    </Reveal>
                </div>

                <div className="mt-16 grid gap-10 sm:grid-cols-3">
                    {companyStats.map((s, i) => (
                        <Reveal key={s.label} delay={i * 100}>
                            <p className="font-display text-4xl font-bold text-brand">
                                <CountUp value={s.value} ready={!!stats} format={fmtCompact} />
                            </p>
                            <p className="mt-2 font-semibold text-ink">{s.label}</p>
                            <p className="mt-2 text-sm text-gray-500">
                                Trusted by a growing community of job seekers and companies worldwide.
                            </p>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ===== Create A Better Future CTA ===== */}
            <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
                <Reveal className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-white shadow-lift md:px-14">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/30 blur-[100px]" />
                    <div className="relative max-w-xl">
                        <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                            Create A Better<br />Future For Yourself
                        </h2>
                        <p className="mt-4 text-gray-300">
                            Build your profile, apply to top jobs, and connect directly with recruiters —
                            all in one place. Your next opportunity is a click away.
                        </p>
                        <button onClick={() => navigate("/jobs")} className="btn btn-primary mt-8">
                            Get Started <ArrowRight size={18} />
                        </button>
                    </div>
                </Reveal>
            </section>

            {/* ===== Footer ===== */}
            <footer className="bg-ink px-5 py-14 text-gray-300 md:px-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div>
                            <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-white">
                                <Briefcase className="text-brand" /> Job Portal
                            </h3>
                            <p className="text-sm text-gray-400">
                                Your trusted platform for finding the perfect job and advancing your career.
                            </p>
                        </div>
                        <div>
                            <h4 className="mb-4 font-semibold text-white">For Candidates</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="/jobs" className="transition-colors hover:text-brand">Browse Jobs</a></li>
                                <li><a href="/my-applications" className="transition-colors hover:text-brand">My Applications</a></li>
                                <li><a href="/bookmarked" className="transition-colors hover:text-brand">Saved Jobs</a></li>
                                <li><a href="/profile" className="transition-colors hover:text-brand">My Profile</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 font-semibold text-white">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="/about" className="transition-colors hover:text-brand">About Us</a></li>
                                <li><a href="/contact" className="transition-colors hover:text-brand">Contact Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 font-semibold text-white">Newsletter</h4>
                            <p className="mb-3 text-sm text-gray-400">Get the latest jobs in your inbox.</p>
                            <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
                                />
                                <button className="bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
                                    Go
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-gray-400 md:flex-row">
                        <p>&copy; 2025 Job Portal. All rights reserved.</p>
                        <p>Made with care for job seekers worldwide.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
