// src/Components/ui/CountUp.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Animated number that counts up from 0 → value the first time it scrolls into
 * view (and once `ready` is true). Generalizes the About page's stat count-up.
 *
 * Props:
 *   value       — the target number
 *   ready       — gate the animation until data has loaded (default true)
 *   duration    — animation length in ms (default 1200)
 *   format      — (n) => string for display (default toLocaleString)
 *   placeholder — shown before the animation starts (default "—")
 *   className   — passthrough classes
 */
const CountUp = ({
    value = 0,
    ready = true,
    duration = 1200,
    format = (n) => n.toLocaleString(),
    placeholder = "—",
    className = "",
}) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    const [display, setDisplay] = useState(null);

    // Trigger once when the element scrolls into view
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    obs.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Run the count-up once in view AND the value is ready
    useEffect(() => {
        if (!inView || !ready) return;
        const to = Number(value) || 0;
        const start = performance.now();
        let raf;
        const step = (ts) => {
            const t = Math.min(1, (ts - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            setDisplay(Math.floor(to * eased));
            if (t < 1) raf = requestAnimationFrame(step);
            else setDisplay(to);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView, ready, value, duration]);

    return (
        <span ref={ref} className={className}>
            {display === null ? placeholder : format(display)}
        </span>
    );
};

export default CountUp;
