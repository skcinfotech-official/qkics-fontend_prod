// src/components/posts/CommentsPanel.jsx
// Slide-in comments panel used by the immersive video feed (Shorts-style).
//  - Mobile: bottom sheet.  Desktop: right side panel.
//  - Full comment features: list + pagination, add, like, delete, replies.
// Reuses the same community API + useCommentLike hook as the full comments page.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaCrown } from "react-icons/fa";
import { FiSend, FiTrash2, FiX } from "react-icons/fi";

import axiosSecure from "../utils/axiosSecure";
import useCommentLike from "../hooks/useCommentLike";
import { getAccessToken } from "../../redux/store/tokenManager";
import { resolveAvatar } from "../utils/mediaUrl";
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

function ReplyInput({ value, setValue, onSubmit, onCancel, avatar }) {
  return (
    <div className="mt-2 flex items-start gap-2">
      <img src={avatar} alt="me" className="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover" />
      <div className="flex-1">
        <div className="rounded-2xl bg-muted px-3 py-2">
          <textarea
            rows="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Write a reply..."
            className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="mt-1.5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="rounded-lg bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentsPanel({ postId, open, onClose, onCountChange }) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const { data: user, picVersion } = useSelector((state) => state.user);

  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);
  const [openReplies, setOpenReplies] = useState({});
  const [replyNextCursor, setReplyNextCursor] = useState({});

  const loaderRef = useRef(null);
  const composerRef = useRef(null);

  const avatarUrl = (author) => {
    const isOwn =
      user &&
      ((user.id && author?.id && user.id == author.id) ||
        (user.username && author?.username && user.username === author.username));
    const pic = isOwn ? user?.profile_picture : author?.profile_picture;
    const base = resolveAvatar(pic, author?.username || "O");
    return pic ? `${base}?v=${picVersion}` : base;
  };
  const myAvatar =
    resolveAvatar(user?.profile_picture, user?.username || "O") +
    (user?.profile_picture ? `?v=${picVersion}` : "");

  const displayName = (a) =>
    a?.first_name ? `${a.first_name} ${a.last_name || ""}`.trim() : a?.username;

  const normalizeContent = (text) => ({
    preview_content: text.slice(0, 300),
    full_content: text.slice(0, 5000),
  });

  const { handleCommentLike } = useCommentLike(
    setComments,
    () => getAccessToken(),
    () => showAlert("Please log in to like.", "warning")
  );

  /* ---------- FETCH ---------- */
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axiosSecure.get(`/v1/community/posts/${postId}/comments/`);
      setComments(res.data.results.map((c) => ({ ...c, replies: [], reply_count: c.total_replies })));
      setNextCursor(res.data.next);
    } catch {
      showAlert("Failed to load comments.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    const res = await axiosSecure.get(nextCursor);
    setComments((prev) => [
      ...prev,
      ...res.data.results.map((c) => ({ ...c, replies: [], reply_count: c.total_replies })),
    ]);
    setNextCursor(res.data.next);
  };

  const loadReplies = async (commentId, cursor = null) => {
    if (openReplies[commentId] && !cursor) {
      setOpenReplies((p) => ({ ...p, [commentId]: false }));
      return;
    }
    const url = cursor || `/v1/community/comments/${commentId}/replies/`;
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
  };

  /* ---------- MUTATIONS ---------- */
  const addComment = async () => {
    if (!getAccessToken()) return showAlert("Please log in to comment.", "warning");
    if (!content.trim()) return;
    try {
      const res = await axiosSecure.post(
        `/v1/community/posts/${postId}/comments/`,
        normalizeContent(content)
      );
      setComments((p) => [{ ...res.data, replies: [], reply_count: 0 }, ...p]);
      setContent("");
      onCountChange?.(1);
    } catch (error) {
      showAlert(
        error.response?.data?.message || error.response?.data?.detail || "Something went wrong.",
        "error"
      );
    }
  };

  const addReply = async (commentId) => {
    if (!getAccessToken()) return showAlert("Please log in to reply.", "warning");
    if (!replyContent.trim()) return;
    try {
      const res = await axiosSecure.post(
        `/v1/community/comments/${commentId}/replies/`,
        normalizeContent(replyContent)
      );
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
      onCountChange?.(1);
    } catch (error) {
      showAlert(error.response?.data?.message || error.response?.data?.detail || "Unable to reply.", "error");
    }
  };

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
        onCountChange?.(-1);
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
        onCountChange?.(-1);
        showAlert("Reply deleted", "success");
      },
    });
  };

  /* ---------- EFFECTS ---------- */
  useEffect(() => {
    if (open && postId) {
      setComments([]);
      setNextCursor(null);
      setOpenReplies({});
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  useEffect(() => {
    if (!open || !loaderRef.current) return;
    const obs = new IntersectionObserver((e) => e[0].isIntersecting && loadMore(), {
      threshold: 1,
    });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel: bottom sheet on mobile, right side panel on desktop */}
      <div className="absolute inset-x-0 bottom-0 flex h-[72vh] flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl animate-slideUp sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[420px] sm:rounded-none sm:rounded-l-3xl sm:border-l sm:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-bold text-foreground">Comments</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close comments"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <img src={avatarUrl(c.author)} alt="avatar" className="mt-0.5 h-9 w-9 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="group/bubble relative inline-block max-w-full rounded-2xl bg-muted px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xs font-semibold text-foreground">{displayName(c.author)}</span>
                    {c.author?.is_subscribed && <FaCrown className="text-amber-500" size={9} />}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{c.content}</p>
                  {user?.id === c.author?.id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="absolute -right-1 -top-1 hidden rounded-full bg-card p-1 text-muted-foreground shadow-sm hover:text-danger group-hover/bubble:block"
                      aria-label="Delete comment"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="ml-3 mt-1 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleCommentLike(c.id)}
                    className={`transition-colors hover:text-primary ${c.is_liked ? "text-primary" : ""}`}
                  >
                    Like{c.total_likes ? ` · ${c.total_likes}` : ""}
                  </button>
                  <button
                    onClick={() => {
                      setActiveReplyBox(activeReplyBox === `c-${c.id}` ? null : `c-${c.id}`);
                      setReplyContent("");
                    }}
                    className="transition-colors hover:text-primary"
                  >
                    Reply
                  </button>
                  <span className="font-normal">{timeAgo(c.created_at)}</span>
                </div>

                {activeReplyBox === `c-${c.id}` && (
                  <ReplyInput
                    value={replyContent}
                    setValue={setReplyContent}
                    onSubmit={() => addReply(c.id)}
                    onCancel={() => setActiveReplyBox(null)}
                    avatar={myAvatar}
                  />
                )}

                {c.reply_count > 0 && (
                  <button
                    onClick={() => loadReplies(c.id)}
                    className="ml-3 mt-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {openReplies[c.id] ? "Hide replies" : `View ${c.reply_count} ${c.reply_count === 1 ? "reply" : "replies"}`}
                  </button>
                )}

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
                              {r.author?.is_subscribed && <FaCrown className="text-amber-500" size={8} />}
                            </div>
                            <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{r.content}</p>
                            {user?.id === r.author?.id && (
                              <button
                                onClick={() => deleteReply(r.id, c.id)}
                                className="absolute -right-1 -top-1 hidden rounded-full bg-card p-1 text-muted-foreground shadow-sm hover:text-danger group-hover/rb:block"
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
                                setActiveReplyBox(activeReplyBox === `r-${r.id}` ? null : `r-${r.id}`);
                                setReplyContent(`@${r.author?.username} `);
                              }}
                              className="transition-colors hover:text-primary"
                            >
                              Reply
                            </button>
                            <span className="font-normal">{timeAgo(r.created_at)}</span>
                          </div>
                          {activeReplyBox === `r-${r.id}` && (
                            <ReplyInput
                              value={replyContent}
                              setValue={setReplyContent}
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
                        Load more replies
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={loaderRef} className="flex h-10 items-center justify-center text-xs font-medium text-muted-foreground">
            {loading
              ? "Loading..."
              : comments.length === 0
              ? "No comments yet — be the first!"
              : nextCursor
              ? "Loading more..."
              : "You're all caught up"}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src={myAvatar} alt="me" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            <div className="flex flex-1 items-center rounded-full border border-border bg-background px-4 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/20">
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
  );
}
