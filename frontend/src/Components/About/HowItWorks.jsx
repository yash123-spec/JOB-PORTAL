// src/components/About/HowItWorks.jsx
import React from "react";
import { Search, Send, Briefcase } from "lucide-react";
import Reveal from "../ui/Reveal";

const iconMap = { Search, Send, Briefcase };

const Step = ({ step, index }) => {
    const Icon = iconMap[step.icon] || Search;
    return (
        <Reveal delay={index * 100} className="card card-hover group p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white">
                <Icon size={28} strokeWidth={1.7} />
            </div>
            <h4 className="mt-5 font-display text-lg font-bold text-ink">{step.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.text}</p>
        </Reveal>
    );
};

const HowItWorks = ({ steps }) => (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
        <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">From discovery to hire, in three simple steps.</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s, i) => <Step key={s.key} step={s} index={i} />)}
        </div>
    </section>
);

export default HowItWorks;
