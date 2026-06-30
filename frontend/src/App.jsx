// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/layout/Navbar";
import ProtectedRoute from "./Components/auth/ProtectedRoute";

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

const App = () => {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/register"];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}

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
    </>
  );
};

export default App;
