// src/components/About/CTASection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Reveal from "../ui/Reveal";

const CTASection = ({ data }) => {
    const nav = useNavigate();
    return (
        <section className="mx-auto max-w-6xl px-6 pb-20 md:px-8">
            <Reveal className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-center text-white shadow-lift md:px-14">
                <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-[100px]" />
                <div className="relative">
                    <h3 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight md:text-4xl">{data.title}</h3>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        {data.buttons.map((b) => (
                            <button
                                key={b.text}
                                onClick={() => nav(b.link)}
                                className={b.style === "primary" ? "btn btn-primary" : "btn btn-secondary"}
                            >
                                {b.text}
                            </button>
                        ))}
                    </div>
                </div>
            </Reveal>
        </section>
    );
};

export default CTASection;
