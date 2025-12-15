import React from "react";
import { MapPin, Mail, Phone, Twitter, Linkedin, Zap } from "lucide-react";
import ContactForm from "../Components/ContactForm";
import { Toaster } from "react-hot-toast";

/**
 * Compact Contact page (dark theme)
 * - Static-first, API-ready.
 * - Keeps content in a local object (change to fetch('/api/about') later).
 */

const DATA = {
    hero: {
        title: "Talk to us — we’re here to help.",
        subtitle: "Questions about hiring, partnerships or the product? Drop a message and we’ll reply within 24–48 hours.",
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

function InfoCard({ title, children }) {
    return (
        <div className="bg-white/3 rounded-xl p-4 shadow-sm border border-white/6">
            <div className="text-sm font-medium text-gray-200 mb-1">{title}</div>
            <div className="text-sm text-gray-300">{children}</div>
        </div>
    );
}

export default function ContactUs() {
    return (
        <div className="min-h-screen bg-linear-to-b from-[#071025] via-[#071b2b] to-[#05141b] py-12 px-4 text-white">
            <Toaster position="top-center" />
            <div className="max-w-6xl mx-auto">
                {/* HERO */}
                <section className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold">{DATA.hero.title}</h1>
                    <p className="text-gray-300 mt-3 max-w-2xl mx-auto">{DATA.hero.subtitle}</p>
                    <div className="mt-6">
                        <a
                            href={DATA.hero.cta.href}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow"
                        >
                            <Zap size={16} /> {DATA.hero.cta.text}
                        </a>
                    </div>
                </section>

                {/* GRID: form + info */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div>
                        <ContactForm onSuccess={() => { /* currently no-op; you can navigate or show extra UI */ }} />
                    </div>

                    <aside className="space-y-4">
                        <InfoCard title="Contact">
                            <div className="flex items-start gap-3">
                                <MapPin size={18} />
                                <div>
                                    <div className="text-sm text-gray-300">{DATA.info.address}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <a className="text-sm text-gray-300 hover:underline" href={`mailto:${DATA.info.email}`}>
                                        {DATA.info.email}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} />
                                    <a className="text-sm text-gray-300 hover:underline" href={`tel:${DATA.info.phone}`}>
                                        {DATA.info.phone}
                                    </a>
                                </div>
                            </div>
                        </InfoCard>

                        <InfoCard title="Office hours">
                            <div className="text-sm text-gray-300">Mon — Fri · 9:00 AM — 6:00 PM (IST)</div>
                            <div className="text-sm text-gray-400 mt-2">Closed on national holidays</div>
                        </InfoCard>

                        <InfoCard title="Follow us">
                            <div className="flex items-center gap-3">
                                {DATA.info.socials.map((s) => (
                                    <a
                                        key={s.name}
                                        href={s.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/3 hover:bg-white/5"
                                        aria-label={s.name}
                                    >
                                        {s.icon} <span className="text-sm text-gray-300">{s.name}</span>
                                    </a>
                                ))}
                            </div>
                        </InfoCard>

                        <InfoCard title="Find us">
                            <div className="w-full h-40 rounded-lg overflow-hidden border border-white/6">
                                {/* simple embed — OK for dev. Replace with your coordinates if needed */}
                                <iframe
                                    title="office-map"
                                    src={DATA.mapEmbedSrc}
                                    className="w-full h-full"
                                    loading="lazy"
                                />
                            </div>
                        </InfoCard>
                    </aside>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4">Frequently asked</h2>
                    <div className="grid gap-3">
                        {DATA.faqs.map((f, idx) => (
                            <details key={idx} className="bg-white/3 p-4 rounded-xl border border-white/6">
                                <summary className="cursor-pointer list-none text-gray-100 font-medium">{f.q}</summary>
                                <div className="mt-2 text-sm text-gray-300">{f.a}</div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-white/4 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="text-xl font-bold">Ready to grow your team?</div>
                        <div className="text-sm text-gray-300 mt-1">Post a job or talk to our enterprise team.</div>
                    </div>
                    <div className="flex gap-3">
                        <a href="/jobs" className="px-4 py-2 rounded-md bg-teal-500 text-white hover:bg-teal-600">Browse Jobs</a>
                        <a href="/register" className="px-4 py-2 rounded-md border border-white/10 text-gray-100 hover:bg-white/5">Get started</a>
                    </div>
                </section>
            </div>
        </div>
    );
}
