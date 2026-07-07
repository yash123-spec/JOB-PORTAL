// src/Components/ApplicantsModal.jsx
import React, { useEffect, useState } from "react";
import { X, Users, Download, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jobAPI, messageAPI } from "../../utils/api";
import { optimizedImage } from "../../utils/img";
import moment from "moment";

const ApplicantsModal = ({ job, onClose }) => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!job) return;
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const response = await jobAPI.getJobApplicants(job._id);
                if (mounted && response.success) {
                    setApplicants(Array.isArray(response.data?.data) ? response.data.data : []);
                }
            } catch (error) {
                console.error("Error fetching applicants:", error);
                toast.error("Failed to load applicants");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => (mounted = false);
    }, [job]);

    const handleDownloadResume = (resumeUrl, fullname) => {
        if (!resumeUrl) {
            toast.error("Resume not available");
            return;
        }
        // Open resume in new tab
        window.open(resumeUrl, '_blank');
        toast.success(`Opening resume for ${fullname}`);
    };

    const handleStatusChange = async (applicationId, newStatus, fullname) => {
        try {
            const response = await jobAPI.updateApplicationStatus(applicationId, newStatus);
            if (response.success) {
                // Update local state
                setApplicants(prev => prev.map(app =>
                    app.applicationId === applicationId
                        ? { ...app, status: newStatus }
                        : app
                ));
                toast.success(`${fullname}'s status updated to ${newStatus}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleMessage = async (applicant) => {
        try {
            const response = await messageAPI.getOrCreateConversation({
                participantId: applicant.userId,
                jobId: job._id,
                applicationId: applicant.applicationId,
            });
            if (response.success) {
                navigate(`/messages/${response.data._id}`);
                onClose();
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                    <X size={22} />
                </button>

                <h3 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand">
                        <Users size={18} />
                    </span>
                    Applicants — {job.title}
                </h3>
                <p className="mb-5 mt-1 pl-11 text-sm text-gray-500">Total: {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
                        <p className="mt-3 text-sm">Loading applicants...</p>
                    </div>
                ) : applicants.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center text-gray-500">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
                            <Users size={26} />
                        </div>
                        <p className="mt-3 text-sm">No applicants yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {applicants.map((applicant) => (
                            <div key={applicant.applicationId} className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {applicant.profilePic ? (
                                            <img
                                                src={optimizedImage(applicant.profilePic, { width: 80 })}
                                                alt={applicant.fullname}
                                                loading="lazy"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal-500 font-semibold text-white">
                                                {applicant.fullname?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium">{applicant.fullname}</div>
                                            <div className="text-sm text-gray-500">{applicant.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-600 ml-13">
                                        <span className="flex items-center gap-1">
                                            <span className="font-medium">Applied:</span>
                                            {moment(applicant.appliedAt).format('MMM DD, YYYY')}
                                        </span>
                                    </div>
                                    <div className="mt-3 ml-13">
                                        <select
                                            value={applicant.status}
                                            onChange={(e) => handleStatusChange(applicant.applicationId, e.target.value, applicant.fullname)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 outline-none cursor-pointer transition-colors ${applicant.status === 'hired' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                                                applicant.status === 'shortlisted' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                    applicant.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <option value="applied">Applied</option>
                                            <option value="shortlisted">Shortlisted</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="hired">Hired</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                                    <button
                                        onClick={() => handleMessage(applicant)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                                        title="Send message"
                                    >
                                        <MessageCircle size={16} />
                                        Message
                                    </button>
                                    <button
                                        onClick={() => handleDownloadResume(applicant.resumeUrl, applicant.fullname)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand hover:text-brand"
                                    >
                                        <Download size={16} />
                                        Resume
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicantsModal;
