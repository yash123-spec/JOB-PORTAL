// src/Components/PostModal.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import moment from "moment";
import { posts } from "../assets/FeedDummy";
import { users } from "../assets/dummy.js";
import { X } from "lucide-react";

/**
 * Props:
 * - post (optional) : if provided, modal renders immediately
 * - otherwise will fetch post by :postId param (future: real API)
 *
 * Close behavior:
 * - if location.state?.background exists -> navigate(-1)
 * - otherwise -> navigate('/feed')
 */

const PostModal = ({ post: initialPost }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { postId } = useParams();
    const [post, setPost] = useState(initialPost || null);
    const [author, setAuthor] = useState(null);

    useEffect(() => {
        // load post if not passed
        if (!initialPost) {
            const id = postId;
            const p = posts.find((x) => x._id === id);
            setPost(p || null);
        }
    }, [initialPost, postId]);

    useEffect(() => {
        if (post) {
            const a = users.find((u) => u._id === post.authorId);
            setAuthor(a || null);
        }
    }, [post]);

    const handleClose = () => {
        if (location.state && location.state.background) {
            navigate(-1);
        } else {
            navigate("/feed");
        }
    };

    if (!post) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white rounded-lg p-8 max-w-lg text-center">
                    <div className="text-gray-700">Post not found</div>
                    <button onClick={handleClose} className="mt-4 px-4 py-2 bg-teal-500 text-white rounded">
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60"
                onClick={handleClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-3xl bg-[#071022] text-white rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="relative">
                    <img src={post.cover} alt={post.title} className="w-full h-56 object-cover" />
                    <button
                        onClick={handleClose}
                        className="absolute right-3 top-3 bg-white/10 rounded-full p-2 hover:bg-white/20"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-4">
                        <img src={author?.profilePic || "/placeholder-profile.png"} alt={author?.name} className="w-12 h-12 rounded-full object-cover border-2 border-teal-400" />
                        <div>
                            <div className="font-semibold text-lg">{author?.name || "Unknown"}</div>
                            <div className="text-xs text-gray-300">{moment(post.createdAt).format("LLL")}</div>
                        </div>
                        <div className="ml-auto text-sm text-gray-300">{post.likes} likes • {post.commentsCount} comments</div>
                    </div>

                    <h2 className="text-2xl font-bold mt-4">{post.title}</h2>

                    <p className="text-gray-300 mt-4 whitespace-pre-line">{post.content}</p>

                    <div className="mt-6 flex items-center gap-3">
                        <button className="px-4 py-2 bg-teal-500 rounded-md">Like</button>
                        <button className="px-4 py-2 border rounded-md">Comment</button>
                        <button className="px-4 py-2 border rounded-md">Save</button>
                    </div>

                    {/* dummy comments preview */}
                    <div className="mt-6">
                        <h4 className="text-sm text-gray-300 font-semibold mb-2">Comments</h4>
                        <div className="space-y-3 text-sm">
                            <div className="bg-white/4 p-3 rounded">
                                <div className="text-sm font-semibold">A user</div>
                                <div className="text-gray-300">Nice article — thanks for sharing!</div>
                            </div>
                            <div className="bg-white/4 p-3 rounded">
                                <div className="text-sm font-semibold">Another user</div>
                                <div className="text-gray-300">Great tips.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostModal;
