// src/Components/PostCard.jsx
import React from "react";
import moment from "moment";

const Tag = ({ children }) => (
    <span className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-gray-200 mr-2">
        {children}
    </span>
);

const PostCard = ({ post, author, onOpen }) => {
    return (
        <article className="bg-white/4 hover:bg-white/6 transition rounded-2xl overflow-hidden shadow-sm">
            <div className="relative">
                <img
                    src={post.cover}
                    alt={post.title}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
            </div>

            <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                    <img
                        src={author?.profilePic || "/placeholder-profile.png"}
                        alt={author?.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-teal-400"
                        loading="lazy"
                    />
                    <div>
                        <div className="text-sm font-semibold text-white/95">{author?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-300">{moment(post.createdAt).fromNow()}</div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold text-white/95">{post.title}</h3>
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">{post.excerpt}</p>

                <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center">
                        {post.tags?.slice(0, 3).map((t) => (
                            <Tag key={t}>{t}</Tag>
                        ))}
                    </div>

                    <div className="text-sm text-gray-300 flex items-center gap-3">
                        <div>{post.likes} ♥</div>
                        <div>{post.commentsCount} 💬</div>
                        <button
                            onClick={() => onOpen(post._id)}
                            className="ml-3 px-3 py-1 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-sm"
                        >
                            Read
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default PostCard;
