// src/components/About/MissionSection.jsx
import React from "react";
import { Target, Eye, Heart } from "lucide-react";
import Reveal from "../ui/Reveal";

const icons = [Target, Eye, Heart];

const MissionCard = ({ item, index }) => {
    const Icon = icons[index % icons.length];
    return (
        <Reveal delay={index * 100} className="card card-hover p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon size={22} />
            </span>
            <h4 className="mt-4 font-display text-lg font-bold text-ink">{item.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.text}</p>
        </Reveal>
    );
};

const MissionSection = ({ items }) => {
    return (
        <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <Reveal className="text-center">
                <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">Mission &amp; Values</h2>
                <p className="mx-auto mt-3 max-w-xl text-gray-500">What drives us to build a fairer, more human hiring experience.</p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                {items.map((it, i) => <MissionCard key={it.title} item={it} index={i} />)}
            </div>
        </section>
    );
};

export default MissionSection;
