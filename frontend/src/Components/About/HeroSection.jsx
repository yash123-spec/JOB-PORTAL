// src/components/About/HeroSection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HeroSection = ({ data }) => {
    const navigate = useNavigate();
    const { title, subtitle, ctaText, ctaLink } = data;
    return (
        <section className="relative overflow-hidden bg-ink text-white">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/2 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />
            </div>
            <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
                <span className="animate-fade-in text-sm font-semibold uppercase tracking-[0.2em] text-brand-300">About Us</span>
                <h1 className="mt-4 animate-fade-up font-display text-4xl font-bold leading-[1.1] md:text-5xl">{title}</h1>
                <p className="mx-auto mt-5 max-w-2xl text-gray-300 md:text-lg" style={{ animation: "fade-up .6s var(--ease-out-quart) .1s both" }}>{subtitle}</p>
                <div className="mt-8 flex items-center justify-center" style={{ animation: "fade-up .6s var(--ease-out-quart) .2s both" }}>
                    <button onClick={() => navigate(ctaLink)} className="btn btn-primary">
                        {ctaText} <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
