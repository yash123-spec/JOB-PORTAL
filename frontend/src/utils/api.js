// src/utils/api.js
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
    baseURL: `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/api/v1`,
});

// Request interceptor - DON'T set Content-Type, let browser handle it
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
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
        const skipRefreshUrls = ['/user/login', '/user/register', '/user/refreshAccessToken'];
        const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest.url?.includes(url));

        // If 401 and not already retried and not a login/auth endpoint, try to refresh token

        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');

            // No refresh token = user is logged out, bail silently — never hard-redirect
            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {
                const { data } = await api.post('/user/refreshAccessToken', { refreshToken });
                const newToken = data?.data?.accessToken;
                if (newToken) {
                    localStorage.setItem('accessToken', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH APIs ====================

export const authAPI = {
    recruiterRegister: async (userData) => {
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

// In-memory cache for platform stats (shared across Home/About/Jobs mounts)
const PLATFORM_STATS_TTL = 5 * 60 * 1000; // 5 minutes
const platformStatsCache = { data: null, time: 0, promise: null };

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

    // Get public platform-wide stats (homepage / about counters)
    getPlatformStats: async () => {
        // Public, read-only data that changes slowly — cache across pages (Home/About/Jobs)
        // for a short TTL so navigation doesn't re-hit the network on every mount.
        const now = Date.now();
        if (platformStatsCache.data && now - platformStatsCache.time < PLATFORM_STATS_TTL) {
            return platformStatsCache.data;
        }
        // De-dupe concurrent callers (e.g. two pages mounting together) into one request
        if (platformStatsCache.promise) {
            return platformStatsCache.promise;
        }
        platformStatsCache.promise = (async () => {
            try {
                const response = await api.get('/jobs/stats');
                platformStatsCache.data = response.data;
                platformStatsCache.time = Date.now();
                return response.data;
            } catch (error) {
                throw error.response?.data || { message: 'Failed to fetch platform stats' };
            } finally {
                platformStatsCache.promise = null;
            }
        })();
        return platformStatsCache.promise;
    },

    // Search autocomplete suggestions (job titles + company names)
    getSuggestions: async (q) => {
        try {
            const response = await api.get('/jobs/suggestions', { params: { q } });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch suggestions' };
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

    // Recruiter analytics: application status funnel
    getRecruiterAnalytics: async () => {
        try {
            const response = await api.get('/jobs/recruiter/analytics');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch recruiter analytics' };
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

// ✅ AFTER

// NOTE: Admin-only APIs (recruiter approval, user/job management) live in the
// separate Admin Panel app, so they were removed from this main app.

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
