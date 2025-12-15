// src/Components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Briefcase, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth(); // <-- use context
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout(); // context logout clears localStorage too
        navigate("/login");
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Jobs", path: "/jobs" },
        { name: "About Us", path: "/about" },
        { name: "Contact Us", path: "/contact" },
    ];

    return (
        <nav className="bg-[#0e0e0e] text-white shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <Briefcase className="w-6 h-6 text-teal-400" />
                    <span className="text-lg font-semibold">Job Portal</span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`${location.pathname === link.path ? "text-white font-semibold border-b-2 border-teal-400" : "text-gray-300 hover:text-white"
                                } transition duration-200 pb-1`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Right Side - User is always logged in when navbar is visible */}
                <div className="flex items-center">
                    <div className="flex items-center space-x-3 ml-4">
                        {/* Notification Bell */}
                        <NotificationDropdown />

                        {/* Show Dashboard only for recruiters */}
                        {user?.role === "recruiter" && (
                            <button
                                onClick={() => navigate("/recruiter-dashboard")}
                                className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition"
                            >
                                Dashboard
                            </button>
                        )}

                        {/* Show Admin Dashboard only for admins */}
                        {user?.role === "admin" && (
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition"
                            >
                                Admin Panel
                            </button>
                        )}

                        {/* Profile image */}
                        <img
                            src={user?.profilePic && user.profilePic.trim() !== '' ? user.profilePic : "/149071.png"}
                            alt="Profile"
                            className="w-9 h-9 rounded-full border-2 border-teal-400 cursor-pointer object-cover"
                            onClick={() => navigate("/profile")}
                            onError={(e) => {
                                e.target.src = '/149071.png';
                            }}
                        />

                        {/* Logout icon */}
                        <button
                            onClick={handleLogout}
                            className="text-gray-300 hover:text-red-400 transition"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
