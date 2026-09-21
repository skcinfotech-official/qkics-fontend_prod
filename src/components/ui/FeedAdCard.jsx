// src/components/ui/FeedAdCard.jsx
//
// In-feed sponsored card — rendered after every 10th post on screens below
// `xl`, where the right sidebar (SponsorCard) is not visible. Desktop keeps
// ads in the sidebar only, so this card is `xl:hidden` by default.
import { useState } from "react";
import { FaVolumeXmark, FaVolumeHigh, FaArrowUpRightFromSquare } from "react-icons/fa6";
import { resolveMedia } from "../utils/mediaUrl";
import ClampedText from "./ClampedText";

export default function FeedAdCard({ ad, className = "xl:hidden" }) {
  const [muted, setMuted] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  const mediaSrc = resolveMedia(ad?.file_url);
  const isVideo = String(ad?.media_type).toLowerCase() === "video";
  const description = ad?.description || "";

  if (!ad || !mediaSrc || mediaError) return null;

  const openLink = () => window.open(ad.redirect_url, "_blank", "noopener,noreferrer");

  return (
    <article className={`premium-card overflow-hidden bg-card text-foreground animate-fadeIn ${className}`}>
      <header className="px-4 pt-4 sm:px-6 sm:pt-5 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Sponsored</p>
      </header>

      <div className="px-4 pt-3 sm:px-6">
        <div className="relative overflow-hidden rounded-xl bg-muted cursor-pointer" onClick={openLink}>
          {isVideo ? (
            <>
              <video
                src={mediaSrc}
                autoPlay
                muted={muted}
                loop
                playsInline
                preload="metadata"
                className="w-full aspect-video object-cover"
                onError={() => setMediaError(true)}
              />
              <button
                type="button"
                aria-label={muted ? "Unmute" : "Mute"}
                onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm"
              >
                {muted ? <FaVolumeXmark size={14} /> : <FaVolumeHigh size={14} />}
              </button>
            </>
          ) : (
            <img
              src={mediaSrc}
              alt={ad.title || "Sponsored"}
              loading="lazy"
              className="w-full aspect-video object-cover"
              onError={() => setMediaError(true)}
            />
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
        {ad.title && (
          <h2 className="text-base sm:text-lg font-bold leading-tight tracking-tight line-clamp-2">{ad.title}</h2>
        )}

        {description && (
          <div className="mt-1.5">
            <ClampedText text={description} lines={2} className="text-sm leading-relaxed text-muted-foreground font-medium" />
          </div>
        )}

        <a
          href={ad.redirect_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary-hover transition-all"
        >
          {ad.button_text || "Learn More"}
          <FaArrowUpRightFromSquare size={11} />
        </a>
      </div>
    </article>
  );
}
