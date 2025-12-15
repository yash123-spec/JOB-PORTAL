// src/Pages/AboutUs.jsx
import React from "react";
import aboutData from "../data/aboutData";
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
    return (
        <div className="bg-[#06141b] text-white min-h-screen">
            <HeroSection data={d.hero} />
            <MissionSection items={d.mission} />
            <StatsSection stats={d.stats} />
            <HowItWorks steps={d.howItWorks} />
            <TeamSection members={d.team} />
            <TimelineSection items={d.timeline} />
            <TestimonialsSection items={d.testimonials} />
            <FAQSection items={d.faqs} />
            <CTASection data={d.cta} />
            <div className="py-8 text-center text-gray-400 text-sm">© {new Date().getFullYear()} Job Portal</div>
        </div>
    );
};

export default AboutUs;
