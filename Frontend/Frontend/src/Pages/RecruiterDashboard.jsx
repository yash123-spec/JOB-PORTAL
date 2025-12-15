// src/Pages/RecruiterDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { Edit, Trash2, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jobAPI } from "../utils/api";
import ApplicantsModal from "../Components/ApplicantsModal";
import EditJobModal from "../Components/EditJobModal";

const RecruiterDashboard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
    const [selectedJobForEdit, setSelectedJobForEdit] = useState(null);

    // 1) Fetch jobs posted by recruiter
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getAllJobs({ createdBy: user._id });
                if (mounted && response.success) {
                    setJobs(response.data || []);
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
    const handleDelete = async (jobId) => {
        const confirm = window.confirm("Delete this job permanently?");
        if (!confirm) return;

        try {
            const response = await jobAPI.deleteJob(jobId);
            if (response.success) {
                setJobs((prev) => prev.filter((j) => j._id !== jobId));
                toast.success("Job deleted successfully");
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            toast.error(error.message || "Failed to delete job");
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
        <div className="min-h-screen py-12 px-4 bg-linear-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage jobs you posted and review applicants.
                    </p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-500">Jobs Posted</div>
                        <div className="text-2xl font-bold">{stats.totalJobs}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-500">Total Applicants</div>
                        <div className="text-2xl font-bold">{stats.totalApplicants}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-sm text-gray-500">Most Applied Job</div>
                        <div className="text-sm mt-2">
                            {stats.mostAppliedJob ? (
                                <>
                                    <div className="font-semibold">{stats.mostAppliedJob.title}</div>
                                    <div className="text-xs text-gray-500">
                                        {stats.mostAppliedJob.applicantsCount} applicants
                                    </div>
                                </>
                            ) : (
                                <div className="text-xs text-gray-500">No applications yet</div>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Your Jobs</h2>
                        {/* Optionally add "Create Job" link/button that opens job creation flow */}
                        {/* For now you can reuse your AddJobButton if you have it */}
                    </div>

                    {loading ? (
                        <div className="text-gray-500">Loading jobs...</div>
                    ) : jobs.length === 0 ? (
                        <div className="text-gray-500">You have not posted any jobs yet.</div>
                    ) : (
                        <div className="grid gap-4">
                            {jobs.map((job) => {
                                const applicantsCount = job.applicants?.length || 0;
                                return (
                                    <div key={job._id} className="bg-white rounded-lg p-4 shadow flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{job.title}</h3>
                                                    <div className="text-sm text-gray-500">{job.company} · {job.location}</div>
                                                </div>
                                                <div className="text-sm text-gray-400">{moment(job.createdAt).fromNow()}</div>
                                            </div>

                                            <div className="mt-3 text-sm text-gray-600">
                                                <div>Type: {job.type}</div>
                                                <div>Salary: {job.salaryRange || "—"}</div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2 text-sm">
                                                <button
                                                    onClick={() => handleOpenApplicants(job)}
                                                    className="flex items-center gap-2 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                                >
                                                    <Users size={14} /> View Applicants ({applicantsCount})
                                                </button>

                                                <button
                                                    onClick={() => handleEdit(job)}
                                                    className="flex items-center gap-2 px-3 py-1 rounded bg-indigo-50 hover:bg-indigo-100"
                                                >
                                                    <Edit size={14} /> Edit
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(job._id)}
                                                    className="flex items-center gap-2 px-3 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
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
        </div>
    );
};

export default RecruiterDashboard;
