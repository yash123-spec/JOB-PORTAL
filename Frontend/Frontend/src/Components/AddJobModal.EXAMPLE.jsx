// src/Components/AddJobModal.jsx - EXAMPLE WITH REAL API INTEGRATION
// This shows how to update AddJobModal to create jobs via backend API

import React, { useState } from "react";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api"; // <-- Import API utility

const initial = {
    title: "",
    company: "",
    description: "",
    jobTime: "full-time",
    salaryRange: "",
    location: "",
    type: "on-site",
};

const AddJobModal = ({ defaultCompany = "", onClose, onCreate }) => {
    const [form, setForm] = useState({ ...initial, company: defaultCompany });
    const [loading, setLoading] = useState(false);

    const update = (key) => (e) =>
        setForm((s) => ({ ...s, [key]: e.target.value }));

    const handleSubmit = async () => {
        // Validate required fields
        if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
            toast.error("Please fill title, company and description.");
            return;
        }

        setLoading(true);
        try {
            // Call real backend API to create job
            const response = await jobAPI.createJob({
                title: form.title,
                company: form.company,
                description: form.description,
                type: form.type, // on-site/hybrid/remote
                salary: form.salaryRange || "Not specified",
                location: form.location || "Not specified",
                // Add any other fields your backend expects
                // jobTime: form.jobTime, // if backend supports this field
            });

            if (response.success) {
                toast.success("Job created successfully!");
                onCreate(response.data); // Pass created job to parent
                onClose();
            }
        } catch (error) {
            console.error("Create job error:", error);
            toast.error(error.message || "Failed to create job");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl p-6 text-slate-900">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Create Job</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-3">
                    <input
                        value={form.title}
                        onChange={update("title")}
                        placeholder="Job title (e.g. Senior React Developer)"
                        className="w-full p-3 border rounded focus:outline-none focus:border-teal-500"
                    />

                    <input
                        value={form.company}
                        onChange={update("company")}
                        placeholder="Company name"
                        className="w-full p-3 border rounded focus:outline-none focus:border-teal-500"
                    />

                    <textarea
                        value={form.description}
                        onChange={update("description")}
                        placeholder="Job description (responsibilities, requirements, etc.)"
                        rows={5}
                        className="w-full p-3 border rounded focus:outline-none focus:border-teal-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">Work Type</label>
                            <select
                                value={form.type}
                                onChange={update("type")}
                                className="w-full p-2 border rounded focus:outline-none focus:border-teal-500"
                            >
                                <option value="on-site">On-site</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="remote">Remote</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">Job Time</label>
                            <select
                                value={form.jobTime}
                                onChange={update("jobTime")}
                                className="w-full p-2 border rounded focus:outline-none focus:border-teal-500"
                            >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                    </div>

                    <input
                        value={form.location}
                        onChange={update("location")}
                        placeholder="Location (e.g. Bangalore, India)"
                        className="w-full p-3 border rounded focus:outline-none focus:border-teal-500"
                    />

                    <input
                        value={form.salaryRange}
                        onChange={update("salaryRange")}
                        placeholder="Salary range (e.g. ₹6 - ₹10 LPA or $80k - $120k)"
                        className="w-full p-3 border rounded focus:outline-none focus:border-teal-500"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded border hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60 transition"
                    >
                        {loading ? "Creating..." : "Create Job"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddJobModal;

/* 
CHANGES MADE FROM ORIGINAL:
1. Imported jobAPI from utils/api
2. Updated handleSubmit to call jobAPI.createJob() instead of simulating
3. Proper error handling with try-catch
4. Better field validation
5. Enhanced UI with labels and better placeholders
6. Improved button states during loading

TO USE IN YOUR ACTUAL AddJobModal.jsx:
1. Copy the handleSubmit function
2. Add the jobAPI import at the top
3. Make sure the field names match your backend Job model
4. You may need to adjust the data structure based on your backend schema
*/
