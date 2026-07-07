// src/Pages/RecruiterDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Edit, Trash2, Users, Briefcase, Award, MapPin, Clock, Wallet, Building2, LayoutDashboard, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jobAPI } from "../utils/api";
import ApplicantsModal from "../Components/jobs/ApplicantsModal";
import EditJobModal from "../Components/jobs/EditJobModal";
import ConfirmModal from "../Components/ui/ConfirmModal";
import { JobCardSkeleton } from "../Components/ui/Skeleton";

// Application status stages for the funnel bar
const FUNNEL_STAGES = [
    { key: "applied", label: "Applied", bar: "bg-gray-400" },
    { key: "shortlisted", label: "Shortlisted", bar: "bg-blue-500" },
    { key: "rejected", label: "Rejected", bar: "bg-red-500" },
    { key: "hired", label: "Hired", bar: "bg-green-500" },
];

const RecruiterDashboard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
    const [selectedJobForEdit, setSelectedJobForEdit] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null); // job pending delete confirmation
    const [deleting, setDeleting] = useState(false);
    const [analytics, setAnalytics] = useState(null); // { totalApplications, funnel }

    // 1) Fetch jobs posted by recruiter
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getAllJobs({ createdBy: user._id });
                if (mounted && response.success) {
                    setJobs(Array.isArray(response.data?.data) ? response.data.data : []);
                }
            } catch (error) {
                console.error("Error fetching recruiter jobs:", error);
                toast.error("Failed to load your jobs");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [user]);

    // 1b) Fetch analytics (application funnel)
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        jobAPI
            .getRecruiterAnalytics()
            .then((res) => {
                if (mounted && res.success) setAnalytics(res.data);
            })
            .catch(() => { });
        return () => { mounted = false; };
    }, [user]);

    // 2) Derived stats
    const stats = useMemo(() => {
        const totalJobs = jobs.length;
        let totalApplicants = 0;
        let mostAppliedJob = null;
        let maxApps = -1;

        jobs.forEach((job) => {
            const appsCount = job.applicants?.length || 0;
            totalApplicants += appsCount;

            if (appsCount > maxApps) {
                maxApps = appsCount;
                mostAppliedJob = { ...job, applicantsCount: appsCount };
            }
        });

        return { totalJobs, totalApplicants, mostAppliedJob };
    }, [jobs]);

    // 3) Handlers (Delete, Edit update, open applicants)
    const confirmDelete = async () => {
        if (!jobToDelete) return;
        setDeleting(true);
        try {
            const response = await jobAPI.deleteJob(jobToDelete._id);
            if (response.success) {
                setJobs((prev) => prev.filter((j) => j._id !== jobToDelete._id));
                toast.success("Job deleted successfully");
                setJobToDelete(null);
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            toast.error(error.message || "Failed to delete job");
        } finally {
            setDeleting(false);
        }
    };

    const handleOpenApplicants = (job) => {
        setSelectedJobForApplicants(job);
    };

    const handleEdit = (job) => {
        setSelectedJobForEdit(job);
    };

    const handleUpdateJobLocal = (updatedJob) => {
        setJobs((prev) => prev.map((j) => (j._id === updatedJob._id ? updatedJob : j)));
        setSelectedJobForEdit(null);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Please login as recruiter to view this page.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* ===== Hero band ===== */}
            <section className="bg-ink py-14 px-4 text-center text-white">
                <h1 className="font-display text-4xl font-bold md:text-5xl">Recruiter Dashboard</h1>
                <p className="mx-auto mt-3 max-w-xl text-gray-300">
                    Manage jobs you posted and review applicants.
                </p>
            </section>

            <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
                <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                            <Briefcase size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-ink">{stats.totalJobs}</div>
                            <div className="text-sm text-gray-500">Jobs Posted</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Users size={22} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-ink">{stats.totalApplicants}</div>
                            <div className="text-sm text-gray-500">Total Applicants</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                            <Award size={22} />
                        </div>
                        <div className="min-w-0">
                            {stats.mostAppliedJob ? (
                                <>
                                    <div className="truncate font-semibold text-ink">{stats.mostAppliedJob.title}</div>
                                    <div className="text-xs text-gray-500">
                                        Most applied · {stats.mostAppliedJob.applicantsCount} applicants
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="font-semibold text-ink">—</div>
                                    <div className="text-xs text-gray-500">No applications yet</div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ===== Applicant funnel (status breakdown) ===== */}
                {analytics && (
                    <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                            <BarChart3 size={18} className="text-brand" /> Applicant Funnel
                        </h2>
                        <p className="mb-5 mt-1 text-sm text-gray-500">
                            Current status of all {analytics.totalApplications} application{analytics.totalApplications === 1 ? "" : "s"} to your jobs.
                        </p>

                        {analytics.totalApplications === 0 ? (
                            <p className="py-4 text-center text-sm text-gray-400">No applications yet — share your jobs to start receiving candidates.</p>
                        ) : (
                            <div className="space-y-4">
                                {FUNNEL_STAGES.map((stage) => {
                                    const count = analytics.funnel[stage.key] || 0;
                                    const pct = analytics.totalApplications
                                        ? Math.round((count / analytics.totalApplications) * 100)
                                        : 0;
                                    return (
                                        <div key={stage.key}>
                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-700">{stage.label}</span>
                                                <span className="text-gray-500">{count} · {pct}%</span>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                                                <div className={`h-full rounded-full transition-all ${stage.bar}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
                            <LayoutDashboard size={20} className="text-brand" /> Your Jobs
                        </h2>
                    </div>

                    {loading ? (
                        <div className="grid gap-4">
                            {Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center py-24 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
                                <Briefcase size={30} />
                            </div>
                            <h3 className="mt-5 font-display text-xl font-semibold text-ink">No jobs posted yet</h3>
                            <p className="mt-1 text-sm text-gray-500">Jobs you post will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {jobs.map((job) => {
                                const applicantsCount = job.applicants?.length || 0;
                                return (
                                    <div key={job._id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 text-lg font-bold text-white">
                                                    {(job.company || "C").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-display text-lg font-bold text-ink truncate">{job.title}</h3>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1.5"><Building2 size={14} className="text-brand" /> {job.company}</span>
                                                        <span className="flex items-center gap-1.5 capitalize"><MapPin size={14} className="text-brand" /> {job.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-400">
                                                <Clock size={12} /> {moment(job.createdAt).fromNow()}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1.5 capitalize"><Clock size={16} className="text-brand" /> {job.type}</span>
                                            <span className="flex items-center gap-1.5"><Wallet size={16} className="text-brand" /> {job.salaryRange || "—"}</span>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                                            <button
                                                onClick={() => handleOpenApplicants(job)}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand-dark"
                                            >
                                                <Users size={16} /> View Applicants ({applicantsCount})
                                            </button>

                                            <button
                                                onClick={() => handleEdit(job)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:border-brand hover:text-brand"
                                            >
                                                <Edit size={16} /> Edit
                                            </button>

                                            <button
                                                onClick={() => setJobToDelete(job)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* Modals */}
            {selectedJobForApplicants && (
                <ApplicantsModal
                    job={selectedJobForApplicants}
                    onClose={() => setSelectedJobForApplicants(null)}
                />
            )}

            {selectedJobForEdit && (
                <EditJobModal
                    job={selectedJobForEdit}
                    onClose={() => setSelectedJobForEdit(null)}
                    onSave={handleUpdateJobLocal}
                />
            )}

            <ConfirmModal
                open={!!jobToDelete}
                onClose={() => !deleting && setJobToDelete(null)}
                onConfirm={confirmDelete}
                loading={deleting}
                icon={Trash2}
                title="Delete this job?"
                message={jobToDelete ? `"${jobToDelete.title}" and its applicant data will be permanently removed. This can't be undone.` : ""}
                confirmLabel="Delete"
            />
        </div>
    );
};

export default RecruiterDashboard;
