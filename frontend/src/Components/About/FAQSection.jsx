// src/components/About/FAQSection.jsx
import React, { useState } from "react";

const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white/4 rounded-2xl p-4">
            <button
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="w-full text-left flex justify-between items-center gap-3"
            >
                <div>
                    <div className="font-semibold text-white">{q}</div>
                </div>
                <div className="text-gray-300">{open ? "−" : "+"}</div>
            </button>
            {open && <div className="mt-3 text-gray-300 text-sm">{a}</div>}
        </div>
    );
};

const FAQSection = ({ items }) => (
    <section className="py-12 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">FAQ</h2>
            <div className="grid gap-4">
                {items.map((f, idx) => <FAQItem key={idx} q={f.q} a={f.a} />)}
            </div>
        </div>
    </section>
);

export default FAQSection;
