// src/components/About/TimelineSection.jsx
import React from "react";
import Reveal from "../ui/Reveal";

const TimelineSection = ({ items }) => (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
        <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">Our Story</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">Milestones on the way to where we are today.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
            {items.map((it, idx) => (
                <Reveal key={it.year} delay={idx * 120} className="relative">
                    {/* connector */}
                    {idx < items.length - 1 && (
                        <span className="absolute left-full top-8 hidden h-px w-6 -translate-x-3 bg-brand/30 md:block" />
                    )}
                    <div className="card h-full p-6">
                        <div className="inline-flex items-center rounded-lg bg-brand px-3 py-1 font-display text-sm font-bold text-white">
                            {it.year}
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-gray-500">{it.text}</p>
                    </div>
                </Reveal>
            ))}
        </div>
    </section>
);

export default TimelineSection;
