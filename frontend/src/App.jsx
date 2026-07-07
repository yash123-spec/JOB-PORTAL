// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/layout/Navbar";
import ScrollToTop from "./Components/layout/ScrollToTop";
import ProtectedRoute from "./Components/auth/ProtectedRoute";

// Pages are lazy-loaded: each page's code is only downloaded when the user
// actually navigates to it, keeping the initial bundle small and fast.
const Home = lazy(() => import("./Pages/Home"));
const Jobs = lazy(() => import("./Pages/Jobs"));
const JobDetails = lazy(() => import("./Pages/JobDetails"));
const AboutUs = lazy(() => import("./Pages/AboutUs"));
const ContactUs = lazy(() => import("./Pages/ContactUs"));
const Login = lazy(() => import("./Pages/Login"));
const Register = lazy(() => import("./Pages/Register"));
const Profile = lazy(() => import("./Pages/Profile"));
const MyApplications = lazy(() => import("./Pages/MyApplications"));
const Bookmarked = lazy(() => import("./Pages/Bookmarked"));
const Notifications = lazy(() => import("./Pages/Notifications"));
const Messages = lazy(() => import("./Pages/Messages"));
const Error = lazy(() => import("./Pages/Error"));
const RecruiterDashboard = lazy(() => import("./Pages/RecruiterDashboard"));

// Lightweight fallback shown while a page's chunk is being fetched
const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
  </div>
);

const App = () => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/register"];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      {showNavbar && <Navbar />}

      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Home + Static Pages - Protected */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><AboutUs /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />

        {/* Jobs Section - Protected */}
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />

        {/* Auth & Profile */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Candidate Utility Pages - Protected */}
        <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
        <Route path="/bookmarked" element={<ProtectedRoute><Bookmarked /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        {/* Recruiter - Protected */}
        <Route path="/recruiter-dashboard" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={<Error />} />
      </Routes>
      </Suspense>
    </>
  );
};

export default App;
