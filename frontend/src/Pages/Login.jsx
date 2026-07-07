// src/Pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../Components/auth/GoogleLoginButton";
import toast from "react-hot-toast";

const EyeIcon = () => (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const LockIcon = () => (
    <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const BrandLogo = () => (
    <div className="flex items-center justify-center gap-2.5 mb-7">
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

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();
    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [keepSignedIn, setKeepSignedIn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRecruiterLogin = async (e) => {
        e.preventDefault();

        if (!credentials.email || !credentials.password) {
            toast.error("Please enter email and password");
            return;
        }

        const result = await login(credentials);

        if (result?.success) {
            navigate("/");
        }
    };

    const inputIconCls = "w-full pl-11 pr-4 py-3 bg-white/10 border border-white/25 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:border-teal-400 focus:bg-white/15 transition-all";

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

            {/* Background Image */}
            <div className="absolute inset-0" style={{ backgroundImage: "url('/bg1.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/80"></div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-[400px] mx-4 bg-black/50 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 py-7 sm:px-8 sm:py-8 shadow-[0_8px_60px_rgba(0,0,0,0.7)]">

                <BrandLogo />

                {!showRecruiterLogin ? (
                    <>
                        <h1 className="text-xl sm:text-[24px] font-semibold text-white text-center mb-1 tracking-tight">Welcome Back</h1>
                        <p className="text-sm text-slate-400 text-center mb-6 sm:mb-7">Sign in to your account</p>

                        <GoogleLoginButton />

                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-white/20"></div>
                            <span className="text-xs text-slate-400 font-medium">or</span>
                            <div className="flex-1 h-px bg-white/20"></div>
                        </div>

                        <button
                            onClick={() => setShowRecruiterLogin(true)}
                            className="w-full py-3 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_28px_rgba(20,184,166,0.4)]"
                        >
                            Login as Recruiter
                        </button>

                        <p className="text-center text-[13px] text-slate-300 mt-6">
                            Don't have an account?{" "}
                            <span onClick={() => navigate("/register")} className="text-teal-400 font-semibold cursor-pointer hover:text-teal-300 transition-colors">
                                Create one now.
                            </span>
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl sm:text-[24px] font-semibold text-white text-center mb-1 tracking-tight">Recruiter Login</h1>
                        <p className="text-sm text-slate-400 text-center mb-6 sm:mb-7">Sign in to manage your job postings</p>

                        <form onSubmit={handleRecruiterLogin} className="space-y-3">
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"><UserIcon /></span>
                                <input type="email" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} className={inputIconCls} placeholder="Email address" required />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"><LockIcon /></span>
                                <input type={showPassword ? "text" : "password"} value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} className={`${inputIconCls} pr-12`} placeholder="Password" required />
                                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? "Logging in..." : "Sign In"}
                            </button>
                        </form>

                        <button onClick={() => setShowRecruiterLogin(false)} className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-slate-400 hover:text-white transition-colors w-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            Back to Candidate Login
                        </button>

                        <p className="text-center text-[13px] text-slate-300 mt-4">
                            Don't have an account?{" "}
                            <span onClick={() => navigate("/register")} className="text-teal-400 font-semibold cursor-pointer hover:text-teal-300 transition-colors">Create one now.</span>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
