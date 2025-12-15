// src/utils/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true, // Important for cookies
});

// Request interceptor - DON'T set Content-Type, let browser handle it
api.interceptors.request.use(
    (config) => {
        // Let the browser set Content-Type automatically
        // It will use multipart/form-data with boundary for FormData
        // and application/json for regular objects
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip token refresh for login/register/auth endpoints
        const skipRefreshUrls = ['/user/login', '/user/register', '/auth/', '/user/refreshAccessToken'];
        const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest.url?.includes(url));

        // If 401 and not already retried and not a login/auth endpoint, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
            originalRequest._retry = true;

            try {
                await api.post('/user/refreshAccessToken');
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH APIs ====================

export const authAPI = {
    register: async (userData) => {
        try {
            const response = await api.post('/user/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Registration failed' };
        }
    },

    login: async (credentials) => {
        try {
            const response = await api.post('/user/login', credentials);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Login failed' };
        }
    },

    logout: async () => {
        try {
            const response = await api.post('/user/logout');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Logout failed' };
        }
    },

    getCurrentUser: async () => {
        try {
            const response = await api.get('/user/me');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch user' };
        }
    },

    refreshAccessToken: async () => {
        try {
            const response = await api.post('/user/refreshAccessToken');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Token refresh failed' };
        }
    },

    updateProfile: async (formData) => {
        try {
            const response = await api.put('/user/profile', formData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Profile update failed' };
        }
    },

    cleanupBookmarks: async () => {
        try {
            const response = await api.post('/user/cleanup-bookmarks');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Cleanup failed' };
        }
    },
};

// ==================== JOB APIs ====================

export const jobAPI = {
    // Get all jobs (with optional filters)
    getAllJobs: async (params = {}) => {
        try {
            const response = await api.get('/jobs', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch jobs' };
        }
    },

    // Get single job by ID
    getJobById: async (jobId) => {
        try {
            const response = await api.get(`/jobs/${jobId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch job details' };
        }
    },

    // Create job (recruiter only)
    createJob: async (jobData) => {
        try {
            const response = await api.post('/jobs', jobData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create job' };
        }
    },

    // Edit job (recruiter only)
    editJob: async (jobId, jobData) => {
        try {
            const response = await api.put(`/jobs/${jobId}`, jobData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update job' };
        }
    },

    // Delete job (recruiter only)
    deleteJob: async (jobId) => {
        try {
            const response = await api.delete(`/jobs/${jobId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete job' };
        }
    },

    // Apply for job (candidate only)
    applyForJob: async (jobId, formData) => {
        try {
            const response = await api.post(`/jobs/${jobId}/apply`, formData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to apply for job' };
        }
    },

    // Get applied jobs (candidate only)
    getAppliedJobs: async () => {
        try {
            const response = await api.get('/jobs/applied');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch applied jobs' };
        }
    },

    // Get job applicants (recruiter only)
    getJobApplicants: async (jobId) => {
        try {
            const response = await api.get(`/jobs/${jobId}/applicants`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch applicants' };
        }
    },

    // Bookmark job (candidate only)
    bookmarkJob: async (jobId) => {
        try {
            const response = await api.post(`/jobs/${jobId}/bookmark`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to bookmark job' };
        }
    },

    // Unbookmark job (candidate only)
    unbookmarkJob: async (jobId) => {
        try {
            const response = await api.delete(`/jobs/${jobId}/unbookmark`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to unbookmark job' };
        }
    },

    // Get bookmarked jobs (candidate only)
    getBookmarkedJobs: async () => {
        try {
            const response = await api.get('/jobs/bookmarked');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch bookmarked jobs' };
        }
    },

    // Withdraw job application (candidate only)
    withdrawApplication: async (jobId) => {
        try {
            const response = await api.delete(`/jobs/${jobId}/withdraw`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to withdraw application' };
        }
    },

    // Get candidate stats
    getCandidateStats: async () => {
        try {
            const response = await api.get('/jobs/candidate/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch candidate stats' };
        }
    },

    // Get recruiter stats
    getRecruiterStats: async () => {
        try {
            const response = await api.get('/jobs/recruiter/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch recruiter stats' };
        }
    },

    // Update application status (recruiter only)
    updateApplicationStatus: async (applicationId, status) => {
        try {
            const response = await api.put(`/applications/${applicationId}/status`, { status });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update application status' };
        }
    }
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
    // Add admin-specific endpoints here if needed
};

// ==================== NOTIFICATION APIs ====================

export const notificationAPI = {
    // Get all notifications
    getNotifications: async (params = {}) => {
        try {
            const response = await api.get('/notifications', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch notifications' };
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to mark notification as read' };
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to mark all as read' };
        }
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete notification' };
        }
    },
};

// ==================== MESSAGE APIs ====================

export const messageAPI = {
    // Get all conversations
    getConversations: async () => {
        try {
            const response = await api.get('/conversations');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch conversations' };
        }
    },

    // Get or create conversation
    getOrCreateConversation: async (data) => {
        try {
            const response = await api.post('/conversations', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create conversation' };
        }
    },

    // Get messages for conversation
    getMessages: async (conversationId, params = {}) => {
        try {
            const response = await api.get(`/conversations/${conversationId}/messages`, { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch messages' };
        }
    },

    // Send message
    sendMessage: async (conversationId, content) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/messages`, { content });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to send message' };
        }
    },

    // Delete conversation
    deleteConversation: async (conversationId) => {
        try {
            const response = await api.delete(`/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete conversation' };
        }
    },

    // Get unread count
    getUnreadCount: async () => {
        try {
            const response = await api.get('/messages/unread-count');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch unread count' };
        }
    },
};

// Export axios instance for custom requests
export default api;
