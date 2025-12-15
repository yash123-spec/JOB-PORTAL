// src/App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import ProtectedRoute from "./Components/ProtectedRoute";

// Pages
import Home from "./Pages/Home";
import Jobs from "./Pages/Jobs";
import JobDetails from "./Pages/JobDetails";
import AboutUs from "./Pages/AboutUs";
import ContactUs from "./Pages/ContactUs";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Profile from "./Pages/Profile";
import MyApplications from "./Pages/MyApplications";
import Bookmarked from "./Pages/Bookmarked";
import Notifications from "./Pages/Notifications";
import Messages from "./Pages/Messages";
import Error from "./Pages/Error";
import RecruiterDashboard from "./Pages/RecruiterDashboard";
import AdminDashboard from "./Pages/AdminDashboard";

// Modal (example) - import when you create it
import PostModal from "./Components/PostModal"; // <-- optional: modal for feed posts

const App = () => {
  const location = useLocation();
  // when navigating with `navigate('/posts/1', { state: { background: location } })`
  // the modal route can render on top while the Routes below render the 'background' location.
  const background = location.state && location.state.background;

  // Use background pathname when deciding whether to show navbar so navbar remains visible
  const currentPathForNav = background?.pathname || location.pathname;
  const hideNavbarRoutes = ["/login", "/register"];
  const showNavbar = !hideNavbarRoutes.includes(currentPathForNav);

  return (
    <>
      {showNavbar && <Navbar />}

      {/* Primary routes render either the current location OR the background location (if modal open) */}
      <Routes location={background || location}>
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

        {/* Admin - Protected */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        {/* Example modal route as a "normal" route too (renders full page when visited directly) */}
        <Route path="/posts/:postId" element={<ProtectedRoute><PostModal /></ProtectedRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={<Error />} />
      </Routes>

      {/* If background exists, render the modal route on top (overlay). 
          This will run only when navigate(..., { state: { background: location } }) was used. */}
      {background && (
        <Routes>
          <Route path="/posts/:postId" element={<ProtectedRoute><PostModal isOverlay={true} /></ProtectedRoute>} />
        </Routes>
      )}
    </>
  );
};

export default App;
