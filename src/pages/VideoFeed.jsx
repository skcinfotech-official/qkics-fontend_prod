// src/pages/VideoFeed.jsx
// Immersive, full-screen, scroll-through video feed (Facebook Watch / Reels
// style). Opened from any feed video. Vertical snap scrolling, one video at a
// time, autoplay with sound, like / comment / profile actions overlaid.
import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaRegComments, FaChevronLeft } from "react-icons/fa";

import useVideoFeed from "../components/hooks/useVideoFeed";
import useLike from "../components/hooks/useLike";
import ShortsPlayer from "../components/posts/ShortsPlayer";
import CommentsPanel from "../components/posts/CommentsPanel";
import UserBadge from "../components/ui/UserBadge";
import { getAccessToken } from "../redux/store/tokenManager";
import { resolveAvatar } from "../components/utils/mediaUrl";
import { resolveProfileRoute } from "../components/utils/getUserProfileRoute";
import { useAlert } from "../context/AlertContext";

const firstVideo = (post) =>
  (post.media || []).find((m) => m.media_type === "video") || null;

export default function VideoFeed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startId = searchParams.get("start");
  const { data: loggedUser } = useSelector((state) => state.user);
  const { showAlert } = useAlert();

  const { posts, setPosts, loaderRef, next, loading, error } =
    useVideoFeed(startId);
  const { handleLike } = useLike(setPosts, getAccessToken, () =>
    showAlert("Please log in to like.", "warning")
  );

  const scrollRef = useRef(null);
  const itemRefs = useRef({});
  const didScrollToStart = useRef(false);

  // Which post's comments panel is open (null = closed).
  const [commentsPostId, setCommentsPostId] = useState(null);

  const adjustCommentCount = useCallback(
    (postId, delta) =>
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, total_comments: Math.max(0, (p.total_comments || 0) + delta) }
            : p
        )
      ),
    [setPosts]
  );

  // Once posts arrive, jump to the video the user tapped (?start=<id>).
  useEffect(() => {
    if (didScrollToStart.current || !startId || posts.length === 0) return;
    const el = itemRefs.current[startId];
    if (el) {
      el.scrollIntoView({ behavior: "auto" });
      didScrollToStart.current = true;
    }
  }, [posts, startId]);

  const goProfile = useCallback(
    (author) => navigate(resolveProfileRoute(author, loggedUser)),
    [navigate, loggedUser]
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      {/* Back */}
      <button
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        className="absolute top-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
        aria-label="Back"
      >
        <FaChevronLeft size={18} />
      </button>

      <div
        ref={scrollRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll no-scrollbar"
      >
        {posts.map((post) => {
          const vid = firstVideo(post);
          if (!vid) return null;
          const author = post.author || {};
          const name =
            author.first_name || author.last_name
              ? `${author.first_name || ""} ${author.last_name || ""}`.trim()
              : author.username;

          return (
            <section
              key={post.id}
              ref={(el) => (itemRefs.current[post.id] = el)}
              className="relative flex h-full w-full snap-start items-center justify-center px-0 py-0 sm:py-4"
            >
              {/* Shorts row: portrait video card + vertical action rail beside it */}
              <div className="relative flex h-full items-end justify-center gap-2 sm:h-auto sm:gap-4">
                {/* VIDEO CARD — full screen on mobile, portrait card on desktop */}
                <div className="relative h-full w-screen overflow-hidden bg-black sm:h-[92vh] sm:max-h-[92vh] sm:w-[calc(92vh*9/16)] sm:rounded-3xl sm:shadow-2xl">
                  <ShortsPlayer src={vid.file} scrollRootRef={scrollRef} />

                  {/* Author + caption — overlaid bottom-left, above the seek bar */}
                  <div className="absolute bottom-16 left-4 right-16 z-30 sm:right-4">
                    <button
                      onClick={() => goProfile(author)}
                      className="flex items-center gap-3"
                    >
                      <span className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/70">
                        <img
                          src={resolveAvatar(author.profile_picture, author.username || "O")}
                          alt="profile"
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow">
                        {name}
                        <UserBadge userType={author.user_type} />
                      </span>
                    </button>

                    {(post.title || post.content) && (
                      <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-white/90 drop-shadow">
                        {post.title || post.content}
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTION RAIL — overlay bottom-right on mobile, beside card on desktop */}
                <div className="absolute bottom-28 right-3 z-40 flex flex-col items-center gap-5 sm:static sm:mb-8 sm:self-end">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${
                        post.is_liked
                          ? "bg-primary"
                          : "bg-white/15 hover:bg-white/25 sm:bg-white/10"
                      }`}
                    >
                      {post.is_liked ? <BiSolidLike size={24} /> : <BiLike size={24} />}
                    </span>
                    <span className="text-2xs font-bold">{post.total_likes}</span>
                  </button>

                  <button
                    onClick={() => setCommentsPostId(post.id)}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-all hover:bg-white/25 active:scale-90 sm:bg-white/10">
                      <FaRegComments size={22} />
                    </span>
                    <span className="text-2xs font-bold">{post.total_comments}</span>
                  </button>
                </div>
              </div>
            </section>
          );
        })}

        {/* Infinite-scroll sentinel + states */}
        {!error && (
          <div
            ref={loaderRef}
            className="flex h-24 items-center justify-center text-white/50"
          >
            {loading && posts.length === 0 ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-white border-white/20" />
            ) : next ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-white border-white/20" />
            ) : posts.length > 0 ? (
              <span className="text-2xs font-bold uppercase tracking-widest">
                You're all caught up
              </span>
            ) : !loading ? (
              <span className="text-2xs font-bold uppercase tracking-widest">
                No videos yet
              </span>
            ) : null}
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-white">
            <p className="text-sm font-bold text-primary">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-white/15 px-5 py-2.5 text-2xs font-black uppercase tracking-widest backdrop-blur-md hover:bg-white/25"
            >
              Back to feed
            </button>
          </div>
        )}
      </div>

      <CommentsPanel
        open={commentsPostId !== null}
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onCountChange={(delta) => adjustCommentCount(commentsPostId, delta)}
      />
    </div>
  );
}
