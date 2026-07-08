import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback = () => {
    const [params] = useSearchParams();
    const { setTokenAndUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = params.get("token");
        const refresh = params.get("refresh");

        if (token) {
            setTokenAndUser(token, refresh).then(() => {
                navigate("/jobs", { replace: true });
            });
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