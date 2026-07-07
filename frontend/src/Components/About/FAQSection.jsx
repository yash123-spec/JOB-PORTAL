// src/components/About/FAQSection.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import Reveal from "../ui/Reveal";

const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="card overflow-hidden">
            <button
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
            >
                <span className="font-display font-semibold text-ink">{q}</span>
                <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-brand transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                />
            </button>
            <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-gray-500">{a}</p>
                </div>
            </div>
        </div>
    );
};

const FAQSection = ({ items }) => (
    <section className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-20">
        <Reveal className="text-center">
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">Frequently Asked Questions</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-500">Everything you need to know about using the platform.</p>
        </Reveal>
        <div className="mt-10 grid gap-4">
            {items.map((f, idx) => <FAQItem key={idx} q={f.q} a={f.a} />)}
        </div>
    </section>
);

export default FAQSection;
