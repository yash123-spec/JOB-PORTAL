// src/Components/layout/LogoutConfirmModal.jsx
import { useEffect } from "react";
import { LogOut, X, Loader2 } from "lucide-react";

/**
 * Confirmation dialog shown before logging the user out.
 * Purely presentational — the parent owns the actual logout logic and passes
 * it in via `onConfirm`. Reused by both the Navbar dropdown and the Sidebar.
 *
 * Props:
 *   open       — whether the modal is visible
 *   onClose    — called when the user cancels / dismisses
 *   onConfirm  — called when the user confirms logout
 *   loading    — shows a spinner + disables buttons while logout is in flight
 */
const LogoutConfirmModal = ({ open, onClose, onConfirm, loading = false }) => {
    // Close on Escape + lock body scroll while open
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, loading, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
        >
            {/* Backdrop */}
            <div
                onClick={loading ? undefined : onClose}
                className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-fade-in"
            />

            {/* Dialog */}
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lift animate-scale-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <div className="px-6 pb-6 pt-8 text-center">
                    {/* Icon badge */}
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/40">
                        <LogOut size={28} className="text-red-500" />
                    </div>

                    <h2 id="logout-title" className="font-display text-xl font-semibold text-ink">
                        Log out?
                    </h2>
                    <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-gray-500">
                        Are you sure you want to log out? You'll need to sign in again to access
                        your account.
                    </p>

                    {/* Actions */}
                    <div className="mt-7 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-[0_8px_24px_-6px_rgba(239,68,68,0.5)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Logging out…
                                </>
                            ) : (
                                <>
                                    <LogOut size={16} /> Log out
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmModal;
