// src/components/posts/ShortsPlayer.jsx
// YouTube-Shorts-style player used in the immersive video feed.
//  - Scroll-aware: autoplays (with sound) when >=60% visible, pauses otherwise.
//  - Only ONE ShortsPlayer plays at a time (module-level singleton).
//  - Custom, compact controls (NOT native): tap to play/pause, mute toggle,
//    and a slim seek bar with time below the video — so nothing sprawls across
//    the screen on desktop.
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

let activeShort = null;

function getScrollParent(node) {
  let el = node?.parentElement;
  while (el && el !== document.body && el !== document.documentElement) {
    const oy = getComputedStyle(el).overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

const fmt = (s) => {
  if (!s || Number.isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function ShortsPlayer({ src, scrollRootRef }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const playWithSound = () => {
      video.muted = false;
      setMuted(false);
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          video.muted = true;
          setMuted(true);
          const p2 = video.play();
          if (p2 && typeof p2.catch === "function") p2.catch(() => {});
        });
      }
    };

    const onPlay = () => {
      setPlaying(true);
      if (activeShort && activeShort !== video) activeShort.pause();
      activeShort = video;
    };
    const onPause = () => {
      setPlaying(false);
      if (activeShort === video) activeShort = null;
    };
    const onTime = () => {
      setCurrent(video.currentTime);
      if (video.duration) setProgress(video.currentTime / video.duration);
    };
    const onMeta = () => setDuration(video.duration || 0);
    const onVolume = () => setMuted(video.muted);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("volumechange", onVolume);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          playWithSound();
        } else if (!video.paused) {
          video.pause();
        }
      },
      {
        root: scrollRootRef?.current || getScrollParent(video),
        threshold: [0, 0.6, 1],
      }
    );
    io.observe(video);

    return () => {
      io.disconnect();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("volumechange", onVolume);
      if (activeShort === video) activeShort = null;
    };
  }, [src, scrollRootRef]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (e) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  };

  return (
    <div className="relative h-full w-full" onClick={toggle}>
      <video
        ref={ref}
        src={src}
        playsInline
        preload="metadata"
        className="h-full w-full object-contain"
      />

      {/* Center play badge when paused */}
      {!playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 pl-1 text-white backdrop-blur-sm">
            <FaPlay size={24} />
          </span>
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-all hover:bg-black/65 active:scale-90"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <FaVolumeMute size={15} /> : <FaVolumeUp size={15} />}
      </button>

      {/* Seek bar + time — sits at the bottom of the video */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 px-3 pb-2 pt-8 bg-gradient-to-t from-black/70 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={seek}
          className="group/seek flex h-3 cursor-pointer items-center"
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25 transition-all group-hover/seek:h-2">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-1 flex justify-between text-3xs font-bold tabular-nums text-white/80">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
