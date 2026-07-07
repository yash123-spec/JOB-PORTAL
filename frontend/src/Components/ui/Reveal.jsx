// src/Components/ui/Reveal.jsx
import { useEffect, useRef, useState } from "react";

/**
 * Fade-and-rise on scroll into view. Zero dependencies (IntersectionObserver).
 * Usage: <Reveal><section>…</section></Reveal>  |  <Reveal as="li" delay={100}>…</Reveal>
 */
const Reveal = ({ as: Tag = "div", delay = 0, className = "", children, ...rest }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el); // reveal once
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`reveal ${visible ? "is-visible" : ""} ${className}`}
            {...rest}
        >
            {children}
        </Tag>
    );
};

export default Reveal;
