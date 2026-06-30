// src/components/About/MissionSection.jsx
import React from "react";

const MissionCard = ({ item }) => (
    <div className="bg-white/4 p-6 rounded-2xl shadow-sm">
        <h4 className="font-semibold text-white mb-2">{item.title}</h4>
        <p className="text-gray-300 text-sm">{item.text}</p>
    </div>
);

const MissionSection = ({ items }) => {
    return (
        <section className="py-12 px-6 md:px-12">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Mission & Values</h2>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                    {items.map((it) => <MissionCard key={it.title} item={it} />)}
                </div>
            </div>
        </section>
    );
};

export default MissionSection;
