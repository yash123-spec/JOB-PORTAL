// src/Pages/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";
import { optimizedImage } from "../utils/img";
import { Camera, X, Mail, User, Bookmark, FileText, Save, Loader2, BadgeCheck } from "lucide-react";

const Profile = () => {
    const { user, updateUser, refreshUser, initialized } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef(null);

    // local editable copy of user
    const [formUser, setFormUser] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const originalRef = useRef(null);

    useEffect(() => {

        // prepare form state
        setFormUser(user);
        originalRef.current = user;
        // Handle empty strings, null, undefined, or invalid URLs
        const profilePicUrl = user?.profilePic && user.profilePic.trim() !== '' ? user.profilePic : '/149071.png';
        setImagePreview(profilePicUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, initialized]);

    // Refresh user data when Profile page mounts to get latest bookmark count
    useEffect(() => {
        const loadFreshData = async () => {
            if (initialized && user) {
                await refreshUser();
            } else {
            }
        };
        loadFreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized, user?._id]); // Run when initialized changes or user ID changes

    // don't render until auth initialization is complete.
    // show a tiny centered spinner while auth state loads
    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-mint to-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
            </div>
        );
    }
    if (!user || !formUser) return null; // or loader

    // Get counts from user data
    const appliedCount = user.appliedJobsCount || 0;
    const bookmarkedCount = Array.isArray(user.bookmarks) ? user.bookmarks.length : 0;

    // handlers
    const handlePickImage = () => fileRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (max 2MB for multer)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
        }

        // Store the file for upload
        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        toast.success("Image selected. Click 'Save Changes' to upload.");
    };

    const handleFieldChange = (key) => (e) => {
        const value = e.target.value;
        setFormUser((prev) => ({ ...prev, [key]: value }));
    };

    const handleCancel = () => {
        const original = originalRef.current;
        setFormUser(original);
        setImagePreview(original?.profilePic || "/149071.png");
        setSelectedFile(null);
        toast.dismiss();
    };

    const handleRemoveProfilePic = () => {
        setImagePreview("/149071.png");
        setSelectedFile(null);
        // We'll send a special flag to backend to remove the profile pic
        setFormUser((prev) => ({ ...prev, removeProfilePic: true }));
        toast.success("Profile picture will be removed when you save changes.");
    };

    const handleSave = async () => {
        // Validate name
        if (!formUser.fullname) {
            toast.error("Name is required.");
            return;
        }

        setSaving(true);
        try {
            // Store the removal flag before creating FormData
            const isRemovingPic = formUser.removeProfilePic === true;

            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('fullname', formUser.fullname);

            // Add profile picture only if a new file was selected
            if (selectedFile && selectedFile instanceof File) {
                formData.append('profilePic', selectedFile);
            }

            // Add flag to remove profile picture if requested
            if (isRemovingPic) {
                formData.append('removeProfilePic', 'true');
            }

            // Call backend API
            const response = await authAPI.updateProfile(formData);

            if (response.success) {
                // Update auth context with new user data
                const updatedUserData = { ...response.data };
                // Ensure profilePic is null if we removed it
                if (isRemovingPic) {
                    updatedUserData.profilePic = null;
                }
                updateUser(updatedUserData);
                originalRef.current = updatedUserData;
                setFormUser({ ...updatedUserData });
                // If profile pic was removed, show default avatar, otherwise show the uploaded pic
                setImagePreview(updatedUserData.profilePic || "/149071.png");
                setSelectedFile(null);
                toast.success(response.message || "Profile updated successfully!");

                // Redirect to home page after successful upload
                setTimeout(() => {
                    navigate("/");
                }, 1000);
            }
        } catch (error) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-mint to-white py-12 px-4">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
                {/* Header band */}
                <div className="bg-ink px-6 py-6">
                    <h1 className="font-display text-2xl font-bold text-white">My Profile</h1>
                    <p className="mt-1 text-sm text-gray-300">Manage your personal information and account settings.</p>
                </div>

                <div className="flex flex-col gap-6 p-6 md:flex-row">
                    {/* Left: Avatar + stats */}
                    <div className="flex w-full flex-col items-center md:w-1/3">
                        <div className="group relative">
                            <img
                                src={imagePreview && imagePreview.trim() !== '' ? optimizedImage(imagePreview, { width: 288 }) : '/149071.png'}
                                alt="profile"
                                className="h-36 w-36 rounded-full border-4 border-white bg-gray-100 object-cover shadow-lift"
                                onError={(e) => {
                                    console.error('Failed to load image:', e.target.src);
                                    e.target.src = '/149071.png';
                                }}
                            />
                            <button
                                onClick={handlePickImage}
                                className="absolute bottom-1 right-1 rounded-full bg-brand p-2 text-white shadow transition-all hover:bg-brand-dark"
                                title="Change profile picture"
                            >
                                <Camera size={16} />
                            </button>
                            {imagePreview && imagePreview !== "/149071.png" && (
                                <button
                                    onClick={handleRemoveProfilePic}
                                    className="absolute top-0 right-0 rounded-full bg-red-500 p-2 text-white opacity-0 shadow transition-all hover:bg-red-600 group-hover:opacity-100"
                                    title="Remove profile picture"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <input
                                ref={fileRef}
                                onChange={handleFileChange}
                                type="file"
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="mt-4 w-full text-center">
                            <h2 className="font-display text-xl font-semibold text-ink">{formUser.fullname}</h2>
                            <p className="text-sm text-gray-500">@{formUser.username || formUser.email}</p>
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-light px-3 py-1 text-xs font-medium capitalize text-brand-dark">
                                <BadgeCheck size={12} /> {formUser.role}
                            </span>
                        </div>

                        <div className="mt-6 grid w-full grid-cols-2 gap-3">
                            <div className="rounded-xl bg-brand-light p-3 text-center">
                                <Bookmark size={18} className="mx-auto text-brand" />
                                <div className="mt-1 text-lg font-bold text-ink">{bookmarkedCount}</div>
                                <div className="text-xs text-gray-500">Bookmarked</div>
                            </div>
                            {/* ✅ Applied only for candidates */}
                            {user.role === 'candidate' && (
                                <div className="rounded-xl bg-blue-50 p-3 text-center">
                                    <FileText size={18} className="mx-auto text-blue-600" />
                                    <div className="mt-1 text-lg font-bold text-ink">{user.appliedJobsCount || 0}</div>
                                    <div className="text-xs text-gray-500">Applied</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Editable fields */}
                    <div className="flex-1">
                        <h3 className="mb-4 font-display text-lg font-semibold text-ink">Profile Settings</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-600">Full name</label>
                                <div className="relative">
                                    <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formUser.fullname || ""}
                                        onChange={handleFieldChange("fullname")}
                                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-gray-800 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-600">Email</label>
                                <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-gray-700 relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <span>{formUser.email || ""}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <button onClick={handleCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50" disabled={saving}>
                                Cancel
                            </button>
                            <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50" disabled={saving}>
                                {saving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                ) : (
                                    <><Save size={16} /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;