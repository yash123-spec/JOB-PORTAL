// src/components/About/HeroSection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = ({ data }) => {
    const navigate = useNavigate();
    const { title, subtitle, ctaText, ctaLink } = data;
    return (
        <section className="py-20 px-6 md:px-12 bg-linear-to-b from-[#071025] via-[#071b2b] to-[#05141b]">
            <div className="max-w-5xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">{title}</h1>
                <p className="mt-4 text-gray-300 max-w-2xl mx-auto">{subtitle}</p>
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(ctaLink)}
                        className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition"
                    >
                        {ctaText}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
