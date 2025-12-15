// src/components/AddJobButton.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AddJobModal from "./AddJobModal";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AddJobButton = ({ onCreate }) => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const click = () => {
        if (!user) {
            toast("Please login as a recruiter to post jobs.", { icon: "🔒" });
            navigate("/login");
            return;
        }
        if (user.role !== "recruiter") {
            // For candidate: hide button entirely in Jobs page per your request.
            // But if UI ever shows it, better to show message.
            toast.error("Only recruiters can post jobs.");
            return;
        }
        setOpen(true);
    };

    // defaultCompany: prefill company if recruiter user has company field
    const defaultCompany = user?.company || "";

    return (
        <>
            <button onClick={click} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md">
                Add Job
            </button>

            {open && <AddJobModal defaultCompany={defaultCompany} onClose={() => setOpen(false)} onCreate={onCreate} />}
        </>
    );
};

export default AddJobButton;
