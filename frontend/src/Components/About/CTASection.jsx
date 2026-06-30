// src/components/About/CTASection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const CTASection = ({ data }) => {
    const nav = useNavigate();
    return (
        <section className="py-12 px-6 md:px-12 bg-[#06131a]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-white">{data.title}</h3>
                </div>
                <div className="flex gap-3">
                    {data.buttons.map((b) => (
                        <button
                            key={b.text}
                            onClick={() => nav(b.link)}
                            className={b.style === "primary" ? "px-4 py-2 bg-teal-500 rounded-2xl text-white" : "px-4 py-2 bg-white/6 rounded-2xl text-white"}
                        >
                            {b.text}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CTASection;
