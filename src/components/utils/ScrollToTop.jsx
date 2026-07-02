import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets scroll to the top on every route (pathname) change.
 * Without this, navigating between pages keeps the previous scroll
 * position, so the new page appears already scrolled down.
 *
 * Pages that want to preserve/restore their own scroll (e.g. the feed
 * returning from a post's comments) run their own effect after their
 * data loads, which fires later and overrides this reset.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
