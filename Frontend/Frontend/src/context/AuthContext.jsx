// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);

    // On mount, check if user is logged in by fetching current user
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check localStorage first (for quick UI updates)
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                // Verify with backend
                const response = await authAPI.getCurrentUser();
                if (response.success) {
                    setUser(response.data);
                    localStorage.setItem("user", JSON.stringify(response.data));
                    localStorage.setItem("isLoggedIn", "true");
                }
            } catch (error) {
                // If verification fails, clear local data
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("isLoggedIn");
            } finally {
                setInitialized(true);
            }
        };

        initAuth();
    }, []);

    // Login function - now calls backend API
    const login = async (credentials) => {
        setLoading(true);
        try {
            const response = await authAPI.login(credentials);
            if (response.success) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
                localStorage.setItem("isLoggedIn", "true");
                toast.success(response.message || "Successfully logged in!");
                return { success: true, data: response.data };
            }
        } catch (error) {
            const message = error.message || "Login failed";
            toast.error(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    // Register function - calls backend API
    const register = async (userData) => {
        setLoading(true);
        try {
            const response = await authAPI.register(userData);
            if (response.success) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
                localStorage.setItem("isLoggedIn", "true");
                toast.success(response.message || "Registration successful!");
                return { success: true, data: response.data };
            }
        } catch (error) {
            const message = error.message || "Registration failed";
            toast.error(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    // Logout function - calls backend API
    const logout = async () => {
        setLoading(true);
        try {
            await authAPI.logout();
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            toast.success("Logged out successfully!");
        } catch (error) {
            // Even if API fails, clear local state
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            toast.error("Logout failed, but cleared local session");
        } finally {
            setLoading(false);
        }
    };

    // Update user data in context (for profile updates, etc.)
    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    // Refresh user data from backend (useful after bookmark/unbookmark operations)
    const refreshUser = async () => {
        console.log('🔄 refreshUser called');
        try {
            console.log('📡 Calling getCurrentUser API...');
            const response = await authAPI.getCurrentUser();
            console.log('✅ API response:', response);
            if (response.success) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
                console.log('💾 User data updated, bookmarks:', response.data.bookmarks?.length);
                return response.data;
            }
        } catch (error) {
            console.error("❌ Failed to refresh user data:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, refreshUser, loading, initialized }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
