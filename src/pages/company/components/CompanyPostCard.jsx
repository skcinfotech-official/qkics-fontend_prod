import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaBuilding } from "react-icons/fa";
import { HiTrash, HiPencilAlt, HiDotsHorizontal } from "react-icons/hi";
import { resolveMedia } from "../../../components/utils/mediaUrl";
import useClickOutside from "../../../components/hooks/useClickOutside";

const timeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };
    for (let unit in intervals) {
        const val = Math.floor(seconds / intervals[unit]);
        if (val >= 1) return `${val} ${unit}${val > 1 ? 's' : ''} ago`;
    }
    return "just now";
};

export default function CompanyPostCard({ post, onDelete, onEdit, isOwner }) {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);

    useClickOutside(optionsRef, () => setShowOptions(false));

    const media = post.media || (post.image ? [{ file: post.image, media_type: "image" }] : []);

    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-card animate-fadeIn">
            <header className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                    <Link
                        to={`/company/${post.company?.slug}`}
                        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted transition-transform hover:scale-105"
                    >
                        {post.company?.logo ? (
                            <img src={resolveMedia(post.company.logo)} alt="Company Logo" className="h-full w-full object-cover" />
                        ) : (
                            <FaBuilding className="text-primary" size={18} />
                        )}
                    </Link>
                    <div>
                        <Link
                            to={`/company/${post.company?.slug}`}
                            className="text-sm font-bold text-foreground transition-colors hover:text-primary"
                        >
                            {post.company?.name || "Organisation Insight"}
                        </Link>
                        <p className="text-2xs font-medium text-muted-foreground">{timeAgo(post.created_at)}</p>
                    </div>
                </div>

                {isOwner && (
                    <div className="relative" ref={optionsRef}>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${showOptions
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                        >
                            <HiDotsHorizontal size={18} />
                        </button>

                        {showOptions && (
                            <div className="absolute right-0 z-40 mt-2 w-40 origin-top-right animate-pop rounded-xl border border-border bg-card p-1.5 shadow-xl">
                                <button
                                    onClick={() => {
                                        onEdit?.(post);
                                        setShowOptions(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-2xs font-bold uppercase tracking-wide text-foreground transition-all hover:bg-muted"
                                >
                                    <HiPencilAlt size={16} className="text-primary" />
                                    Edit Post
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete?.(post.id);
                                        setShowOptions(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-2xs font-bold uppercase tracking-wide text-danger transition-all hover:bg-danger/10"
                                >
                                    <HiTrash size={16} />
                                    Delete Post
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Content Section */}
            <div className="px-5 pb-5">
                {post.title && (
                    <h2 className="mb-1 text-base font-bold leading-tight tracking-tight text-foreground">
                        {post.title}
                    </h2>
                )}

                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground/80">
                    {post.content}
                </p>

                {/* Media Gallery */}
                {media.length > 0 && (
                    <div className="group relative mt-4 flex max-h-[500px] min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-muted">
                        {media.length > 1 && (
                            <div className="absolute right-4 top-4 z-30 rounded-full bg-black/60 px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-white backdrop-blur-md">
                                {currentMediaIndex + 1} / {media.length}
                            </div>
                        )}

                        <div className="relative flex h-full w-full items-center justify-center">
                            {media[currentMediaIndex].media_type === "video" ? (
                                <video
                                    src={media[currentMediaIndex].file}
                                    controls
                                    className="relative z-10 block h-full max-h-[500px] w-full bg-black object-contain"
                                />
                            ) : (
                                <img
                                    src={media[currentMediaIndex].file}
                                    alt="Post visual"
                                    className="relative z-10 block h-full max-h-[500px] w-full object-contain"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {media.length > 1 && (
                            <>
                                {currentMediaIndex > 0 && (
                                    <button
                                        onClick={() => setCurrentMediaIndex(prev => prev - 1)}
                                        className="absolute left-3 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground opacity-0 shadow-lg transition-all hover:scale-110 group-hover:opacity-100"
                                    >
                                        <FaChevronLeft size={12} />
                                    </button>
                                )}
                                {currentMediaIndex < media.length - 1 && (
                                    <button
                                        onClick={() => setCurrentMediaIndex(prev => prev + 1)}
                                        className="absolute right-3 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground opacity-0 shadow-lg transition-all hover:scale-110 group-hover:opacity-100"
                                    >
                                        <FaChevronRight size={12} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}
