// src/Components/EditJobModal.jsx
import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { jobAPI } from "../utils/api";

const EditJobModal = ({ job, onClose, onSave }) => {
    const [form, setForm] = useState({
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        jobTime: job.jobTime || "full-time",
        salaryMin: job.salaryMin || "",
        salaryMax: job.salaryMax || "",
        companyWebsite: job.companyWebsite || "",
        responsibilities: job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : [""],
        skills: job.skills && job.skills.length > 0 ? job.skills : [""],
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

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

    const handleSave = async () => {
        const filteredResponsibilities = form.responsibilities.filter(r => r.trim());
        const filteredSkills = form.skills.filter(s => s.trim());

        if (!form.title || !form.company) {
            toast.error("Title and company are required");
            return;
        }

        if (filteredResponsibilities.length === 0) {
            toast.error("At least one responsibility is required");
            return;
        }

        if (filteredSkills.length === 0) {
            toast.error("At least one skill is required");
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

        setSaving(true);

        try {
            const response = await jobAPI.editJob(job._id, {
                ...form,
                responsibilities: filteredResponsibilities,
                skills: filteredSkills
            });
            if (response.success) {
                onSave(response.data);
                toast.success("Job updated successfully");
                onClose();
            }
        } catch (error) {
            console.error("Error updating job:", error);
            toast.error(error.message || "Failed to update job");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6 my-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Edit Job</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                        <X />
                    </button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                        <input
                            value={form.title}
                            onChange={handleChange("title")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                        <input
                            value={form.company}
                            onChange={handleChange("company")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Company Website */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Website (Optional)</label>
                        <input
                            value={form.companyWebsite}
                            onChange={handleChange("companyWebsite")}
                            placeholder="https://example.com"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                    {form.responsibilities.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('responsibilities', index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
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
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    />
                                    {form.skills.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeArrayItem('skills', index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
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

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                        <input
                            value={form.location}
                            onChange={handleChange("location")}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div>

                    {/* Salary Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range (Optional)</label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                value={form.salaryMin}
                                onChange={handleChange("salaryMin")}
                                placeholder="Min (LPA)"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <input
                                type="number"
                                value={form.salaryMax}
                                onChange={handleChange("salaryMax")}
                                placeholder="Max (LPA)"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Will display as "₹Min - ₹Max LPA"</p>
                    </div>

                    {/* Job Type & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <select
                                value={form.type}
                                onChange={handleChange("type")}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                onChange={handleChange("jobTime")}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditJobModal;
