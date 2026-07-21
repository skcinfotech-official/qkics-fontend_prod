import { useEffect, useRef } from "react";

/**
 * Feed video with scroll-aware playback:
 *  - Auto-plays (with SOUND) when it scrolls into view (>=60% visible).
 *  - Auto-pauses when it scrolls out of view.
 *  - Guarantees only ONE feed video plays at a time (module-level singleton):
 *    whenever any FeedVideo starts playing, every other one is paused.
 *
 * We try to play unmuted first. Browsers block unmuted autoplay until the user
 * has interacted with the page, so if that rejects we transparently fall back
 * to a muted play (and the first user gesture makes later videos play with
 * sound automatically).
 */

// The <video> element currently playing across the whole app.
let activeVideo = null;

// Nearest scrollable ancestor — used as the IntersectionObserver root so
// visibility is correct whether the feed scrolls the window (home feed) or an
// inner container (profile page posts column). Falls back to the viewport.
function getScrollParent(node) {
  let el = node?.parentElement;
  while (el && el !== document.body && el !== document.documentElement) {
    const oy = getComputedStyle(el).overflowY;
    // Must both allow scrolling AND actually be scrollable. (Note: a `body`
    // with `overflow-x: hidden` computes overflow-y to `auto`, so we skip
    // body/html and fall back to the viewport for window-scrolled feeds.)
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null; // viewport / window scroll
}

export default function FeedVideo({ src, className, poster }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Try to play WITH sound; fall back to muted only if the browser's
    // autoplay policy rejects the unmuted play (i.e. before any user gesture).
    const playWithSound = () => {
      video.muted = false;
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          // Autoplay policy blocked sound — retry muted so it still plays.
          video.muted = true;
          const p2 = video.play();
          if (p2 && typeof p2.catch === "function") p2.catch(() => {});
        });
      }
    };

    const handlePlay = () => {
      // Enforce single playback: pause whichever other video was playing.
      if (activeVideo && activeVideo !== video) {
        activeVideo.pause();
      }
      activeVideo = video;
    };
    const handlePause = () => {
      if (activeVideo === video) activeVideo = null;
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          playWithSound();
        } else if (!video.paused) {
          video.pause();
        }
      },
      { root: getScrollParent(video), threshold: [0, 0.6, 1] }
    );
    io.observe(video);

    return () => {
      io.disconnect();
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      if (activeVideo === video) activeVideo = null;
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      controls
      playsInline
      preload="metadata"
      onClick={(e) => e.stopPropagation()}
    />
  );
}
