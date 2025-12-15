// src/components/About/StatsSection.jsx
import React, { useEffect, useRef, useState } from "react";

const Stat = ({ label, value, startOn }) => {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!startOn) return;
        const duration = 1000;
        const start = performance.now();
        const from = 0;
        const to = value;

        const step = (ts) => {
            const t = Math.min(1, (ts - start) / duration);
            setDisplay(Math.floor(from + (to - from) * t));
            if (t < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [startOn, value]);

    return (
        <div className="bg-white/4 p-5 rounded-2xl">
            <div className="text-2xl font-bold text-white">{display}</div>
            <div className="text-sm text-gray-300">{label}</div>
        </div>
    );
};

const StatsSection = ({ stats }) => {
    const ref = useRef();
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (
        <section ref={ref} className="py-12 px-6 md:px-12">
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                <Stat label="Jobs Posted" value={stats.jobsPosted} startOn={visible} />
                <Stat label="Candidates" value={stats.candidates} startOn={visible} />
                <Stat label="Recruiters" value={stats.recruiters} startOn={visible} />
                <Stat label="Placements" value={stats.placements} startOn={visible} />
            </div>
        </section>
    );
};

export default StatsSection;
