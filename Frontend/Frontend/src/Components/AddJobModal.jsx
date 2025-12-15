// src/components/AddJobModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";
import { X, Plus } from "lucide-react";

const initial = {
    title: "",
    company: "",
    responsibilities: [""],
    skills: [""],
    jobTime: "full-time",
    salaryMin: "",
    salaryMax: "",
    location: "",
    type: "on-site",
    companyWebsite: "",
};

const AddJobModal = ({ defaultCompany = "", onClose, onCreate }) => {
    const [form, setForm] = useState({ ...initial, company: defaultCompany });
    const [loading, setLoading] = useState(false);

    const update = (key) => (e) =>
        setForm((s) => ({ ...s, [key]: e.target.value }));

    const updateArrayItem = (arrayKey, index, value) => {
        setForm(s => ({
            ...s,
            [arrayKey]: s[arrayKey].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayItem = (arrayKey) => {
        setForm(s => ({
            ...s,
            [arrayKey]: [...s[arrayKey], ""]
        }));
    };

    const removeArrayItem = (arrayKey, index) => {
        if (form[arrayKey].length <= 1) {
            toast.error(`At least one ${arrayKey === 'responsibilities' ? 'responsibility' : 'skill'} is required`);
            return;
        }
        setForm(s => ({
            ...s,
            [arrayKey]: s[arrayKey].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        // Filter out empty responsibilities and skills
        const filteredResponsibilities = form.responsibilities.filter(r => r.trim());
        const filteredSkills = form.skills.filter(s => s.trim());

        if (!form.title.trim() || !form.company.trim()) {
            toast.error("Please fill title and company.");
            return;
        }

        if (filteredResponsibilities.length === 0) {
            toast.error("At least one responsibility is required.");
            return;
        }

        if (filteredSkills.length === 0) {
            toast.error("At least one skill is required.");
            return;
        }

        // Validate salary if provided
        if (form.salaryMin && form.salaryMax) {
            const min = Number(form.salaryMin);
            const max = Number(form.salaryMax);
            if (min >= max) {
                toast.error("Minimum salary must be less than maximum salary");
                return;
            }
        }

        setLoading(true);
        try {
            const response = await jobAPI.createJob({
                ...form,
                responsibilities: filteredResponsibilities,
                skills: filteredSkills
            });

            if (response.success) {
                toast.success("Job posted successfully!");
                onCreate && onCreate(response.data);
                onClose();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Could not create job.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-3xl p-6 text-slate-900 my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Create Job</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                        <input
                            value={form.title}
                            onChange={update("title")}
                            placeholder="e.g., Senior Software Engineer"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                        <input
                            value={form.company}
                            onChange={update("company")}
                            placeholder="Company name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Company Website */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Website (Optional)</label>
                        <input
                            value={form.companyWebsite}
                            onChange={update("companyWebsite")}
                            placeholder="https://example.com"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Responsibilities */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key Responsibilities *</label>
                        <div className="space-y-2">
                            {form.responsibilities.map((resp, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        value={resp}
                                        onChange={(e) => updateArrayItem('responsibilities', index, e.target.value)}
                                        placeholder={index === 0 ? "Main job description..." : `Responsibility ${index + 1}`}
                                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                    {form.responsibilities.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('responsibilities', index)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addArrayItem('responsibilities')}
                                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                            >
                                <Plus size={16} />
                                Add Responsibility
                            </button>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills *</label>
                        <div className="space-y-2">
                            {form.skills.map((skill, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        value={skill}
                                        onChange={(e) => updateArrayItem('skills', index, e.target.value)}
                                        placeholder={`Skill ${index + 1}`}
                                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                    {form.skills.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('skills', index)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => addArrayItem('skills')}
                                className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                            >
                                <Plus size={16} />
                                Add Skill
                            </button>
                        </div>
                    </div>

                    {/* Job Type & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                            <select
                                value={form.type}
                                onChange={update("type")}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="on-site">On-site</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="remote">Remote</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Time *</label>
                            <select
                                value={form.jobTime}
                                onChange={update("jobTime")}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                        <input
                            value={form.location}
                            onChange={update("location")}
                            placeholder="e.g., Mumbai, India"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Salary Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range (Optional)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                value={form.salaryMin}
                                onChange={update("salaryMin")}
                                placeholder="Min (LPA)"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <input
                                type="number"
                                value={form.salaryMax}
                                onChange={update("salaryMax")}
                                placeholder="Max (LPA)"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Will display as "₹Min - ₹Max LPA"</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Creating..." : "Create Job"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddJobModal;
