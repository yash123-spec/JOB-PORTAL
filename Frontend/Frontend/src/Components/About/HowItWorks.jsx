// src/components/About/HowItWorks.jsx
import React from "react";
import { Search, Send, Briefcase } from "lucide-react";

const iconMap = { Search, Send, Briefcase };

const Step = ({ step }) => {
    const Icon = iconMap[step.icon] || Search;
    return (
        <div className="bg-white/4 p-6 rounded-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/6 flex items-center justify-center mb-3">
                <Icon className="text-teal-300" />
            </div>
            <h4 className="text-white font-semibold mb-1">{step.title}</h4>
            <p className="text-gray-300 text-sm">{step.text}</p>
        </div>
    );
};

const HowItWorks = ({ steps }) => (
    <section className="py-12 px-6 md:px-12 bg-linear-to-b from-transparent to-white/2">
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {steps.map((s) => <Step key={s.key} step={s} />)}
            </div>
        </div>
    </section>
);

export default HowItWorks;
