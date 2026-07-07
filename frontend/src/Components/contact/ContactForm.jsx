import React, { useState } from "react";
import toast from "react-hot-toast";
import { submitContact } from "../../utils/contactApi";

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

    const labelCls = "mb-1.5 block text-sm font-medium text-ink";

    return (
        <form onSubmit={handleSubmit} className="rounded-3xl bg-brand-mint p-6 md:p-8">
            {/* honeypot (visually hidden) */}
            <input
                aria-hidden="true"
                tabIndex="-1"
                autoComplete="off"
                value={form.hp}
                onChange={(e) => setForm((s) => ({ ...s, hp: e.target.value }))}
                className="sr-only"
            />

            <div className="text-center">
                <h3 className="font-display text-2xl font-bold text-ink">Contact Info</h3>
                <p className="mt-1 text-sm text-gray-500">We'd love to hear from you — send us a message.</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className={labelCls}>Full name</label>
                    <input
                        value={form.name}
                        onChange={update("name")}
                        className="input-field"
                        placeholder="Your name"
                        required
                    />
                </div>

                <div>
                    <label className={labelCls}>Email</label>
                    <input
                        value={form.email}
                        onChange={update("email")}
                        type="email"
                        className="input-field"
                        placeholder="you@company.com"
                        required
                    />
                </div>

                <div>
                    <label className={labelCls}>Phone (optional)</label>
                    <input
                        value={form.phone}
                        onChange={update("phone")}
                        className="input-field"
                        placeholder="+91 98765 43210"
                    />
                </div>

                <div>
                    <label className={labelCls}>Reason</label>
                    <select value={form.reason} onChange={update("reason")} className="input-field">
                        <option value="general">General enquiry</option>
                        <option value="support">Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="recruit">Recruit with us</option>
                    </select>
                </div>
            </div>

            <div className="mt-4">
                <label className={labelCls}>Subject</label>
                <input
                    value={form.subject}
                    onChange={update("subject")}
                    className="input-field"
                    placeholder="Short subject"
                />
            </div>

            <div className="mt-4">
                <label className={labelCls}>Message</label>
                <textarea
                    value={form.message}
                    onChange={update("message")}
                    rows={5}
                    className="input-field resize-y"
                    placeholder="Tell us a bit more..."
                    required
                />
            </div>

            <div className="mt-4 flex items-center gap-2">
                <input id="subscribe" type="checkbox" checked={form.subscribe} onChange={update("subscribe")} className="h-4 w-4 accent-brand" />
                <label htmlFor="subscribe" className="text-sm text-gray-600">Subscribe to product updates</label>
            </div>

            <div className="mt-6 flex items-center gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                    {loading ? "Sending..." : "Send Message"}
                </button>
                <button type="button" onClick={() => setForm(initial)} className="btn btn-secondary">
                    Reset
                </button>
            </div>
        </form>
    );
}
