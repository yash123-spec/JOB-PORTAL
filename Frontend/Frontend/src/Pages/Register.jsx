// src/Pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../Components/GoogleLoginButton";
import AppleLoginButton from "../Components/AppleLoginButton";
import OTPVerificationModal from "../Components/OTPVerificationModal";
import axios from "axios";
import toast from "react-hot-toast";

const Register = () => {
    const navigate = useNavigate();
    const { register, loading: authLoading } = useAuth();

    const [form, setForm] = useState({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "candidate",
        companyName: "",
        companyWebsite: "",
        designation: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);

    const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || 'http://localhost:8000';

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

        // RECRUITER: Use new OTP-based registration
        if (role === "recruiter") {
            if (!companyName.trim()) {
                toast.error("Company name is required for recruiters");
                return;
            }

            try {
                const response = await axios.post(
                    `${API_BASE}/api/auth/recruiter/register`,
                    {
                        fullname,
                        email,
                        password,
                        companyName: form.companyName,
                        companyWebsite: form.companyWebsite || undefined,
                        designation: form.designation || undefined
                    },
                    { withCredentials: true }
                );

                if (response.data.success) {
                    toast.success(response.data.message);
                    setRegistrationData({ fullname, password, companyName: form.companyName, companyWebsite: form.companyWebsite, designation: form.designation });
                    setShowOTPModal(true);
                }
            } catch (error) {
                toast.error(error.response?.data?.message || "Registration failed");
            }
            return;
        }

        // CANDIDATE: Legacy registration (for existing candidates)
        // Note: New candidates should use OAuth
        const result = await register({
            fullname,
            email,
            password,
            role
        });

        if (result?.success) {
            navigate("/");
        }
    };

    const handleOTPSuccess = () => {
        toast.success("Registration successful! Waiting for admin approval.");
        navigate("/login");
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Dark Panel */}
            <div className="w-2/5 bg-gradient-to-br from-[#0d3b4a] to-[#0a2933] flex items-center justify-center px-12">
                <div className="text-white">
                    <h1 className="text-4xl font-bold mb-6">
                        Join<br />
                        First Choice
                    </h1>
                    <div className="w-24 h-1 bg-teal-400 mb-6"></div>
                    <p className="text-lg text-gray-300">
                        Start your journey to find amazing opportunities or top talent.
                    </p>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-3/5 bg-white flex items-center justify-center px-16 py-8 overflow-y-auto">
                <div className="w-full max-w-md my-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Create your account</h2>

                    {/* Role Selection */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-600 block mb-1.5 font-medium">I am a...</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, role: "candidate" }))}
                                className={`py-2 rounded-lg text-sm font-semibold transition-all border-2 ${form.role === "candidate"
                                    ? "bg-teal-500 text-white border-teal-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"
                                    }`}
                            >
                                Candidate
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, role: "recruiter" }))}
                                className={`py-2 rounded-lg text-sm font-semibold transition-all border-2 ${form.role === "recruiter"
                                    ? "bg-teal-500 text-white border-teal-500"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-teal-400"
                                    }`}
                            >
                                Recruiter
                            </button>
                        </div>
                    </div>

                    {/* CANDIDATE: Show OAuth buttons only */}
                    {form.role === "candidate" && (
                        <div className="space-y-3">
                            <GoogleLoginButton />
                            <AppleLoginButton />

                            <div className="flex items-center my-4">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-3 text-xs text-gray-500 font-medium">or</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800 text-center">
                                    💡 Candidates must use Google or Apple login.<br />
                                    No manual registration required.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RECRUITER: Show Email/Password form with OTP verification */}
                    {form.role === "recruiter" && (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-700 block mb-1 font-medium">Full name *</label>
                                    <input
                                        name="fullname"
                                        value={form.fullname}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition"
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-700 block mb-1 font-medium">Email *</label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-700 block mb-1 font-medium">Company name *</label>
                                    <input
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition"
                                        placeholder="Your company"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-700 block mb-1 font-medium">Company website</label>
                                    <input
                                        name="companyWebsite"
                                        type="url"
                                        value={form.companyWebsite}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition"
                                        placeholder="https://company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-700 block mb-1 font-medium">Your designation</label>
                                <input
                                    name="designation"
                                    value={form.designation}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition"
                                    placeholder="e.g., HR Manager"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-700 block mb-1 font-medium">Password *</label>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            type={showPassword ? "text" : "password"}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition pr-12"
                                            placeholder="Password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="absolute right-3 top-2 text-xs text-gray-600 hover:text-gray-900"
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-700 block mb-1 font-medium">Confirm password *</label>
                                    <input
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        type="password"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-200 outline-none transition"
                                        placeholder="Repeat password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <p className="text-xs text-blue-800">
                                    📧 You'll receive an OTP via email for verification<br />
                                    ⏳ Your account will need admin approval before you can post jobs
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {authLoading ? "Processing..." : "Register & Send OTP"}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-gray-700 mt-4 text-xs">
                        Already have an account?{" "}
                        <span
                            onClick={() => navigate("/login")}
                            className="text-blue-600 font-semibold cursor-pointer hover:underline"
                        >
                            Sign In.
                        </span>
                    </p>
                </div>
            </div>

            {/* OTP Verification Modal */}
            <OTPVerificationModal
                isOpen={showOTPModal}
                onClose={() => setShowOTPModal(false)}
                email={form.email}
                registrationData={registrationData}
                onSuccess={handleOTPSuccess}
            />
        </div>
    );
};

export default Register;
