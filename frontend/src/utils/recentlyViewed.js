// src/utils/recentlyViewed.js
// Tracks the jobs a user has recently opened, in localStorage (no backend).
// Stores a slim snapshot so a "Recently viewed" strip can render instantly.

const KEY = "recentlyViewedJobs";
const MAX = 3;

export const getRecentlyViewed = () => {
    try {
        const raw = localStorage.getItem(KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
};

export const addRecentlyViewed = (job) => {
    if (!job?._id) return;
    try {
        const slim = {
            _id: job._id,
            title: job.title,
            company: job.company,
            location: job.location,
            salaryRange: job.salaryRange || job.salary || null,
            jobTime: job.jobTime || null,
        };
        // Newest first, de-duplicated, capped at MAX
        const rest = getRecentlyViewed().filter((j) => j._id !== slim._id);
        localStorage.setItem(KEY, JSON.stringify([slim, ...rest].slice(0, MAX)));
    } catch {
        // ignore quota / serialization errors — this is a nice-to-have
    }
};
