// src/assets/FeedDummy.js
export const posts = [
    {
        _id: "p1",
        title: "How I built a job-board in 2 weeks",
        excerpt:
            "Short breakdown of stack choices, deployment steps and lessons learned while building a small job portal.",
        content:
            "Full story: I started with a small UI using React + Tailwind, then added backend endpoints in Express. I prioritized API-first design and made the UI switch seamlessly from dummy to API-driven data. (This is dummy content for now.)",
        authorId: "u1",
        cover:
            "https://images.unsplash.com/photo-1532619675605-87f1d3b9d1ab?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=6c5d2b8f4466845b15b36a29b2f7d233",
        createdAt: "2025-10-18T10:00:00Z",
        likes: 12,
        commentsCount: 3,
        tags: ["React", "Frontend", "MERN"],
    },
    {
        _id: "p2",
        title: "Tips to write strong job descriptions",
        excerpt:
            "A few practical tips (bullet points) that recruiters can use to attract better applicants.",
        content:
            "Start with a clear one-line summary, list requirements as 'must' vs 'nice to have', mention seniority and salary band early. Etc. This is dummy content.",
        authorId: "u2",
        cover:
            "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=2f8a2e3be7f7a1b1d0c8e6a7743f5a11",
        createdAt: "2025-10-21T08:30:00Z",
        likes: 24,
        commentsCount: 6,
        tags: ["Hiring", "Recruiting"],
    },
    {
        _id: "p3",
        title: "Designing better candidate experiences",
        excerpt:
            "Simple micro-improvements to make the hiring experience less painful for candidates.",
        content:
            "Always give timely updates, create clear expectations for interviews and make application forms short. This is dummy content.",
        authorId: "u3",
        cover:
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=b9db5c2c4073d4d765b2cc4b2a9b9a2c",
        createdAt: "2025-10-22T12:15:00Z",
        likes: 8,
        commentsCount: 1,
        tags: ["UX", "Hiring"],
    },
];
