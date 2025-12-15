// src/Pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Briefcase, DollarSign, Calendar, ArrowRight, Building2, Code, Megaphone, PenTool, Users, BarChart } from "lucide-react";
import { jobAPI } from "../utils/api";
import moment from "moment";
import toast from "react-hot-toast";

const Home = () => {
    const navigate = useNavigate();
    const [recentJobs, setRecentJobs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch recent jobs on component mount
    useEffect(() => {
        fetchRecentJobs();
    }, []);

    const fetchRecentJobs = async () => {
        setLoading(true);
        try {
            const response = await jobAPI.getAllJobs({ limit: 6 });
            if (response.success) {
                setRecentJobs(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (searchLocation) params.append("location", searchLocation);
        navigate(`/jobs?${params.toString()}`);
    };

    const getCompanyInitial = (company) => {
        return company ? company.charAt(0).toUpperCase() : 'C';
    };

    const categories = [
        { name: "Development", icon: Code, count: "120+", color: "from-blue-400 to-blue-600" },
        { name: "Design", icon: PenTool, count: "80+", color: "from-purple-400 to-purple-600" },
        { name: "Marketing", icon: Megaphone, count: "95+", color: "from-pink-400 to-pink-600" },
        { name: "Business", icon: Briefcase, count: "110+", color: "from-green-400 to-green-600" },
        { name: "Human Resource", icon: Users, count: "75+", color: "from-yellow-400 to-yellow-600" },
        { name: "Finance", icon: BarChart, count: "60+", color: "from-teal-400 to-teal-600" },
    ];

    const handleCategoryClick = (category) => {
        navigate(`/jobs?search=${category}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Find Your Dream Job Today!
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Explore thousands of job opportunities with all the information you need.
                    </p>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-2 flex flex-col md:flex-row gap-2">
                        <div className="flex-1 flex items-center gap-3 px-4">
                            <Search className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Job title, keywords, or company"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-3 outline-none text-gray-700"
                            />
                        </div>
                        <div className="flex-1 flex items-center gap-3 px-4 border-l border-gray-200">
                            <MapPin className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Location"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                className="w-full py-3 outline-none text-gray-700"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-md font-semibold transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </section>

            {/* Recent Jobs Available */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Recent Jobs Available</h2>
                        <p className="text-gray-600 mt-2">Explore the latest job opportunities</p>
                    </div>
                    <button
                        onClick={() => navigate("/jobs")}
                        className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-2"
                    >
                        View All <ArrowRight size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentJobs.map((job) => (
                            <div
                                key={job._id}
                                className="bg-white rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 cursor-pointer"
                                onClick={() => navigate(`/jobs/${job._id}`)}
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                        {getCompanyInitial(job.company)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                                        <p className="text-sm text-gray-600">{job.company}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-gray-400" />
                                        <span className="capitalize">{job.jobTime || 'Full Time'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="capitalize">{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={14} className="text-gray-400" />
                                        <span>{job.salaryRange || 'Not disclosed'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {moment(job.createdAt).fromNow()}
                                    </span>
                                    <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Browse by Category */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
                        <p className="text-gray-600 mt-2">Find the job that fits your skills and interests</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category, index) => {
                            const IconComponent = category.icon;
                            return (
                                <div
                                    key={index}
                                    onClick={() => handleCategoryClick(category.name)}
                                    className="bg-gray-50 hover:bg-gray-100 rounded-lg p-6 text-center cursor-pointer transition-all duration-200 border border-gray-200 hover:shadow-md group"
                                >
                                    <div className={`w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <IconComponent className="text-white" size={24} />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                                    <p className="text-xs text-gray-600">{category.count} Jobs</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-br from-teal-500 to-blue-600">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Start Your Career Journey Today!
                    </h2>
                    <p className="text-lg mb-8 text-teal-50">
                        Join thousands of professionals who found their dream job through our platform
                    </p>
                    <button
                        onClick={() => navigate("/jobs")}
                        className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                    >
                        Explore Jobs <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* News and Blog Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">News and Blog</h2>
                        <p className="text-gray-600 mt-2">Stay updated with the latest career insights and industry trends</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Blog Card 1 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                <Building2 className="text-white" size={64} />
                            </div>
                            <div className="p-6">
                                <span className="text-xs text-teal-600 font-semibold uppercase">Career Tips</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                                    10 Tips for a Successful Job Interview
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Master the art of interviewing with these proven strategies that will help you land your dream job.
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>5 min read</span>
                                    <span>Nov 15, 2025</span>
                                </div>
                            </div>
                        </div>

                        {/* Blog Card 2 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center">
                                <Code className="text-white" size={64} />
                            </div>
                            <div className="p-6">
                                <span className="text-xs text-teal-600 font-semibold uppercase">Industry Insights</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                                    Tech Industry Trends in 2025
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Discover the hottest tech skills employers are looking for and how to stay ahead of the curve.
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>7 min read</span>
                                    <span>Nov 12, 2025</span>
                                </div>
                            </div>
                        </div>

                        {/* Blog Card 3 */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                                <Users className="text-white" size={64} />
                            </div>
                            <div className="p-6">
                                <span className="text-xs text-teal-600 font-semibold uppercase">Resume Guide</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3">
                                    How to Write a Standout Resume
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Learn how to craft a compelling resume that gets noticed by recruiters and hiring managers.
                                </p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>6 min read</span>
                                    <span>Nov 10, 2025</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-8 md:p-12 text-white text-center">
                        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
                        <p className="text-teal-50 mb-8 max-w-2xl mx-auto">
                            Get the latest job opportunities, career tips, and industry insights delivered straight to your inbox every week.
                        </p>
                        <div className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 px-6 py-3 rounded-lg text-gray-900 outline-none"
                            />
                            <button className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
                                Subscribe
                            </button>
                        </div>
                        <p className="text-xs text-teal-100 mt-4">
                            We respect your privacy. Unsubscribe at any time.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div>
                            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                                <Briefcase className="text-teal-400" />
                                First Choice
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Your trusted platform for finding the perfect job and advancing your career.
                            </p>
                            <div className="flex gap-3">
                                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-teal-600 rounded-full flex items-center justify-center transition-colors">
                                    <span className="text-sm">f</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-teal-600 rounded-full flex items-center justify-center transition-colors">
                                    <span className="text-sm">𝕏</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-teal-600 rounded-full flex items-center justify-center transition-colors">
                                    <span className="text-sm">in</span>
                                </a>
                            </div>
                        </div>

                        {/* For Candidates */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">For Candidates</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-400">Browse Jobs</li>
                                <li className="text-gray-400">My Applications</li>
                                <li className="text-gray-400">Saved Jobs</li>
                                <li className="text-gray-400">My Profile</li>
                            </ul>
                        </div>

                        {/* For Employers */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">For Employers</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="text-gray-400">Post a Job</li>
                                <li className="text-gray-400">Manage Jobs</li>
                                <li className="text-gray-400">Browse Candidates</li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/about" className="hover:text-teal-400 transition-colors">About Us</a></li>
                                <li><a href="/contact" className="hover:text-teal-400 transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                        <p>&copy; 2025 First Choice. All rights reserved.</p>
                        <p>Made with ❤️ for job seekers worldwide</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
