// src/components/About/TestimonialsSection.jsx
import React from "react";

const TestimonialsSection = ({ items }) => (
    <section className="py-12 px-6 md:px-12 bg-linear-to-b from-transparent to-white/2">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Companies hiring</h2>
            <div className="flex items-center gap-6 overflow-x-auto py-4">
                {items.map((it, idx) => (
                    <div key={idx} className="min-w-[140px] bg-white/4 p-4 rounded-2xl flex items-center justify-center">
                        <img loading="lazy" src={it.logo} alt={it.name} className="max-h-10 object-contain" />
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default TestimonialsSection;
