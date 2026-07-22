import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdOutlineFileDownload, MdFilterList } from "react-icons/md";
import { FaSearch, FaTimes } from "react-icons/fa";

import useSearchPosts from "../components/hooks/useSearch";
import useSearchProfiles from "../components/hooks/useSearchProfiles";
import useTags from "../components/hooks/useTags";
import useLike from "../components/hooks/useLike";
import { useConfirm } from "../context/ConfirmContext";
import { useAlert } from "../context/AlertContext";
import useModalEscape from "../components/hooks/useModalEscape";
import { getAccessToken } from "../redux/store/tokenManager";
import { resolveProfileRoute } from "../components/utils/getUserProfileRoute";
import axiosSecure from "../components/utils/axiosSecure";

import PostCard from "../components/posts/PostCard";
import ModalOverlay from "../components/ui/ModalOverlay";
import LoginModal from "../components/auth/login";
import SignupModal from "../components/auth/Signup";
import UserBadge from "../components/ui/UserBadge";
import { SearchInput } from "../components/ui";
import CreatePostModal from "../components/posts/create_post";

export default function SearchResultsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { theme, data: loggedUser } = useSelector((state) => state.user);
    const isDark = theme === "dark";

    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "posts";

    const {
        searchPosts,
        results: postResults,
        setResults: setPostResults,
        loading: postLoading,
    } = useSearchPosts();

    const {
        searchProfiles,
        results: profileResults,
        loading: profileLoading,
    } = useSearchProfiles();

    const { tags, loading: loadingTags } = useTags();
    const { showConfirm } = useConfirm();
    const { showAlert } = useAlert();

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [showAllTags, setShowAllTags] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    useModalEscape(() => {
        if (previewImage) { 
            setPreviewImage(null); 
            setZoom(1); 
        } else if (showEditModal) {
            setShowEditModal(false);
            setEditingPost(null);
        } else if (showLogin) {
            setShowLogin(false);
        } else if (showSignup) {
            setShowSignup(false);
        }
    }, !!(previewImage || showEditModal || showLogin || showSignup));

    const { handleLike } = useLike(
        setPostResults,
        () => getAccessToken(),
        () => setShowLogin(true)
    );

    useEffect(() => {
        if (!query.trim()) return;

        if (type === "posts") {
            searchPosts(query);
        } else if (type === "profiles") {
            searchProfiles(query);
        }
    }, [query, type, searchPosts, searchProfiles]);

    const switchTab = (nextType) => {
        const next = new URLSearchParams(searchParams);
        next.set("type", nextType);
        setSearchParams(next);
    };

    const applySearch = (value) => {
        if (value.trim()) {
            navigate(`/search?q=${encodeURIComponent(value.trim())}&type=posts`);
        }
    };

    const goToProfile = (author) => {
        navigate(resolveProfileRoute(author, loggedUser));
    };

    const handleDelete = (postId) => {
        showConfirm({
            title: "Delete Post?",
            message: "Are you sure you want to delete this post?",
            confirmText: "Delete",
            cancelText: "Cancel",
            onConfirm: async () => {
                try {
                    const res = await axiosSecure.delete(`/v1/community/posts/${postId}/`);
                    if (res.status === 204) {
                        setPostResults((prev) => prev.filter((p) => p.id !== postId));
                        showAlert("Post deleted successfully!", "success");
                    }
                } catch {
                    showAlert("Delete failed!", "error");
                }
            },
        });
    };

    // Count / loading state for the currently active tab (drives the header copy).
    const activeCount = type === "posts" ? postResults.length : profileResults.length;
    const activeLoading = type === "posts" ? postLoading : profileLoading;
    const resultNoun = type === "posts" ? "post" : "profile";

    // Editable query box in the header — lets users refine the search inline,
    // keeping the currently active tab (posts / people).
    const [searchInput, setSearchInput] = useState(query);
    useEffect(() => { setSearchInput(query); }, [query]);
    const submitSearch = () => {
        const v = searchInput.trim();
        if (v) navigate(`/search?q=${encodeURIComponent(v)}&type=${type}`);
    };

    const downloadImage = async (url) => {
        try {
            const response = await fetch(url, { mode: "cors" });
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = url.split("/").pop() || "image.jpg";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-4 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-12 gap-8">

                {/* SIDEBAR: TAGS */}
                <aside className="hidden md:block md:col-span-3 lg:col-span-3">
                    <div className="sticky top-32 p-6 rounded-3xl border border-border bg-card shadow-xl">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-primary-soft text-primary">
                                    <MdFilterList size={20} />
                                </div>
                                <h3 className="font-black uppercase text-xs tracking-widest text-muted-foreground">Filtering</h3>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {loadingTags ? (
                                    <div className="flex justify-center p-4">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        {Array.isArray(tags) && (showAllTags ? tags : tags.slice(0, 10)).map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => applySearch(tag.name)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${query === tag.name
                                                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                    : "border-border text-muted-foreground hover:bg-muted/20"
                                                    }`}
                                            >
                                                <span>#{tag.name}</span>
                                            </button>
                                        ))}
                                        {Array.isArray(tags) && tags.length > 10 && (
                                            <button
                                                onClick={() => setShowAllTags(!showAllTags)}
                                                className="w-full py-2 text-2xs font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
                                            >
                                                {showAllTags ? "- Show Less" : "+ Show More"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="col-span-12 md:col-span-9 lg:col-span-6 space-y-8 animate-fadeIn">

                    {/* COMPACT SEARCH HEADER — editable query + tabs on one band */}
                    <div className="space-y-2.5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <SearchInput
                                value={searchInput}
                                onChange={setSearchInput}
                                onClear={() => setSearchInput("")}
                                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                                placeholder="Search posts or people..."
                                className="w-full sm:max-w-md"
                            />

                            {/* Segmented tabs */}
                            <div className="inline-flex shrink-0 gap-1 self-start rounded-2xl border border-border bg-muted/50 p-1.5 sm:self-auto">
                                {["posts", "profiles"].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => switchTab(t)}
                                        className={`whitespace-nowrap rounded-xl px-5 py-2 text-2xs font-black uppercase tracking-widest transition-all ${type === t
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {t === "profiles" ? "People" : "Posts"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {query && !activeLoading && (
                            <p className="px-1 text-2xs font-bold uppercase tracking-widest text-muted-foreground">
                                {activeCount} {resultNoun}{activeCount === 1 ? "" : "s"} for <span className="text-foreground">"{query}"</span>
                            </p>
                        )}
                    </div>

                    {/* RESULTS */}
                    <div className="space-y-6">
                        {type === "posts" && (
                            <>
                                {postLoading && (
                                    <div className="space-y-6">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="h-64 rounded-3xl animate-pulse bg-muted/20" />
                                        ))}
                                    </div>
                                )}
                                {!postLoading && postResults.length === 0 && (
                                    <div className="text-center py-20 rounded-3xl border border-border bg-card">
                                        <FaSearch className="mx-auto text-4xl mb-4 text-muted-foreground/30" />
                                        <h3 className="font-bold text-lg text-foreground">No posts found</h3>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
                                    </div>
                                )}
                                {!postLoading && postResults.map((post) => (
                                    <div key={post.id} className="transform transition-all duration-500 hover:-translate-y-1">
                                        <PostCard
                                            post={post}
                                            loggedUser={loggedUser}
                                            isDark={isDark}
                                            onLike={handleLike}
                                            onDelete={handleDelete}
                                            onEdit={(p) => { setEditingPost(p); setShowEditModal(true); }}
                                            onCommentClick={(p) => navigate(`/post/${p.id}/comments`)}
                                            onTagClick={applySearch}
                                            onImageClick={setPreviewImage}
                                            onProfileClick={goToProfile}
                                        />
                                    </div>
                                ))}
                            </>
                        )}

                        {type === "profiles" && (
                            <div className="flex flex-col gap-3">
                                {profileLoading && (
                                    [1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-[76px] rounded-2xl animate-pulse bg-muted/20" />
                                    ))
                                )}
                                {!profileLoading && profileResults.length === 0 && (
                                    <div className="text-center py-20 rounded-3xl border border-border bg-card">
                                        <FaSearch className="mx-auto text-4xl mb-4 text-muted-foreground/30" />
                                        <h3 className="font-bold text-lg text-foreground">No people found</h3>
                                        <p className="text-sm text-muted-foreground">Try searching by name or username</p>
                                    </div>
                                )}
                                {!profileLoading && profileResults.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => goToProfile(user)}
                                        className="group flex items-center gap-4 p-3 md:p-4 rounded-2xl border border-border bg-card cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 animate-fadeIn"
                                    >
                                        <img
                                            src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                            className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-full object-cover ring-2 ring-transparent transition-all duration-300 group-hover:ring-primary/40"
                                            alt={user.username}
                                        />

                                        <div className="min-w-0 flex-grow">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <h4 className="font-bold text-foreground text-sm md:text-base truncate transition-colors group-hover:text-primary">
                                                    {user.first_name || user.username} {user.last_name || ""}
                                                </h4>
                                                <UserBadge userType={user.user_type} isDark={isDark} />
                                            </div>
                                            <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5 truncate">@{user.username}</p>
                                        </div>

                                        <span className="hidden xs:inline-flex shrink-0 items-center px-4 py-2 rounded-xl text-3xs md:text-2xs font-black uppercase tracking-[0.15em] md:tracking-widest border border-border text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                                            View
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* AD SIDEBAR */}
                <aside className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className="sticky top-32 p-6 rounded-3xl border border-border bg-card shadow-lg">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-600/30">
                            <FaSearch size={18} />
                        </div>
                        <h4 className="font-bold text-xl text-foreground mb-2">New here?</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground mb-6">
                            Discover experts, investors, and opportunities that match your goals.
                        </p>
                        <button
                            onClick={() => navigate('/experts')}
                            className="w-full py-3 rounded-xl bg-muted text-muted-foreground text-xs uppercase tracking-widest hover:bg-muted/70 transition-all text-center"
                        >
                            Explore Network
                        </button>
                    </div>
                </aside>
            </div>

            {/* MODALS */}
            {showEditModal && (
                <ModalOverlay close={() => { setShowEditModal(false); setEditingPost(null); }}>
                    <CreatePostModal
                        isDark={isDark}
                        post={editingPost}
                        onClose={() => { setShowEditModal(false); setEditingPost(null); }}
                        onSuccess={(updatedPost) => {
                            setPostResults((prev) => prev.map((p) => p.id === updatedPost.id ? updatedPost : p));
                            setShowEditModal(false);
                            setEditingPost(null);
                        }}
                    />
                </ModalOverlay>
            )}

            {showLogin && (
                <ModalOverlay close={() => setShowLogin(false)}>
                    <LoginModal isDark={isDark} onClose={() => setShowLogin(false)} openSignup={() => { setShowLogin(false); setShowSignup(true); }} />
                </ModalOverlay>
            )}
            {showSignup && (
                <ModalOverlay close={() => setShowSignup(false)}>
                    <SignupModal isDark={isDark} onClose={() => setShowSignup(false)} openLogin={() => { setShowSignup(false); setShowLogin(true); }} />
                </ModalOverlay>
            )}
            {previewImage && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center animate-fadeIn" onClick={() => { setPreviewImage(null); setZoom(1); }}>
                    <div className="relative max-w-[95vw] max-h-[95vh] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setPreviewImage(null); setZoom(1); }} className="absolute -top-12 right-0 md:-right-12 z-20 text-white/50 hover:text-white transition-colors">
                            <FaTimes size={24} />
                        </button>
                        <button onClick={() => downloadImage(previewImage)} className="absolute -top-12 left-0 md:-left-12 z-20 text-white/50 hover:text-white transition-colors" title="Download">
                            <MdOutlineFileDownload size={24} />
                        </button>
                        <img src={previewImage} alt="Preview" className="rounded-2xl shadow-2xl max-w-full max-h-[85vh] object-contain transition-transform duration-200" style={{ transform: `scale(${zoom})` }} onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))} draggable={false} />
                    </div>
                </div>
            )}
        </div>
    );
}
