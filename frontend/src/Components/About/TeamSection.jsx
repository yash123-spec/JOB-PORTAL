// src/components/About/TeamSection.jsx
import React from "react";
import Reveal from "../ui/Reveal";

const Member = ({ m, index }) => (
    <Reveal delay={index * 100} className="card card-hover p-6 text-center">
        <img
            loading="lazy"
            src={m.img}
            alt={m.name}
            className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-brand-light"
        />
        <div className="mt-4 font-display text-lg font-bold text-ink">{m.name}</div>
        <div className="text-sm font-medium text-brand">{m.role}</div>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{m.bio}</p>
    </Reveal>
);

const TeamSection = ({ members }) => (
    <section className="bg-brand-mint py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
            <Reveal className="text-center">
                <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">Meet the Team</h2>
                <p className="mx-auto mt-3 max-w-xl text-gray-500">The people building a better way to hire.</p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {members.map((m, i) => <Member key={m.id} m={m} index={i} />)}
            </div>
        </div>
    </section>
);

export default TeamSection;
