// src/Pages/Profile.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authAPI } from "../utils/api";

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
        // wait until AuthProvider finished reading localStorage
        if (!initialized) return;

        if (!user) {
            // not logged in -> redirect to login
            navigate("/login");
            return;
        }
        // prepare form state
        setFormUser(user);
        originalRef.current = user;
        // Handle empty strings, null, undefined, or invalid URLs
        const profilePicUrl = user?.profilePic && user.profilePic.trim() !== '' ? user.profilePic : '/149071.png';
        console.log('Setting imagePreview:', profilePicUrl, 'Original profilePic:', user?.profilePic);
        setImagePreview(profilePicUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, initialized]);

    // Refresh user data when Profile page mounts to get latest bookmark count
    useEffect(() => {
        console.log('🏠 Profile refresh check, initialized:', initialized, 'user:', !!user);
        const loadFreshData = async () => {
            if (initialized && user) {
                console.log('🔄 Triggering refreshUser...');
                await refreshUser();
            } else {
                console.log('⏸️ Not refreshing - initialized:', initialized, 'user:', !!user);
            }
        };
        loadFreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized, user?._id]); // Run when initialized changes or user ID changes

    // don't render until auth initialization is complete.
    // show a tiny centered spinner while auth state loads
    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
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
        <div className="min-h-screen bg-linear-to-b from-slate-50 to-white py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Avatar + stats */}
                    <div className="w-full md:w-1/3 flex flex-col items-center">
                        <div className="relative group">
                            <img
                                src={imagePreview && imagePreview.trim() !== '' ? imagePreview : '/149071.png'}
                                alt="profile"
                                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow bg-gray-100"
                                onError={(e) => {
                                    console.error('Failed to load image:', e.target.src);
                                    e.target.src = '/149071.png';
                                }}
                            />
                            <button
                                onClick={handlePickImage}
                                className="absolute bottom-0 right-0 bg-teal-500 text-white rounded-full p-2 shadow hover:bg-teal-600 transition-all"
                                title="Change profile picture"
                            >
                                ✎
                            </button>
                            {imagePreview && imagePreview !== "/149071.png" && (
                                <button
                                    onClick={handleRemoveProfilePic}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 shadow hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove profile picture"
                                >
                                    ✕
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
                            <h2 className="text-xl font-semibold">{formUser.fullname}</h2>
                            <p className="text-sm text-gray-500">@{formUser.username || formUser.email}</p>
                            <p className="mt-2 text-sm">
                                <span className="font-medium">Role:</span> {formUser.role}
                            </p>
                        </div>

                        <div className="mt-6 w-full grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-sm text-gray-500">Bookmarked</div>
                                <div className="text-lg font-bold">{bookmarkedCount}</div>
                            </div>
                            {user.role === 'candidate' && (
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <div className="text-sm text-gray-500">Applied</div>
                                    <div className="text-lg font-bold">{user.appliedJobsCount || 0}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Editable fields */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Full name</label>
                                <input
                                    type="text"
                                    value={formUser.fullname || ""}
                                    onChange={handleFieldChange("fullname")}
                                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-teal-300"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Email</label>
                                <div className="w-full px-4 py-2 border rounded-md bg-gray-50 text-gray-700 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <span>{formUser.email || ""}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-wrap gap-3 items-center">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-md border hover:bg-gray-50"
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded-md bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>

                            {/* Candidate-only: quick link to My Applications */}
                            {formUser.role === "candidate" && (
                                <button
                                    onClick={() => navigate("/my-applications")}
                                    className="px-4 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 ml-2"
                                    title="View your job applications"
                                >
                                    My Applications
                                </button>
                            )}
                        </div>

                        {/* small hint */}
                        <p className="mt-4 text-xs text-gray-500">
                            Changes are stored locally for now. When you connect the backend, we'll switch this to a real API call.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
