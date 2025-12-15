import React from 'react';
import { Apple } from 'lucide-react';

const AppleLoginButton = () => {
    const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL || 'http://localhost:8000';

    const handleAppleLogin = () => {
        // Redirect to backend Apple OAuth route
        window.location.href = `${API_BASE}/api/auth/apple`;
    };

    return (
        <button
            onClick={handleAppleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors group"
        >
            <Apple className="w-5 h-5" />
            <span className="font-medium">Continue with Apple</span>
        </button>
    );
};

export default AppleLoginButton;
