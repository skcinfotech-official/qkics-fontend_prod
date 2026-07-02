import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaEllipsisH, FaChevronLeft, FaChevronRight, FaCrown, FaRegComments } from "react-icons/fa";
import { HiPencilAlt, HiTrash } from "react-icons/hi";
import UserBadge from "../ui/UserBadge";
import { useAlert } from "../../context/AlertContext";
import useClickOutside from "../hooks/useClickOutside";
import { resolveAvatar } from "../utils/mediaUrl";

const timeAgo = (dateString) => {
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
        if (val >= 1) {
            return `${val} ${unit}${val > 1 ? 's' : ''} ago`;
        }
    }
    return "just now";
};

export default function PostCard({
    post,
    loggedUser,
    onLike,
    onDelete,
    onEdit,
    onCommentClick,
    onTagClick,
    onImageClick,
    onProfileClick,
}) {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const picVersion = useSelector((state) => state.user.picVersion || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useClickOutside(menuRef, () => setMenuOpen(false));
    const [expanded, setExpanded] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const isLocked = post.is_locked === true;
    const fullContent = post.content || "";
    const previewLength = post.preview_length || 300;

    // Determine if content exceeds preview length
    // OR if it's locked and long enough to warrant a "Read More" before showing the gate
    const isLongContent = fullContent.length > previewLength || (isLocked && fullContent.length > 150);

    // What text to actually display
    const displayText = expanded
        ? fullContent
        : (isLongContent ? fullContent.slice(0, previewLength) + "..." : fullContent);

    // Gated message triggers if locked and expanded
    const isGated = expanded && isLocked;
    // More robust isOwnPost check
    const isOwnPost = loggedUser && (
        (loggedUser.id && post.author?.id && loggedUser.id == post.author.id) ||
        (loggedUser.uuid && post.author?.uuid && loggedUser.uuid === post.author.uuid) ||
        (loggedUser.username && post.author?.username && loggedUser.username === post.author.username)
    );

    return (
        <article className="premium-card overflow-hidden bg-card text-foreground animate-fadeIn">
            {/* HEADER */}
            <header className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="h-12 w-12 rounded-xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all"
                        onClick={() => onProfileClick?.(post.author)}
                    >
                        <img
                            src={(() => {
                                const pic = isOwnPost
                                    ? loggedUser?.profile_picture
                                    : post.author?.profile_picture;
                                const base = resolveAvatar(pic, post.author?.username || "O");
                                return pic ? `${base}?v=${picVersion}` : base;
                            })()}
                            className="h-full w-full object-cover"
                            alt="profile"
                            loading="lazy"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span
                                className="font-bold text-sm cursor-pointer hover:text-primary transition-colors"
                                onClick={() => onProfileClick?.(post.author)}
                            >
                                {post.author?.first_name || post.author?.last_name
                                    ? `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim()
                                    : post.author?.username}
                            </span>
                            <UserBadge userType={post.author?.user_type} />
                            {post.author?.is_subscribed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/10 shadow-sm shadow-amber-500/5">
                                    <FaCrown size={10} className="text-amber-600" /> Premium
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-2xs font-bold tracking-wider">
                            <span>{timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* MENU */}
                {loggedUser && loggedUser.id === post.author?.id && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted hover:bg-primary hover:text-white transition-all"
                        >
                            <FaEllipsisH size={14} />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-3 w-40 rounded-xl shadow-2xl border border-border p-1 animate-pop z-20 bg-card">
                                <button
                                    onClick={() => { setMenuOpen(false); onEdit?.(post); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                                >
                                    <HiPencilAlt size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => { setMenuOpen(false); onDelete?.(post.id); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-danger/10 text-danger text-sm font-medium transition-colors"
                                >
                                    <HiTrash size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* CONTENT */}
            <div className="px-6 pb-6">
                {post.title && (
                    <h2 className="text-lg font-bold mb-1 leading-tight tracking-tight">
                        {post.title}
                    </h2>
                )}

                <div className="relative">
                    <p className="text-sm leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                        {displayText}
                    </p>

                    {/* READ MORE — show ONLY when there's more content to reveal from the current field */}
                    {isLongContent && !expanded && (
                        <div className="mt-2 text-sm">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLocked) {
                                        showAlert("Please subscribe to see the full content", "warning");
                                    }
                                    setExpanded(true);
                                }}
                                className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                            >
                                READ MORE ▼
                            </button>
                        </div>
                    )}

                    {/* READ LESS — only when fully expanded and NOT locked */}
                    {isLongContent && expanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(false);
                            }}
                            className="mt-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors block"
                        >
                            READ LESS ▲
                        </button>
                    )}

                    {/* GATED — expanded but not subscribed */}
                    {isGated && (
                        <div className="mt-3 p-4 rounded-xl border border-primary/20 bg-primary-soft animate-fadeIn">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-2xs text-primary-foreground font-black">
                                    $
                                </div>
                                <p className="text-2xs font-black uppercase tracking-widest text-primary">
                                    Subscription Required
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                You've reached the free reading limit. Please subscribe to a Premium Plan to unlock the full intelligence of this discovery.
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/subscription");
                                }}
                                className="w-full bg-primary text-primary-foreground text-2xs font-black uppercase tracking-[0.2em] px-4 py-3 rounded-xl shadow-lg hover:bg-primary-hover transition-all hover:-translate-y-0.5"
                            >
                                Subscribe to Unlock
                            </button>
                        </div>
                    )}
                </div>

                {/* TAGS */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag.id}
                                onClick={() => onTagClick?.(tag.name)}
                                className="px-4 py-1.5 text-2xs font-black uppercase tracking-wider cursor-pointer rounded-full border bg-muted border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* MEDIA */}
                {post.media && post.media.length > 0 ? (
                    <div className="relative mt-3 overflow-hidden rounded-2xl group bg-muted flex items-center justify-center min-h-[300px] max-h-[500px]">
                        {/* Page Indicator Top Right */}
                        {post.media.length > 1 && (
                            <div className="absolute top-4 right-4 z-30 bg-black/60 text-white text-2xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md">
                                {currentMediaIndex + 1} / {post.media.length}
                            </div>
                        )}

                        <div
                            className="w-full h-full relative flex items-center justify-center cursor-pointer"
                            onClick={() => post.media[currentMediaIndex].media_type === "image" ? onImageClick?.(post.media[currentMediaIndex].file) : null}
                        >
                            {/* Blurred Background */}
                            {post.media[currentMediaIndex].media_type === "image" && (
                                <div
                                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
                                    style={{ backgroundImage: `url(${post.media[currentMediaIndex].file})` }}
                                />
                            )}

                            {post.media[currentMediaIndex].media_type === "video" ? (
                                <video
                                    src={post.media[currentMediaIndex].file}
                                    controls
                                    className="relative z-10 w-full h-full block max-h-[500px] object-contain bg-black"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <img
                                    src={post.media[currentMediaIndex].file}
                                    alt={`post media ${currentMediaIndex}`}
                                    className="relative z-10 w-full h-full block transition-transform duration-700 max-h-[500px] object-contain"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {post.media.length > 1 && (
                            <>
                                {currentMediaIndex > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev - 1); }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-card/80 text-foreground rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-card shadow-lg"
                                    >
                                        <FaChevronLeft size={14} />
                                    </button>
                                )}
                                {currentMediaIndex < post.media.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev + 1); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-8 md:h-8 flex items-center justify-center bg-card/80 text-foreground rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-card shadow-lg"
                                    >
                                        <FaChevronRight size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ) : post.image && (
                    <div
                        className="mt-3 overflow-hidden rounded-2xl group relative cursor-zoom-in bg-muted flex items-center justify-center"
                        onClick={() => onImageClick?.(post.image)}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
                            style={{ backgroundImage: `url(${post.image})` }}
                        />
                        <img
                            src={post.image}
                            alt="post"
                            className="relative z-10 w-full max-h-[500px] object-contain block transition-transform duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* ACTION BAR */}
                <div className="mt-3 flex items-center gap-3">
                    <button
                        onClick={() => onLike?.(post.id)}
                        className={`group flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${post.is_liked
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                            : "border-border hover:border-primary/50"
                            }`}
                    >
                        {post.is_liked ? <BiSolidLike size={18} /> : <BiLike size={18} className="group-hover:text-primary transition-colors" />}
                        <span className="text-xs font-bold">{post.total_likes}</span>
                    </button>

                    <button
                        onClick={() => onCommentClick?.(post)}
                        className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border hover:border-primary/50 transition-all"
                    >
                        <FaRegComments size={18} />
                        <span className="text-xs font-bold text-muted-foreground">{post.total_comments} Comments</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
