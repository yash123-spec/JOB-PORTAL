// src/data/aboutData.js
export const aboutData = {
    hero: {
        title: "We connect talent with opportunity.",
        subtitle: "A simple, human-first job platform for candidates and recruiters.",
        ctaText: "Browse Jobs",
        ctaLink: "/jobs",
    },
    mission: [
        {
            title: "Our Mission",
            text: "Make hiring fair, transparent, and fast by connecting talent directly with opportunity."
        },
        {
            title: "Our Vision",
            text: "Empower candidates and recruiters with smart tools and honest processes to make better hires."
        },
        {
            title: "Our Values",
            text: "Integrity, Transparency, Innovation, and Empathy — we build for people first."
        }
    ],
    stats: {
        jobsPosted: 1200,
        candidates: 5400,
        recruiters: 300,
        placements: 980
    },
    howItWorks: [
        { key: "discover", title: "Discover Jobs", icon: "Search", text: "Find openings that match your skills and interests." },
        { key: "apply", title: "Apply Quickly", icon: "Send", text: "Submit applications easily with a few clicks." },
        { key: "hire", title: "Get Hired", icon: "Briefcase", text: "Connect directly with recruiters and land your next role." }
    ],
    team: [
        {
            id: "t1",
            name: "Yash Thakkar",
            role: "Founder & Full Stack Developer",
            img: "https://randomuser.me/api/portraits/men/32.jpg",
            bio: "Building simple, scalable hiring solutions focused on UX.",
            socials: { github: "#", linkedin: "#", twitter: "#" }
        },
        {
            id: "t2",
            name: "Aarav Mehta",
            role: "Head of Partnerships",
            img: "https://randomuser.me/api/portraits/men/55.jpg",
            bio: "Connecting companies with top talent.",
            socials: { linkedin: "#", twitter: "#" }
        },
        {
            id: "t3",
            name: "Priya Shah",
            role: "Product Designer",
            img: "https://randomuser.me/api/portraits/women/68.jpg",
            bio: "Designing humane product experiences for candidates.",
            socials: { linkedin: "#", dribbble: "#" }
        }
    ],
    timeline: [
        { year: "2023", text: "Idea conceived and prototype launched." },
        { year: "2024", text: "Reached 1,000+ active users and first paying recruiters." },
        { year: "2025", text: "Expanded features and improved candidate experience." }
    ],
    testimonials: [
        { name: "TechCorp", logo: "https://cdn-icons-png.flaticon.com/512/5968/5968897.png" },
        { name: "DataMinds", logo: "https://cdn-icons-png.flaticon.com/512/5968/5968672.png" },
        { name: "PixelWorks", logo: "https://cdn-icons-png.flaticon.com/512/5968/5968702.png" }
    ],
    faqs: [
        { q: "Is this platform free for candidates?", a: "Yes — candidates can browse and apply for jobs at no cost." },
        { q: "Can recruiters post unlimited jobs?", a: "Recruiters can post multiple jobs depending on their account or plan." },
        { q: "How do I change my profile?", a: "Go to your profile page to edit details and upload a resume." },
        { q: "How do I contact support?", a: "Use Contact Us page — we typically respond within 24 hours." }
    ],
    cta: {
        title: "Ready to take the next step?",
        buttons: [
            { text: "Browse Jobs", link: "/jobs", style: "primary" },
            { text: "Join as Recruiter", link: "/register", style: "secondary" }
        ]
    }
};
export default aboutData;
