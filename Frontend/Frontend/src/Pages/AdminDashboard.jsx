import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';
import { CheckCircle, XCircle, Clock, User, Mail, Building, Globe, Calendar, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [recruiters, setRecruiters] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedRecruiter, setSelectedRecruiter] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [blockDuration, setBlockDuration] = useState('none');
    const [adminNotes, setAdminNotes] = useState('');

    const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || 'http://localhost:8000';

    useEffect(() => {
        fetchStats();
        fetchRecruiters(activeTab);
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/admin/recruiters/stats`, {
                withCredentials: true
            });
            if (response.data.success) {
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRecruiters = async (status) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/api/admin/recruiters`, {
                params: { status },
                withCredentials: true
            });
            if (response.data.success) {
                setRecruiters(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching recruiters:', error);
            toast.error('Failed to load recruiters');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (recruiterId) => {
        try {
            const response = await axios.put(
                `${API_BASE}/api/admin/recruiters/${recruiterId}/approve`,
                { adminNotes },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Recruiter approved successfully!');
                fetchStats();
                fetchRecruiters(activeTab);
                setShowModal(false);
                setAdminNotes('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve recruiter');
        }
    };

    const handleReject = async (recruiterId) => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            const response = await axios.put(
                `${API_BASE}/api/admin/recruiters/${recruiterId}/reject`,
                { rejectionReason, blockDuration, adminNotes },
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Recruiter rejected');
                fetchStats();
                fetchRecruiters(activeTab);
                setShowModal(false);
                setRejectionReason('');
                setBlockDuration('none');
                setAdminNotes('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject recruiter');
        }
    };

    const openModal = (recruiter, action) => {
        setSelectedRecruiter(recruiter);
        setModalAction(action);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRecruiter(null);
        setModalAction('');
        setRejectionReason('');
        setBlockDuration('none');
        setAdminNotes('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Management</h1>
                    <p className="text-gray-600">Review and manage recruiter applications</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatsCard icon={<Clock />} title="Pending" value={stats.pending} color="bg-yellow-500" />
                    <StatsCard icon={<CheckCircle />} title="Approved" value={stats.approved} color="bg-green-500" />
                    <StatsCard icon={<XCircle />} title="Rejected" value={stats.rejected} color="bg-red-500" />
                    <StatsCard icon={<User />} title="Total" value={stats.total} color="bg-blue-500" />
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Recruiters List */}
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : recruiters.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No {activeTab} recruiters found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recruiters.map((recruiter) => (
                                    <RecruiterCard
                                        key={recruiter._id}
                                        recruiter={recruiter}
                                        onApprove={() => openModal(recruiter, 'approve')}
                                        onReject={() => openModal(recruiter, 'reject')}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedRecruiter && (
                <Modal
                    recruiter={selectedRecruiter}
                    action={modalAction}
                    onClose={closeModal}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    blockDuration={blockDuration}
                    setBlockDuration={setBlockDuration}
                    adminNotes={adminNotes}
                    setAdminNotes={setAdminNotes}
                />
            )}
        </div>
    );
};

const StatsCard = ({ icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
        </div>
    </div>
);

const RecruiterCard = ({ recruiter, onApprove, onReject }) => {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };

    return (
        <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{recruiter.user?.fullname}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[recruiter.status]}`}>
                            {recruiter.status}
                        </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Mail size={16} />
                            <span>{recruiter.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Building size={16} />
                            <span>{recruiter.companyName}</span>
                        </div>
                        {recruiter.companyWebsite && (
                            <div className="flex items-center gap-2">
                                <Globe size={16} />
                                <a href={recruiter.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {recruiter.companyWebsite}
                                </a>
                            </div>
                        )}
                        {recruiter.designation && (
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>{recruiter.designation}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Applied: {moment(recruiter.createdAt).format('MMM DD, YYYY')}</span>
                        </div>
                    </div>
                </div>

                {recruiter.status === 'pending' && (
                    <div className="flex gap-2">
                        <button
                            onClick={onApprove}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Approve
                        </button>
                        <button
                            onClick={onReject}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <XCircle size={18} />
                            Reject
                        </button>
                    </div>
                )}
            </div>

            {recruiter.adminNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2 text-sm">
                        <MessageSquare size={16} className="text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900 mb-1">Admin Notes:</p>
                            <p className="text-blue-800">{recruiter.adminNotes}</p>
                        </div>
                    </div>
                </div>
            )}

            {recruiter.status === 'rejected' && recruiter.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="font-medium text-red-900 mb-1 text-sm">Rejection Reason:</p>
                    <p className="text-red-800 text-sm">{recruiter.rejectionReason}</p>
                    {recruiter.blockedUntil && (
                        <p className="text-red-700 text-xs mt-2">Blocked until: {moment(recruiter.blockedUntil).format('MMM DD, YYYY')}</p>
                    )}
                </div>
            )}
        </div>
    );
};

const Modal = ({
    recruiter,
    action,
    onClose,
    onApprove,
    onReject,
    rejectionReason,
    setRejectionReason,
    blockDuration,
    setBlockDuration,
    adminNotes,
    setAdminNotes
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {action === 'approve' ? 'Approve' : 'Reject'} Recruiter
                </h2>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{recruiter.user?.fullname}</p>
                    <p className="text-sm text-gray-600">{recruiter.user?.email}</p>
                    <p className="text-sm text-gray-600">{recruiter.companyName}</p>
                </div>

                {action === 'reject' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows="3"
                                placeholder="Provide a reason for rejection..."
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Block Duration
                            </label>
                            <select
                                value={blockDuration}
                                onChange={(e) => setBlockDuration(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="none">No Block (Can reapply immediately)</option>
                                <option value="1week">1 Week</option>
                                <option value="2weeks">2 Weeks</option>
                                <option value="1month">1 Month</option>
                                <option value="2months">2 Months</option>
                                <option value="permanent">Permanent Block</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes (Optional)
                    </label>
                    <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                        placeholder="Internal notes..."
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => action === 'approve' ? onApprove(recruiter._id) : onReject(recruiter._id)}
                        className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {action === 'approve' ? 'Approve' : 'Reject'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
