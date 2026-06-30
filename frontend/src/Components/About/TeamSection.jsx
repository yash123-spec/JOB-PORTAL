// src/components/About/TeamSection.jsx
import React from "react";

const Member = ({ m }) => (
    <div className="bg-white/4 rounded-2xl p-4 hover:-translate-y-1 transition">
        <img loading="lazy" src={m.img} alt={m.name} className="w-20 h-20 rounded-full object-cover mb-3" />
        <div className="font-semibold text-white">{m.name}</div>
        <div className="text-sm text-gray-300">{m.role}</div>
        <p className="text-xs text-gray-300 mt-2 line-clamp-3">{m.bio}</p>
    </div>
);

const TeamSection = ({ members }) => (
    <section className="py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Team</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {members.map((m) => <Member key={m.id} m={m} />)}
            </div>
        </div>
    </section>
);

export default TeamSection;
