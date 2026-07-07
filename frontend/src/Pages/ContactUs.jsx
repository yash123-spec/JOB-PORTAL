import React, { useState } from "react";
import { MapPin, Mail, Phone, Clock, Twitter, Linkedin, ChevronDown } from "lucide-react";
import ContactForm from "../Components/contact/ContactForm";
import { Toaster } from "react-hot-toast";
import Reveal from "../Components/ui/Reveal";

/**
 * Contact page — light premium theme.
 * - Static-first, API-ready.
 * - Keeps content in a local object (change to fetch('/api/about') later).
 */

const DATA = {
    hero: {
        title: "Talk to us — we're here to help.",
        subtitle: "Questions about hiring, partnerships or the product? Drop a message and we'll reply within 24–48 hours.",
        cta: { text: "Browse Jobs", href: "/jobs" }
    },
    info: {
        address: "3rd Floor, Willow Tower, MG Road, Bangalore, India",
        email: "support@jobportal.example",
        phone: "+91 98765 43210",
        socials: [
            { name: "Twitter", url: "https://twitter.com/", icon: <Twitter size={16} /> },
            { name: "LinkedIn", url: "https://www.linkedin.com/", icon: <Linkedin size={16} /> },
        ]
    },
    faqs: [
        { q: "How long until I hear back?", a: "We usually respond within 24–48 hours for general enquiries." },
        { q: "Can recruiters post jobs?", a: "Yes — recruiters can post jobs from their dashboard. Contact support if you need help." },
        { q: "Do you offer enterprise partnerships?", a: "Yes — we partner with companies of all sizes. Choose Partnership as the reason in the form." },
        { q: "Where do you operate?", a: "We currently operate across India and support remote roles globally." }
    ],
    mapEmbedSrc: "https://www.google.com/maps?q=Bengaluru&output=embed"
};

function InfoRow({ icon: Icon, title, children }) {
    return (
        <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon size={20} />
            </span>
            <div>
                <div className="font-display font-semibold text-ink">{title}</div>
                <div className="mt-0.5 text-sm text-gray-500">{children}</div>
            </div>
        </div>
    );
}

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="card overflow-hidden">
            <button
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
            >
                <span className="font-display font-semibold text-ink">{q}</span>
                <ChevronDown size={20} className={`flex-shrink-0 text-brand transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-gray-500">{a}</p>
                </div>
            </div>
        </div>
    );
}

export default function ContactUs() {
    return (
        <div className="min-h-screen bg-white text-ink">
            <Toaster position="top-center" />

            {/* ===== Hero band ===== */}
            <section className="relative overflow-hidden bg-ink py-16 text-center text-white md:py-20">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[110px]" />
                <h1 className="relative font-display text-4xl font-bold md:text-5xl">Contact Us</h1>
            </section>

            <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
                {/* GRID: info + form */}
                <section className="grid grid-cols-1 gap-10 md:grid-cols-2">
                    <Reveal>
                        <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">{DATA.hero.title}</h2>
                        <p className="mt-4 max-w-md text-gray-500">{DATA.hero.subtitle}</p>

                        <div className="mt-8 space-y-6">
                            <InfoRow icon={Phone} title="Call for inquiry">
                                <a href={`tel:${DATA.info.phone}`} className="hover:text-brand">{DATA.info.phone}</a>
                            </InfoRow>
                            <InfoRow icon={Clock} title="Opening hours">
                                Mon – Fri · 9:00 AM — 6:00 PM (IST)
                            </InfoRow>
                            <InfoRow icon={Mail} title="Send us email">
                                <a href={`mailto:${DATA.info.email}`} className="hover:text-brand">{DATA.info.email}</a>
                            </InfoRow>
                            <InfoRow icon={MapPin} title="Office">
                                {DATA.info.address}
                            </InfoRow>
                        </div>

                        {/* Socials */}
                        <div className="mt-8 flex items-center gap-3">
                            {DATA.info.socials.map((s) => (
                                <a
                                    key={s.name}
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={s.name}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </Reveal>

                    <Reveal delay={120}>
                        <ContactForm onSuccess={() => { /* currently no-op; you can navigate or show extra UI */ }} />
                    </Reveal>
                </section>

                {/* MAP */}
                <Reveal className="mt-14 overflow-hidden rounded-3xl border border-gray-100 shadow-card">
                    <iframe
                        title="office-map"
                        src={DATA.mapEmbedSrc}
                        className="h-[360px] w-full"
                        style={{ border: 0, display: "block" }}
                        loading="lazy"
                    />
                </Reveal>

                {/* FAQ */}
                <section className="mx-auto mt-16 max-w-3xl">
                    <Reveal className="text-center">
                        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">Frequently Asked</h2>
                        <p className="mx-auto mt-3 max-w-xl text-gray-500">Quick answers to the questions we hear most.</p>
                    </Reveal>
                    <div className="mt-8 grid gap-4">
                        {DATA.faqs.map((f, idx) => <FAQItem key={idx} q={f.q} a={f.a} />)}
                    </div>
                </section>

                {/* CTA */}
                <Reveal className="relative mt-16 overflow-hidden rounded-3xl bg-ink px-8 py-12 text-white shadow-lift md:px-14">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-[100px]" />
                    <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div>
                            <h3 className="font-display text-2xl font-bold md:text-3xl">Ready to grow your team?</h3>
                            <p className="mt-2 text-gray-300">Post a job or talk to our enterprise team.</p>
                        </div>
                        <div className="flex gap-3">
                            <a href="/jobs" className="btn btn-primary">Browse Jobs</a>
                            <a href="/register" className="btn btn-secondary">Get started</a>
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    );
}
