// src/Pages/AboutUs.jsx
import React, { useEffect, useState } from "react";
import aboutData from "../data/aboutData";
import { jobAPI } from "../utils/api";
import HeroSection from "../Components/About/HeroSection.jsx";
import MissionSection from "../Components/About/MissionSection";
import StatsSection from "../Components/About/StatsSection";
import HowItWorks from "../Components/About/HowItWorks";
import TeamSection from "../Components/About/TeamSection";
import TimelineSection from "../Components/About/TimelineSection";
import TestimonialsSection from "../Components/About/TestimonialsSection";
import FAQSection from "../Components/About/FAQSection";
import CTASection from "../Components/About/CTASection";

const AboutUs = () => {
    const d = aboutData;
    // Start from static aboutData, then replace with real platform counts when they load
    const [stats, setStats] = useState(d.stats);

    useEffect(() => {
        (async () => {
            try {
                const res = await jobAPI.getPlatformStats();
                if (res.success) {
                    setStats({
                        jobsPosted: res.data.totalJobs,
                        candidates: res.data.totalCandidates,
                        recruiters: res.data.totalRecruiters,
                        placements: res.data.totalHired,
                    });
                }
            } catch (error) {
                console.error("Error fetching platform stats:", error);
            }
        })();
    }, []);

    return (
        <div className="min-h-screen bg-white text-ink">
            <HeroSection data={d.hero} />
            <MissionSection items={d.mission} />
            <StatsSection stats={stats} />
            <HowItWorks steps={d.howItWorks} />
            <TeamSection members={d.team} />
            <TimelineSection items={d.timeline} />
            <TestimonialsSection items={d.testimonials} />
            <FAQSection items={d.faqs} />
            <CTASection data={d.cta} />
            <div className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
                © {new Date().getFullYear()} Job Portal
            </div>
        </div>
    );
};

export default AboutUs;
