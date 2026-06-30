// src/Components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, LogOut, User, FileText, Bookmark, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationDropdown from "./NotificationDropdown";
import MessagesIcon from "./MessagesIcon";

const Navbar = () => {
    const { user, logout } = useAuth(); // <-- use context
    const location = useLocation();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        await logout(); // context logout clears localStorage too
        setMenuOpen(false);
        navigate("/login");
    };

    // Close the avatar dropdown when clicking outside it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const go = (path) => {
        setMenuOpen(false);
        navigate(path);
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Jobs", path: "/jobs" },
        { name: "About Us", path: "/about" },
        { name: "Contact Us", path: "/contact" },
    ];

    return (
        <nav className="bg-[#0e0e0e] text-white shadow-lg sticky top-0 z-50">
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
                        {/* Messages */}
                        <MessagesIcon />

                        {/* Notification Bell */}
                        <NotificationDropdown />

                        {/* Profile avatar + dropdown */}
                        <div className="relative" ref={menuRef}>
                            <img
                                src={user?.profilePic && user.profilePic.trim() !== '' ? user.profilePic : "/149071.png"}
                                alt="Profile"
                                className="w-9 h-9 rounded-full border-2 border-teal-400 cursor-pointer object-cover"
                                onClick={() => setMenuOpen((o) => !o)}
                                onError={(e) => {
                                    e.target.src = '/149071.png';
                                }}
                            />

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-2xl border z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b">
                                        <p className="text-sm font-semibold truncate">{user?.fullname || "User"}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>

                                    <button
                                        onClick={() => go("/profile")}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                    >
                                        <User size={16} /> Profile
                                    </button>

                                    {user?.role === "recruiter" && (
                                        <button
                                            onClick={() => go("/recruiter-dashboard")}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                        >
                                            <LayoutDashboard size={16} /> Dashboard
                                        </button>
                                    )}

                                    {user?.role === "candidate" && (
                                        <>
                                            <button
                                                onClick={() => go("/my-applications")}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <FileText size={16} /> My Applications
                                            </button>
                                            <button
                                                onClick={() => go("/bookmarked")}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <Bookmark size={16} /> Bookmarked
                                            </button>
                                        </>
                                    )}

                                    <div className="border-t">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
