// src/pages/VideoFeed.jsx
// Immersive, full-screen, scroll-through video feed (Facebook Watch / Reels
// style). Opened from any feed video. Vertical snap scrolling, one video at a
// time, autoplay with sound, like / comment / profile actions overlaid.
import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaRegComments, FaChevronLeft } from "react-icons/fa";

import useVideoFeed from "../components/hooks/useVideoFeed";
import useLike from "../components/hooks/useLike";
import FeedVideo from "../components/posts/FeedVideo";
import UserBadge from "../components/ui/UserBadge";
import { getAccessToken } from "../redux/store/tokenManager";
import { resolveAvatar } from "../components/utils/mediaUrl";
import { resolveProfileRoute } from "../components/utils/getUserProfileRoute";

const firstVideo = (post) =>
  (post.media || []).find((m) => m.media_type === "video") || null;

export default function VideoFeed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startId = searchParams.get("start");
  const { data: loggedUser } = useSelector((state) => state.user);

  const { posts, setPosts, loaderRef, next, loading, error } = useVideoFeed();
  const { handleLike } = useLike(setPosts, getAccessToken, () =>
    navigate("/")
  );

  const scrollRef = useRef(null);
  const itemRefs = useRef({});
  const didScrollToStart = useRef(false);

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
              className="relative flex h-full w-full snap-start items-center justify-center"
            >
              <FeedVideo
                src={vid.file}
                className="h-full w-full object-contain"
              />

              {/* Gradient scrim for legibility */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

              {/* Right action rail */}
              <div className="absolute bottom-28 right-3 z-20 flex flex-col items-center gap-5 sm:bottom-10">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${
                      post.is_liked ? "bg-primary" : "bg-white/15 hover:bg-white/25"
                    }`}
                  >
                    {post.is_liked ? <BiSolidLike size={24} /> : <BiLike size={24} />}
                  </span>
                  <span className="text-2xs font-bold">{post.total_likes}</span>
                </button>

                <button
                  onClick={() => navigate(`/post/${post.id}/comments`)}
                  className="flex flex-col items-center gap-1 text-white"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-all hover:bg-white/25 active:scale-90">
                    <FaRegComments size={22} />
                  </span>
                  <span className="text-2xs font-bold">{post.total_comments}</span>
                </button>
              </div>

              {/* Bottom-left author + caption */}
              <div className="absolute bottom-24 left-4 right-20 z-20 sm:bottom-8">
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
    </div>
  );
}
