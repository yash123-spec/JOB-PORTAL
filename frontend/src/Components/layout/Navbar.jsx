// src/Components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, LogOut, User, FileText, Bookmark, LayoutDashboard, Menu, Plus, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { optimizedImage } from "../../utils/img";
import NotificationDropdown from "./NotificationDropdown";
import MessagesIcon from "./MessagesIcon";
import Sidebar from "./Sidebar";
import AddJobModal from "../jobs/AddJobModal";
import LogoutConfirmModal from "./LogoutConfirmModal";

const Navbar = () => {
    const { user, logout } = useAuth(); // <-- use context
    const location = useLocation();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPostJob, setShowPostJob] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const menuRef = useRef(null);

    // Open the confirmation dialog (closing the dropdown first)
    const requestLogout = () => {
        setMenuOpen(false);
        setShowLogout(true);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout(); // context logout clears localStorage too
            setShowLogout(false);
            navigate("/login");
        } finally {
            setLoggingOut(false);
        }
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
        <>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <nav className="sticky top-0 z-50 bg-ink text-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
                    {/* Left: menu toggle + logo */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>
                        <Link to="/" className="flex items-center gap-2">
                            <Briefcase className="h-6 w-6 text-brand" />
                            <span className="font-display text-lg font-semibold">FirstChoice</span>
                        </Link>
                    </div>

                    {/* Center: desktop menu */}
                    <div className="hidden items-center gap-10 md:flex">
                        {navLinks.map((link) => {
                            const active = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-sm transition-colors duration-200 ${active
                                        ? "font-semibold text-white"
                                        : "text-gray-300 hover:text-white"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: user controls (logged-in state) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Role-aware primary action */}
                        {user?.role === "recruiter" && (
                            <button
                                onClick={() => setShowPostJob(true)}
                                className="btn btn-primary hidden px-4 py-2 text-sm sm:inline-flex"
                            >
                                <Plus size={16} /> Post a Job
                            </button>
                        )}
                        {user?.role === "candidate" && (
                            <button
                                onClick={() => navigate("/my-applications")}
                                className="btn btn-primary hidden px-4 py-2 text-sm sm:inline-flex"
                            >
                                <FileText size={16} /> My Applications
                            </button>
                        )}

                        {/* Messages */}
                        <MessagesIcon />

                        {/* Notification Bell */}
                        <NotificationDropdown />

                        {/* Profile avatar + dropdown */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                className="flex items-center gap-1.5"
                                aria-label="Account menu"
                                aria-expanded={menuOpen}
                            >
                                <img
                                    src={user?.profilePic && user.profilePic.trim() !== '' ? optimizedImage(user.profilePic, { width: 96 }) : "/149071.png"}
                                    alt="Profile"
                                    className="h-9 w-9 rounded-full border-2 border-brand object-cover"
                                    onError={(e) => {
                                        e.target.src = '/149071.png';
                                    }}
                                />
                                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-white text-gray-800 shadow-2xl">
                                    <div className="border-b px-4 py-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-sm font-semibold">{user?.fullname || "User"}</p>
                                            {user?.role && (
                                                <span className="badge badge-brand shrink-0 capitalize">{user.role}</span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email}</p>
                                    </div>

                                    <button
                                        onClick={() => go("/profile")}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                    >
                                        <User size={16} /> Profile
                                    </button>

                                    {user?.role === "recruiter" && (
                                        <button
                                            onClick={() => go("/recruiter-dashboard")}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                        >
                                            <LayoutDashboard size={16} /> Dashboard
                                        </button>
                                    )}

                                    {user?.role === "candidate" && (
                                        <>
                                            <button
                                                onClick={() => go("/my-applications")}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <FileText size={16} /> My Applications
                                            </button>
                                            <button
                                                onClick={() => go("/bookmarked")}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <Bookmark size={16} /> Bookmarked
                                            </button>
                                        </>
                                    )}

                                    <div className="border-t">
                                        <button
                                            onClick={requestLogout}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Recruiter quick action: post a job from anywhere */}
            {showPostJob && (
                <AddJobModal
                    defaultCompany={user?.company || ""}
                    onClose={() => setShowPostJob(false)}
                    onCreate={(job) => { setShowPostJob(false); navigate(job?._id ? `/jobs/${job._id}` : "/jobs"); }}
                />
            )}

            {/* Logout confirmation */}
            <LogoutConfirmModal
                open={showLogout}
                onClose={() => setShowLogout(false)}
                onConfirm={handleLogout}
                loading={loggingOut}
            />
        </>
    );
};

export default Navbar;
