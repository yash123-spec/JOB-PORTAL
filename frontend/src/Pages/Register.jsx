// src/Pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleLoginButton from "../Components/auth/GoogleLoginButton";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";

const BrandLogo = () => (
    <div className="flex items-center justify-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
        </div>
        <span className="text-[22px] tracking-tight text-white select-none">
            <span className="font-light">First</span><span className="font-bold">Choice</span>
        </span>
    </div>
);

const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

const Register = () => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "recruiter",
        companyName: "",
        companyWebsite: "",
        designation: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const validateEmail = (email) =>
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { fullname, email, password, confirmPassword, role, companyName } = form;

        if (!fullname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            toast.error("All fields are required");
            return;
        }

        if (!validateEmail(email)) {
            toast.error("Please provide a valid email address");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        // RECRUITER: Direct registration → pending admin approval
        if (role === "recruiter") {
            if (!companyName.trim()) {
                toast.error("Company name is required");
                return;
            }

            setSubmitting(true);

            try {
                const response = await authAPI.recruiterRegister({
                    fullname,
                    email,
                    password,
                    role: "recruiter",
                    companyName: form.companyName,
                    companyWebsite: form.companyWebsite || undefined,
                    designation: form.designation || undefined
                });

                if (response.success) {
                    toast.success(response.message || "Registration successful! Waiting for admin approval.");
                    navigate("/login");
                }
            } catch (error) {
                toast.error(error.message || "Registration failed");
            } finally {
                setSubmitting(false);
            }
            return;
        }


    };

    const inputCls = "w-full px-3 py-2.5 bg-white/10 border border-white/25 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:border-teal-400 focus:bg-white/15 transition-all";
    const labelCls = "text-xs text-white/90 block mb-1 font-semibold";

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-auto py-6">

            {/* Background Image */}
            <div className="absolute inset-0" style={{ backgroundImage: "url('/bg1.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/80"></div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-[460px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
                <div className="bg-black/50 backdrop-blur-2xl border border-white/15 rounded-2xl px-4 py-5 sm:px-7 sm:py-6 shadow-[0_8px_60px_rgba(0,0,0,0.7)]">

                    <BrandLogo />

                    <h1 className="text-xl sm:text-[22px] font-semibold text-white mb-1 tracking-tight">Create your account</h1>

                    {/* Role Toggle */}
                    <p className="text-xs text-slate-100 mb-2 mt-3">I am a...</p>
                    <div className="flex mb-4 bg-black/40 rounded-xl p-1 border border-white/5">
                        <button type="button" onClick={() => setForm(p => ({ ...p, role: "candidate" }))}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${form.role === "candidate"
                                ? "bg-linear-to-r from-teal-600 to-cyan-600 text-white shadow-[0_0_16px_rgba(20,184,166,0.35)]"
                                : "text-slate-300 hover:text-slate-300"
                                }`}>Candidate</button>
                        <button type="button" onClick={() => setForm(p => ({ ...p, role: "recruiter" }))}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${form.role === "recruiter"
                                ? "bg-linear-to-r from-teal-600 to-cyan-600 text-white shadow-[0_0_16px_rgba(20,184,166,0.35)]"
                                : "text-slate-300 hover:text-slate-300"
                                }`}>Recruiter</button>
                    </div>

                    {/* CANDIDATE */}
                    {form.role === "candidate" && (
                        <div className="space-y-3">
                            <GoogleLoginButton />
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-white/20"></div>
                                <span className="text-xs text-slate-400 font-medium">or</span>
                                <div className="flex-1 h-px bg-white/20"></div>
                            </div>
                            <div className="bg-teal-950/50 border border-teal-700/30 rounded-xl px-4 py-3">
                                <p className="text-[12px] text-teal-300 text-center leading-relaxed">
                                    💡 Candidates register through Google Sign-In.<br />No manual registration required.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RECRUITER */}
                    {form.role === "recruiter" && (
                        <form onSubmit={handleSubmit} className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div><label className={labelCls}>Full name *</label><input name="fullname" value={form.fullname} onChange={handleChange} className={inputCls} placeholder="Your full name" required /></div>
                                <div><label className={labelCls}>Email *</label><input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} placeholder="you@example.com" required /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div><label className={labelCls}>Company name *</label><input name="companyName" value={form.companyName} onChange={handleChange} className={inputCls} placeholder="Your company" required /></div>
                                <div><label className={labelCls}>Company website</label><input name="companyWebsite" type="url" value={form.companyWebsite} onChange={handleChange} className={inputCls} placeholder="https://company.com" /></div>
                            </div>
                            <div><label className={labelCls}>Your designation</label><input name="designation" value={form.designation} onChange={handleChange} className={inputCls} placeholder="e.g., HR Manager" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className={labelCls}>Password *</label>
                                    <div className="relative">
                                        <input name="password" value={form.password} onChange={handleChange} type={showPassword ? "text" : "password"} className={`${inputCls} pr-10`} placeholder="Password" required />
                                        <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Confirm password *</label>
                                    <div className="relative">
                                        <input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} type={showConfirmPassword ? "text" : "password"} className={`${inputCls} pr-10`} placeholder="Repeat password" required />
                                        <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">{showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-teal-950/50 border border-teal-700/30 rounded-lg px-3 py-2">
                                <p className="text-[11px] text-teal-300">⏳ Your account will need admin approval before you can post jobs</p>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? "Creating account..." : "Register"}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-[13px] text-slate-100 mt-3">
                        Already have an account?{" "}
                        <span onClick={() => navigate("/login")} className="text-teal-400 font-semibold cursor-pointer hover:text-teal-300 transition-colors">Sign In.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
