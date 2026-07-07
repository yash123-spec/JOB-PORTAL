import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home, Briefcase } from "lucide-react";

const Error = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-mint to-white px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-light text-brand">
                <Compass size={38} />
            </div>

            <h1 className="mt-6 font-display text-7xl font-bold text-ink">404</h1>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Page not found</h2>
            <p className="mt-2 max-w-md text-gray-500">
                The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                    <Home size={16} /> Go Home
                </Link>
                <Link
                    to="/jobs"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-brand hover:text-brand"
                >
                    <Briefcase size={16} /> Browse Jobs
                </Link>
            </div>
        </div>
    );
};

export default Error;
