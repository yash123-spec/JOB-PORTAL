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
            // No token = not logged in, skip API call entirely
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setInitialized(true);
                return;
            }

            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                const response = await authAPI.getCurrentUser();
                if (response.success) {
                    setUser(response.data);
                    localStorage.setItem("user", JSON.stringify(response.data));
                    localStorage.setItem("isLoggedIn", "true");
                }
            } catch (error) {
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
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
                const { accessToken, refreshToken, user } = response.data;
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("isLoggedIn", "true");
                setUser(user);
                toast.success(response.message || "Successfully logged in!");
                return { success: true };
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
            const response = await authAPI.recruiterRegister(userData); // renamed
            if (response.success) {
                // ✅ No setUser() — they are NOT logged in yet
                // ✅ No localStorage — no session exists
                // ✅ No token — backend doesn't send one
                toast.success(response.message || "Registration successful! Pending admin approval.");
                return { success: true }; // Register page will redirect to /login
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
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            toast.success("Logged out successfully!");
        } catch (error) {
            // Even if API fails, clear local state
            setUser(null);
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
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
        try {
            const response = await authAPI.getCurrentUser();
            if (response.success) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
                return response.data;
            }
        } catch (error) {
            console.error("Failed to refresh user data:", error);
        }
    };

    // ADD this new function before the return
    const setTokenAndUser = async (token, refresh) => {
        localStorage.setItem("accessToken", token);
        if (refresh) localStorage.setItem("refreshToken", refresh);
        try {
            const response = await authAPI.getCurrentUser();
            if (response.success) {
                setUser(response.data);
                localStorage.setItem("user", JSON.stringify(response.data));
                localStorage.setItem("isLoggedIn", "true");
            }
        } catch (error) {
            console.error("Failed to fetch user after OAuth:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, refreshUser, setTokenAndUser, loading, initialized }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
