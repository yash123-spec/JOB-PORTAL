// src/assets/Dummy.js

// ===================== USERS =====================
export const users = [
    {
        _id: "u1",
        name: "Yash Thakkar",
        username: "yash_thakkar",
        email: "yash@example.com",
        role: "candidate",
        profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
        bio: "Frontend developer passionate about React and UI design.",
        skills: ["React", "JavaScript", "Tailwind", "Node.js"],
        bookmarks: ["j2"], // bookmarked job ids (example)
    },
    {
        _id: "u2",
        name: "Aarav Mehta",
        username: "aarav_recruit",
        email: "aarav@recruitco.com",
        role: "recruiter",
        company: "RecruitCo Pvt Ltd",
        profilePic: "https://randomuser.me/api/portraits/men/55.jpg",
        bio: "Hiring top talent for fast-growing startups.",
        bookmarks: [], // recruiters usually won't bookmark, but keep field
    },
    {
        _id: "u3",
        name: "Priya Shah",
        username: "priya_shah",
        email: "priya@example.com",
        role: "candidate",
        profilePic: "https://randomuser.me/api/portraits/women/68.jpg",
        bio: "Full Stack Developer with 2 years experience in MERN stack.",
        skills: ["MongoDB", "Express", "React", "Node.js"],
        bookmarks: ["j1", "j3"],
    },
];

// ===================== JOBS =====================
export const jobs = [
    {
        _id: "j1",
        title: "Frontend Developer",
        company: "TechNova Solutions",
        location: "Bangalore, India",
        type: "Full-time",
        experienceLevel: "Junior",
        salary: "₹6 - ₹10 LPA",
        description:
            "We are looking for a Frontend Developer with React experience to join our growing team.",
        postedBy: "u2", // recruiter id
        createdAt: "2025-10-10T12:00:00Z",
    },
    {
        _id: "j2",
        title: "Backend Developer",
        company: "DataMinds Inc.",
        location: "Remote",
        type: "Full-time",
        experienceLevel: "Mid",
        salary: "₹10 - ₹15 LPA",
        description:
            "Looking for a skilled Node.js developer to build scalable APIs and handle database operations.",
        postedBy: "u2",
        createdAt: "2025-10-15T10:00:00Z",
    },
    {
        _id: "j3",
        title: "UI/UX Designer",
        company: "PixelWorks Studio",
        location: "Pune, India",
        type: "Internship",
        experienceLevel: "Intern",
        salary: "₹15K/month",
        description:
            "Join our design team to create beautiful and user-friendly interfaces for web applications.",
        postedBy: "u2",
        createdAt: "2025-10-20T09:30:00Z",
    },
];

// ===================== APPLICATIONS =====================
export const applications = [
    {
        _id: "a1",
        userId: "u1", // candidate
        jobId: "j1",
        status: "applied",
        appliedAt: "2025-10-12T14:20:00Z",
    },
    {
        _id: "a2",
        userId: "u3",
        jobId: "j2",
        status: "under review",
        appliedAt: "2025-10-17T11:00:00Z",
    },
    {
        _id: "a3",
        userId: "u1",
        jobId: "j3",
        status: "shortlisted",
        appliedAt: "2025-10-22T08:45:00Z",
    },
];
