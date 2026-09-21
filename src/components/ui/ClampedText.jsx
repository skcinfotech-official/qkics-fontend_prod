// src/components/ui/ClampedText.jsx
//
// Body text clamped to N lines with a "See more / See less" toggle that only
// appears when the text actually overflows. Used by the ad cards (sidebar +
// in-feed) so both surfaces behave identically.
import { useState, useRef, useEffect } from "react";

const CLAMP = { 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4" };

export default function ClampedText({ text, lines = 2, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [text, expanded]);

  if (!text) return null;

  return (
    <div>
      <p ref={ref} className={`whitespace-pre-wrap ${expanded ? "" : CLAMP[lines] || CLAMP[2]} ${className}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className={`mt-2 text-xs font-black uppercase tracking-widest transition-colors ${expanded ? "text-muted-foreground hover:text-primary" : "text-primary hover:text-primary-hover"}`}
        >
          {expanded ? "See less ▲" : "See more ▼"}
        </button>
      )}
    </div>
  );
}
