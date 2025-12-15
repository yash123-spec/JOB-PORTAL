// src/Pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginButton from "../Components/GoogleLoginButton";
import AppleLoginButton from "../Components/AppleLoginButton";
import toast from "react-hot-toast";

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();
    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [keepSignedIn, setKeepSignedIn] = useState(false);

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

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Dark Panel */}
            <div className="w-2/5 bg-gradient-to-br from-[#0d3b4a] to-[#0a2933] flex items-center justify-center px-12">
                <div className="text-white">
                    <h1 className="text-4xl font-bold mb-6">
                        Welcome Back to<br />
                        First Choice
                    </h1>
                    <div className="w-24 h-1 bg-teal-400 mb-6"></div>
                    <p className="text-lg text-gray-300">
                        Sign in to continue to your account.
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-3/5 bg-white flex items-center justify-center px-16">
                <div className="w-full max-w-md">
                    {!showRecruiterLogin ? (
                        <>
                            {/* Candidate OAuth Login */}
                            <div className="space-y-4 mb-6">
                                <GoogleLoginButton />
                                <AppleLoginButton />
                            </div>

                            {/* Divider */}
                            <div className="flex items-center mb-6">
                                <div className="flex-1 border-t border-gray-300"></div>
                                <span className="px-4 text-sm text-gray-500 font-medium">or</span>
                                <div className="flex-1 border-t border-gray-300"></div>
                            </div>

                            {/* Keep Signed In Checkbox */}
                            <div className="mb-6">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={keepSignedIn}
                                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">Keep me signed in until I sign out</span>
                                </label>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="mb-8">
                                <span className="text-sm text-gray-600 cursor-pointer hover:text-teal-600 hover:underline">
                                    Forgot Password?
                                </span>
                            </div>

                            {/* Recruiter Login Link */}
                            <div className="mb-6 text-center">
                                <button
                                    onClick={() => setShowRecruiterLogin(true)}
                                    className="text-sm text-teal-600 font-semibold hover:underline"
                                >
                                    Login as Recruiter
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Recruiter Email/Password Login */}
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Recruiter Login</h3>

                            <form onSubmit={handleRecruiterLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={credentials.email}
                                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Logging in..." : "Login"}
                                </button>
                            </form>

                            {/* Back to Candidate Login */}
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setShowRecruiterLogin(false)}
                                    className="text-sm text-gray-600 hover:text-teal-600 hover:underline"
                                >
                                    ← Back to Candidate Login
                                </button>
                            </div>
                        </>
                    )}

                    {/* Sign Up Link */}
                    <p className="text-center text-sm text-gray-700">
                        Not a member yet?{" "}
                        <span
                            onClick={() => navigate("/register")}
                            className="text-blue-600 font-semibold cursor-pointer hover:underline"
                        >
                            Sign Up.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
