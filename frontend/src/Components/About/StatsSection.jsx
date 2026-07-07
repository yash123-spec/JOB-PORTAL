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
        <div className="rounded-2xl bg-white p-6 text-center shadow-soft">
            <div className="font-display text-3xl font-bold text-brand md:text-4xl">{display.toLocaleString()}</div>
            <div className="mt-1 text-sm font-medium text-gray-500">{label}</div>
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
        <section ref={ref} className="bg-brand-mint py-16 md:py-20">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 px-6 md:grid-cols-4 md:px-8">
                <Stat label="Jobs Posted" value={stats.jobsPosted} startOn={visible} />
                <Stat label="Candidates" value={stats.candidates} startOn={visible} />
                <Stat label="Recruiters" value={stats.recruiters} startOn={visible} />
                <Stat label="Placements" value={stats.placements} startOn={visible} />
            </div>
        </section>
    );
};

export default StatsSection;
