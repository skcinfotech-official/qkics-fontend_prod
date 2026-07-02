// src/pages/Comments.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosSecure from "../utils/axiosSecure";
import useCommentLike from "../hooks/useCommentLike";
import { getAccessToken } from "../../redux/store/tokenManager";

import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaCrown, FaRegComment } from "react-icons/fa";
import { FiSend, FiTrash2 } from "react-icons/fi";

import { useSelector } from "react-redux";
import { resolveAvatar, resolveMedia } from "../utils/mediaUrl";
import { normalizePost } from "../utils/normalizePost";

import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const intervals = { y: 31536000, mo: 2592000, w: 604800, d: 86400, h: 3600, m: 60 };
  for (const unit in intervals) {
    const v = Math.floor(seconds / intervals[unit]);
    if (v >= 1) return `${v}${unit}`;
  }
  return "just now";
}

/* -------------------------------------------------------
   Reusable Reply Input Component
--------------------------------------------------------- */
function ReplyInput({ replyContent, setReplyContent, onSubmit, onCancel, avatar }) {
  return (
    <div className="mt-2 flex items-start gap-2 animate-scaleIn origin-top-left">
      <img src={avatar} alt="me" className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover" />
      <div className="flex-1">
        <div className="rounded-2xl bg-muted px-3 py-2">
          <textarea
            rows="1"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="mt-1.5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!replyContent.trim()}
            className="rounded-lg bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Comments() {
  const { id: postId } = useParams();
  const navigate = useNavigate();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const { data: user, picVersion } = useSelector((state) => state.user);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const [expandedComments, setExpandedComments] = useState({});
  const [expandedPost, setExpandedPost] = useState(false);

  const toggleCommentExpansion = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);

  const [openReplies, setOpenReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [replyNextCursor, setReplyNextCursor] = useState({});

  const loaderRef = useRef(null);
  const composerRef = useRef(null);

  /* avatar resolver (handles "own profile" freshness) */
  const avatarUrl = (author) => {
    const isOwn = user && (
      (user.id && author?.id && user.id == author.id) ||
      (user.uuid && author?.uuid && user.uuid === author.uuid) ||
      (user.username && author?.username && user.username === author.username)
    );
    const pic = isOwn ? user?.profile_picture : author?.profile_picture;
    const base = resolveAvatar(pic, author?.username || "O");
    return pic ? `${base}?v=${picVersion}` : base;
  };

  const myAvatar = resolveAvatar(user?.profile_picture, user?.username || "O") + (user?.profile_picture ? `?v=${picVersion}` : "");

  const normalizeContent = (text, previewLimit = 300, fullLimit = 5000) => {
    const normalized = text.slice(0, fullLimit);
    return {
      preview_content: normalized.slice(0, previewLimit),
      full_content: normalized,
    };
  };

  /* ---------------- LIKE HOOK ---------------- */
  const { handleCommentLike } = useCommentLike(
    setComments,
    () => getAccessToken(),
    () => alert("Please log in.")
  );

  /* ---------------- FETCH POST ---------------- */
  const fetchPostDetails = async () => {
    const res = await axiosSecure.get(`/v1/community/posts/${postId}/`);
    setPost(normalizePost(res.data.data || res.data));
  };

  const handleLikePost = async () => {
    if (!getAccessToken()) {
      return alert("Please log in to like this post.");
    }
    try {
      const res = await axiosSecure.post(`/v1/community/posts/${postId}/like/`);
      const updated = normalizePost(res.data.data || res.data);
      setPost((prev) => ({
        ...prev,
        is_liked: updated.is_liked,
        total_likes: updated.total_likes,
      }));
    } catch (error) {
      console.log("Post like error:", error);
    }
  };

  /* ---------------- FETCH COMMENTS ---------------- */
  const fetchComments = async () => {
    const res = await axiosSecure.get(`/v1/community/posts/${postId}/comments/`);
    setComments(
      res.data.results.map((c) => ({ ...c, replies: [], reply_count: c.total_replies }))
    );
    setNextCursor(res.data.next);
  };

  const loadMoreComments = async () => {
    if (!nextCursor) return;
    const res = await axiosSecure.get(nextCursor);
    setComments((prev) => [
      ...prev,
      ...res.data.results.map((c) => ({ ...c, replies: [], reply_count: c.total_replies })),
    ]);
    setNextCursor(res.data.next);
  };

  /* ---------------- LOAD REPLIES ---------------- */
  const loadReplies = async (commentId, cursor = null) => {
    if (openReplies[commentId] && !cursor) {
      setOpenReplies((p) => ({ ...p, [commentId]: false }));
      return;
    }

    setLoadingReplies((p) => ({ ...p, [commentId]: true }));

    const url = cursor ? cursor : `/v1/community/comments/${commentId}/replies/`;
    const res = await axiosSecure.get(url);

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: cursor ? [...c.replies, ...res.data.results] : res.data.results }
          : c
      )
    );

    setReplyNextCursor((p) => ({ ...p, [commentId]: res.data.next }));
    setOpenReplies((p) => ({ ...p, [commentId]: true }));
    setLoadingReplies((p) => ({ ...p, [commentId]: false }));
  };

  /* ---------------- ADD COMMENT ---------------- */
  const addComment = async () => {
    if (!user || !content.trim()) return;
    const payload = normalizeContent(content, 300, 5000);
    try {
      const res = await axiosSecure.post(`/v1/community/posts/${postId}/comments/`, payload);
      setComments((p) => [{ ...res.data, replies: [], reply_count: 0 }, ...p]);
      setPost((prev) => ({ ...prev, total_comments: (prev.total_comments || 0) + 1 }));
      setContent("");
      showAlert("Comment added successfully", "success");
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";
      showAlert(message, "error");
    }
  };

  /* ---------------- ADD REPLY ---------------- */
  const addReply = async (commentId) => {
    if (!user || !replyContent.trim()) return;
    const payload = normalizeContent(replyContent, 300, 5000);
    try {
      const res = await axiosSecure.post(`/v1/community/comments/${commentId}/replies/`, payload);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, replies: [...c.replies, res.data], reply_count: c.reply_count + 1 }
            : c
        )
      );
      setReplyContent("");
      setActiveReplyBox(null);
      setOpenReplies((p) => ({ ...p, [commentId]: true }));
      setPost((prev) => ({ ...prev, total_comments: (prev.total_comments || 0) + 1 }));
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Unable to add reply.";
      showAlert(message, "error");
    }
  };

  /* ---------------- DELETE ---------------- */
  const deleteComment = (commentId) => {
    showConfirm({
      title: "Delete Comment?",
      message: "Are you sure you want to delete this comment?",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await axiosSecure.delete(`/v1/community/comments/${commentId}/`);
        setComments((p) => p.filter((c) => c.id !== commentId));
        setPost((prev) => ({ ...prev, total_comments: Math.max(0, (prev.total_comments || 0) - 1) }));
        showAlert("Comment deleted", "success");
      },
    });
  };

  const deleteReply = (replyId, commentId) => {
    showConfirm({
      title: "Delete Reply?",
      message: "Are you sure you want to delete this reply?",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await axiosSecure.delete(`/v1/community/replies/${replyId}/`);
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== replyId), reply_count: c.reply_count - 1 }
              : c
          )
        );
        setPost((prev) => ({ ...prev, total_comments: Math.max(0, (prev.total_comments || 0) - 1) }));
        showAlert("Reply deleted", "success");
      },
    });
  };

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      (e) => e[0].isIntersecting && loadMoreComments(),
      { threshold: 1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [nextCursor]);

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  const displayName = (author) =>
    author?.first_name ? `${author.first_name} ${author.last_name || ""}`.trim() : author?.username;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-3 pt-5 pb-24 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">

          {/* ============ LEFT — POST (sticky) ============ */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* HEADER */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <img src={avatarUrl(post.author)} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">{displayName(post.author)}</p>
                {post.author.is_subscribed && <FaCrown className="shrink-0 text-amber-500" size={11} />}
              </div>
              <p className="text-xs text-muted-foreground">
                @{post.author.username} · {timeAgo(post.created_at)}
              </p>
            </div>
          </div>

          {/* TITLE + CONTENT */}
          <div className="px-4 pt-3">
            {post.title && <h1 className="mb-1.5 text-lg font-bold tracking-tight text-foreground">{post.title}</h1>}

            {(() => {
              const isLocked = post.is_locked === true;
              const fullContent = post.content || "";
              const previewLength = post.preview_length || 300;
              const isLongContent = fullContent.length > previewLength || (isLocked && fullContent.length > 150);
              const displayText = expandedPost
                ? fullContent
                : (isLongContent ? fullContent.slice(0, previewLength) + "..." : fullContent);
              const isGated = expandedPost && isLocked;

              return (
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{displayText}</p>

                  {isLongContent && !expandedPost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLocked) showAlert("Please subscribe to see the full content", "warning");
                        setExpandedPost(true);
                      }}
                      className="mt-1 text-sm font-semibold text-primary hover:underline"
                    >
                      See more
                    </button>
                  )}
                  {isLongContent && expandedPost && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedPost(false); }}
                      className="mt-1 block text-sm font-semibold text-muted-foreground hover:text-foreground"
                    >
                      See less
                    </button>
                  )}

                  {isGated && (
                    <div className="mt-3 rounded-xl border border-primary/20 bg-primary-soft p-4 animate-fadeIn">
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wide text-primary">Subscription Required</p>
                      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                        You've reached the free reading limit. Subscribe to a Premium Plan to unlock the full content.
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate("/subscription"); }}
                        className="w-full rounded-lg bg-primary px-4 py-2.5 text-2xs font-bold uppercase tracking-wide text-primary-foreground transition-all hover:bg-primary-hover"
                      >
                        Subscribe to Unlock
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* TAGS */}
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-2xs font-bold text-primary">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MEDIA */}
          {post.media && post.media.length > 0 && (
            <div className="group relative mt-3 flex min-h-[280px] items-center justify-center overflow-hidden bg-muted">
              {post.media.length > 1 && (
                <div className="absolute right-3 top-3 z-30 rounded-full bg-black/60 px-2.5 py-1 text-2xs font-bold text-white backdrop-blur-md">
                  {currentMediaIndex + 1} / {post.media.length}
                </div>
              )}
              {post.media[currentMediaIndex].media_type === "video" ? (
                <video src={resolveMedia(post.media[currentMediaIndex].file)} controls className="max-h-[600px] w-full object-contain" />
              ) : (
                <img src={resolveMedia(post.media[currentMediaIndex].file)} alt="post" className="max-h-[600px] w-full object-contain" />
              )}
              {post.media.length > 1 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setCurrentMediaIndex((p) => Math.max(0, p - 1))}
                    disabled={currentMediaIndex === 0}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black disabled:opacity-30"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setCurrentMediaIndex((p) => Math.min(post.media.length - 1, p + 1))}
                    disabled={currentMediaIndex === post.media.length - 1}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black disabled:opacity-30"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          )}
          {!post.media && post.image && (
            <div className="mt-3 overflow-hidden bg-muted">
              <img src={resolveMedia(post.image)} alt="post" className="max-h-[600px] w-full object-contain" />
            </div>
          )}

          {/* COUNTS */}
          <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                <BiSolidLike size={9} />
              </span>
              {post.total_likes}
            </div>
            <span>{post.total_comments || 0} comments</span>
          </div>

          {/* ACTION BAR */}
          <div className="grid grid-cols-2 border-t border-border">
            <button
              onClick={handleLikePost}
              className={`flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors hover:bg-muted ${post.is_liked ? "text-primary" : "text-muted-foreground"}`}
            >
              {post.is_liked ? <BiSolidLike size={18} /> : <BiLike size={18} />} Like
            </button>
            <button
              onClick={() => composerRef.current?.focus()}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
            >
              <FaRegComment size={16} /> Comment
            </button>
          </div>
            </div>
          </div>

          {/* ============ RIGHT — COMMENTS ============ */}
          <div className="lg:col-span-7">

        {/* ================= COMMENTS LIST ================= */}
        <div className="space-y-3">
          {comments.map((c) => {
            const expanded = expandedComments[c.id] || false;
            const isLocked = c.is_locked === true;
            const fullContent = c.content || "";
            const previewLength = c.preview_length || 300;
            const isLongContent = fullContent.length > previewLength || (isLocked && fullContent.length > 150);
            const displayText = expanded
              ? fullContent
              : (isLongContent ? fullContent.slice(0, previewLength) + "..." : fullContent);
            const isGated = expanded && isLocked;

            return (
              <div key={c.id} className="flex gap-2">
                <img src={avatarUrl(c.author)} alt="avatar" className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover" />

                <div className="min-w-0 flex-1">
                  {/* BUBBLE */}
                  <div className="group/bubble relative inline-block max-w-full rounded-2xl bg-muted px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xs font-semibold text-foreground">{displayName(c.author)}</span>
                      {c.author.is_subscribed && <FaCrown className="text-amber-500" size={9} />}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{displayText}</p>

                    {user?.id === c.author.id && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="absolute -right-1 -top-1 hidden rounded-full bg-card p-1 text-muted-foreground shadow-sm transition-colors hover:text-danger group-hover/bubble:block"
                        aria-label="Delete comment"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>

                  {isLongContent && !expanded && (
                    <button
                      onClick={() => {
                        if (isLocked) showAlert("Please subscribe to see the full content", "warning");
                        toggleCommentExpansion(c.id);
                      }}
                      className="ml-3 mt-0.5 block text-xs font-semibold text-primary hover:underline"
                    >
                      See more
                    </button>
                  )}
                  {isLongContent && expanded && (
                    <button onClick={() => toggleCommentExpansion(c.id)} className="ml-3 mt-0.5 block text-xs font-semibold text-muted-foreground hover:text-foreground">
                      See less
                    </button>
                  )}

                  {isGated && (
                    <div className="ml-3 mt-2 rounded-xl border border-primary/20 bg-primary-soft p-3">
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wide text-primary">Subscription Required</p>
                      <button
                        onClick={() => navigate("/subscription")}
                        className="mt-1 rounded-lg bg-primary px-3 py-1.5 text-2xs font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover"
                      >
                        Subscribe to Unlock
                      </button>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="ml-3 mt-1 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <button
                      onClick={() => handleCommentLike(c.id)}
                      className={`transition-colors hover:text-primary ${c.is_liked ? "text-primary" : ""}`}
                    >
                      Like{c.total_likes ? ` · ${c.total_likes}` : ""}
                    </button>
                    <button
                      onClick={() => {
                        setActiveReplyBox(activeReplyBox === `comment-${c.id}` ? null : `comment-${c.id}`);
                        setReplyContent("");
                      }}
                      className="transition-colors hover:text-primary"
                    >
                      Reply
                    </button>
                    <span className="font-normal">{timeAgo(c.created_at)}</span>
                  </div>

                  {/* REPLY BOX */}
                  {activeReplyBox === `comment-${c.id}` && (
                    <ReplyInput
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      onSubmit={() => addReply(c.id)}
                      onCancel={() => setActiveReplyBox(null)}
                      avatar={myAvatar}
                    />
                  )}

                  {/* SHOW / HIDE REPLIES */}
                  {c.reply_count > 0 && (
                    <button
                      onClick={() => loadReplies(c.id)}
                      className="ml-3 mt-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      {openReplies[c.id] ? "Hide replies" : `View ${c.reply_count} ${c.reply_count === 1 ? "reply" : "replies"}`}
                    </button>
                  )}

                  {/* REPLIES */}
                  {openReplies[c.id] && (
                    <div className="relative mt-3 ml-4 space-y-3 border-l border-border pl-5">
                      {c.replies.map((r) => (
                        <div key={r.id} className="relative flex gap-2">
                          <span className="pointer-events-none absolute -left-5 top-4 h-px w-5 bg-border" />
                          <img src={avatarUrl(r.author)} alt="avatar" className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="group/rb relative inline-block max-w-full rounded-2xl bg-muted px-3 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-2xs font-semibold text-foreground">{displayName(r.author)}</span>
                                {r.author.is_subscribed && <FaCrown className="text-amber-500" size={8} />}
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{r.content}</p>

                              {user?.id === r.author.id && (
                                <button
                                  onClick={() => deleteReply(r.id, c.id)}
                                  className="absolute -right-1 -top-1 hidden rounded-full bg-card p-1 text-muted-foreground shadow-sm transition-colors hover:text-danger group-hover/rb:block"
                                  aria-label="Delete reply"
                                >
                                  <FiTrash2 size={11} />
                                </button>
                              )}
                            </div>

                            <div className="ml-3 mt-1 flex items-center gap-4 text-2xs font-semibold text-muted-foreground">
                              <button
                                onClick={() => handleCommentLike(r.id)}
                                className={`transition-colors hover:text-primary ${r.is_liked ? "text-primary" : ""}`}
                              >
                                Like{r.total_likes ? ` · ${r.total_likes}` : ""}
                              </button>
                              <button
                                onClick={() => {
                                  setActiveReplyBox(activeReplyBox === `reply-${r.id}` ? null : `reply-${r.id}`);
                                  setReplyContent(`@${r.author.username} `);
                                }}
                                className="transition-colors hover:text-primary"
                              >
                                Reply
                              </button>
                              <span className="font-normal">{timeAgo(r.created_at)}</span>
                            </div>

                            {activeReplyBox === `reply-${r.id}` && (
                              <ReplyInput
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                onSubmit={() => addReply(c.id)}
                                onCancel={() => setActiveReplyBox(null)}
                                avatar={myAvatar}
                              />
                            )}
                          </div>
                        </div>
                      ))}

                      {replyNextCursor[c.id] && (
                        <button
                          onClick={() => loadReplies(c.id, replyNextCursor[c.id])}
                          className="ml-1 text-xs font-semibold text-primary hover:underline"
                        >
                          {loadingReplies[c.id] ? "Loading..." : "Load more replies"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOADER */}
        <div ref={loaderRef} className="flex h-12 items-center justify-center text-xs font-medium text-muted-foreground">
          {comments.length === 0 ? "No comments yet — be the first!" : nextCursor ? "Loading more comments..." : "You're all caught up"}
        </div>

        {/* ================= COMPOSER (sticky bottom, single line) ================= */}
        <div className="sticky bottom-0 z-10 mt-2 border-t border-border bg-background/95 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <img src={myAvatar} alt="me" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            <div className="flex flex-1 items-center rounded-full border border-border bg-card px-4 py-2 transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/20">
              <textarea
                ref={composerRef}
                rows="1"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
                placeholder="Write a comment..."
                className="max-h-24 w-full resize-none bg-transparent text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={addComment}
              disabled={!content.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-40"
              aria-label="Post comment"
            >
              <FiSend size={16} />
            </button>
          </div>
        </div>

          </div>
        </div>
      </div>
    </div>
  );
}
