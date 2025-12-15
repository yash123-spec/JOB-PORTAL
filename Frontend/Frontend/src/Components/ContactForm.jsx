import React, { useState } from "react";
import toast from "react-hot-toast";
import { Mail, Phone } from "lucide-react";
import { submitContact } from "../utils/contactApi";

const initial = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    reason: "general",
    message: "",
    subscribe: false,
    // honeypot field (should be left blank by real users)
    hp: ""
};

export default function ContactForm({ onSuccess }) {
    const [form, setForm] = useState(initial);
    const [loading, setLoading] = useState(false);

    const update = (k) => (e) => {
        const value = k === "subscribe" ? e.target.checked : e.target.value;
        setForm((s) => ({ ...s, [k]: value }));
    };

    const validate = () => {
        if (form.hp && form.hp.trim() !== "") return "Spam detected";
        if (!form.name.trim()) return "Please enter your name";
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email";
        if (!form.message.trim() || form.message.length < 8) return "Please enter a longer message";
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) return toast.error(err);

        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null,
                subject: form.subject.trim() || "Contact from site",
                reason: form.reason,
                message: form.message.trim(),
                subscribe: !!form.subscribe
            };

            const res = await submitContact(payload);
            if (res?.success) {
                toast.success(res.message || "Message sent");
                setForm(initial);
                onSuccess?.();
            } else {
                toast.error(res?.message || "Failed to send message");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white/5 p-6 rounded-2xl shadow-md backdrop-blur-sm">
            {/* honeypot (visually hidden) */}
            <input
                aria-hidden="true"
                tabIndex="-1"
                autoComplete="off"
                value={form.hp}
                onChange={(e) => setForm((s) => ({ ...s, hp: e.target.value }))}
                className="sr-only"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-gray-300">Full name</label>
                    <input
                        value={form.name}
                        onChange={update("name")}
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 outline-none placeholder-gray-400"
                        placeholder="Your name"
                        required
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-300">Email</label>
                    <input
                        value={form.email}
                        onChange={update("email")}
                        type="email"
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 outline-none placeholder-gray-400"
                        placeholder="you@company.com"
                        required
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-300">Phone (optional)</label>
                    <input
                        value={form.phone}
                        onChange={update("phone")}
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 outline-none placeholder-gray-400"
                        placeholder="+91 98765 43210"
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-300">Reason</label>
                    <select
                        value={form.reason}
                        onChange={update("reason")}
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 outline-none"
                    >
                        <option value="general">General enquiry</option>
                        <option value="support">Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="recruit">Recruit with us</option>
                    </select>
                </div>
            </div>

            <div className="mt-4">
                <label className="text-sm text-gray-300">Subject</label>
                <input
                    value={form.subject}
                    onChange={update("subject")}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 outline-none placeholder-gray-400"
                    placeholder="Short subject"
                />
            </div>

            <div className="mt-4">
                <label className="text-sm text-gray-300">Message</label>
                <textarea
                    value={form.message}
                    onChange={update("message")}
                    rows={5}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 outline-none placeholder-gray-400 resize-y"
                    placeholder="Tell us a bit more..."
                    required
                />
            </div>

            <div className="mt-4 flex items-center gap-3">
                <input id="subscribe" type="checkbox" checked={form.subscribe} onChange={update("subscribe")} />
                <label htmlFor="subscribe" className="text-sm text-gray-300">Subscribe to product updates</label>
            </div>

            <div className="mt-6 flex items-center gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-teal-500 hover:bg-teal-600 text-white font-medium disabled:opacity-60"
                >
                    {loading ? "Sending..." : "Send message"}
                </button>

                <button
                    type="button"
                    onClick={() => setForm(initial)}
                    className="px-4 py-2 rounded-md border border-white/10 text-gray-200 hover:bg-white/5"
                >
                    Reset
                </button>

                <div className="ml-auto text-sm text-gray-400 flex items-center gap-2">
                    <Mail size={16} /> <span>support@jobportal.example</span>
                </div>
            </div>
        </form>
    );
}
