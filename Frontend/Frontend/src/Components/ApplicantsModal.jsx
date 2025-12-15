// src/Components/ApplicantsModal.jsx
import React, { useEffect, useState } from "react";
import { X, FileText, Download, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jobAPI, messageAPI } from "../utils/api";
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
                    setApplicants(response.data || []);
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
            <div className="w-full max-w-2xl bg-white rounded-lg shadow p-4 relative max-h-[80vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-800">
                    <X />
                </button>

                <h3 className="text-lg font-semibold mb-2">Applicants — {job.title}</h3>
                <p className="text-sm text-gray-500 mb-4">Total: {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</p>

                {loading ? (
                    <div className="text-center py-8">Loading applicants...</div>
                ) : applicants.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">No applicants yet.</div>
                ) : (
                    <div className="space-y-3">
                        {applicants.map((applicant) => (
                            <div key={applicant.applicationId} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {applicant.profilePic ? (
                                            <img
                                                src={applicant.profilePic}
                                                alt={applicant.fullname}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleMessage(applicant)}
                                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                                        title="Send message"
                                    >
                                        <MessageCircle size={16} />
                                        Message
                                    </button>
                                    <button
                                        onClick={() => handleDownloadResume(applicant.resumeUrl, applicant.fullname)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
