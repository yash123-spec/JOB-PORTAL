// src/components/About/TestimonialsSection.jsx
import React from "react";
import Reveal from "../ui/Reveal";

const TestimonialsSection = ({ items }) => (
    <section className="bg-brand-mint py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
            <Reveal className="text-center">
                <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">We're Only Working With The Best</h2>
                <p className="mx-auto mt-3 max-w-xl text-gray-500">Trusted by forward-thinking companies hiring on our platform.</p>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-3">
                {items.map((it, idx) => (
                    <Reveal key={idx} delay={idx * 80} className="card card-hover flex items-center justify-center p-8">
                        <img loading="lazy" src={it.logo} alt={it.name} className="max-h-12 object-contain grayscale transition-all duration-300 hover:grayscale-0" />
                    </Reveal>
                ))}
            </div>
        </div>
    </section>
);

export default TestimonialsSection;
