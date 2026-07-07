// src/Components/layout/Sidebar.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { optimizedImage } from "../../utils/img";
import {
    Home as HomeIcon,
    Briefcase,
    Info,
    Mail,
    User,
    FileText,
    Bookmark,
    Bell,
    MessageSquare,
    LayoutDashboard,
    LogOut,
    X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";

/**
 * Slide-in navigation drawer that surfaces all of the app's functionality
 * (including the "extra" pages that aren't in the top nav) in one place.
 * Purely presentational — it reuses the existing auth context + router.
 */
const Sidebar = ({ open, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogout, setShowLogout] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Lock body scroll while the drawer is open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    const go = (path) => {
        onClose();
        navigate(path);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            setShowLogout(false);
            onClose();
            navigate("/login");
        } finally {
            setLoggingOut(false);
        }
    };

    const mainLinks = [
        { name: "Home", path: "/", icon: HomeIcon },
        { name: "Find Jobs", path: "/jobs", icon: Briefcase },
        { name: "About Us", path: "/about", icon: Info },
        { name: "Contact Us", path: "/contact", icon: Mail },
    ];

    const candidateLinks = [
        { name: "My Applications", path: "/my-applications", icon: FileText },
        { name: "Bookmarked", path: "/bookmarked", icon: Bookmark },
    ];

    const recruiterLinks = [
        { name: "Recruiter Dashboard", path: "/recruiter-dashboard", icon: LayoutDashboard },
    ];

    const accountLinks = [
        { name: "Profile", path: "/profile", icon: User },
        { name: "Messages", path: "/messages", icon: MessageSquare },
        { name: "Notifications", path: "/notifications", icon: Bell },
    ];

    const Section = ({ title, links }) => (
        <div className="px-3 py-2">
            {title && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {title}
                </p>
            )}
            <ul className="space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const active = location.pathname === link.path;
                    return (
                        <li key={link.name}>
                            <button
                                onClick={() => go(link.path)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                                    ? "bg-brand-light text-brand-dark"
                                    : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={18} className={active ? "text-brand" : "text-gray-500"} />
                                {link.name}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
            />

            {/* Drawer */}
            <aside
                className={`fixed left-0 top-0 z-[70] flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
                            <Briefcase size={18} />
                        </span>
                        <span className="font-display text-lg font-semibold text-ink">Job Portal</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User card */}
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                    <img
                        src={user?.profilePic && user.profilePic.trim() !== "" ? optimizedImage(user.profilePic, { width: 96 }) : "/149071.png"}
                        alt="Profile"
                        className="h-11 w-11 rounded-full border-2 border-brand object-cover"
                        onError={(e) => {
                            e.target.src = "/149071.png";
                        }}
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{user?.fullname || "User"}</p>
                        <p className="truncate text-xs capitalize text-gray-500">{user?.role || "candidate"}</p>
                    </div>
                </div>

                {/* Scrollable links */}
                <nav className="flex-1 overflow-y-auto py-2">
                    <Section links={mainLinks} />
                    {user?.role === "candidate" && <Section title="Candidate" links={candidateLinks} />}
                    {user?.role === "recruiter" && <Section title="Recruiter" links={recruiterLinks} />}
                    <Section title="Account" links={accountLinks} />
                </nav>

                {/* Footer / logout */}
                <div className="border-t border-gray-100 p-3">
                    <button
                        onClick={() => setShowLogout(true)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

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

export default Sidebar;
