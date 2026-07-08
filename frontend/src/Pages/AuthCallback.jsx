import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
    const [params] = useSearchParams();
    const { setTokenAndUser, user } = useAuth();
    const navigate = useNavigate();
    const hasProcessed = useRef(false);

    // Step 2: once user state is actually set in context, navigate
    useEffect(() => {
        if (user && hasProcessed.current) {
            navigate("/jobs", { replace: true });
        }
    }, [user]);

    // Step 1: pull token from URL and store it (triggers setUser internally)
    useEffect(() => {
        const token = params.get("token");
        const refresh = params.get("refresh");

        if (token) {
            hasProcessed.current = true;
            setTokenAndUser(token, refresh);
        } else {
            navigate("/login", { replace: true });
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500" />
        </div>
    );
};

export default AuthCallback;