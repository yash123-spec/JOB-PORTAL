// src/components/About/TimelineSection.jsx
import React from "react";

const TimelineSection = ({ items }) => (
    <section className="py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Our Story</h2>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-full overflow-x-auto">
                    <div className="flex gap-6">
                        {items.map((it, idx) => (
                            <div key={it.year} className="min-w-[220px] bg-white/4 p-5 rounded-2xl">
                                <div className="text-teal-300 font-bold">{it.year}</div>
                                <div className="text-sm text-gray-300 mt-2">{it.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default TimelineSection;
