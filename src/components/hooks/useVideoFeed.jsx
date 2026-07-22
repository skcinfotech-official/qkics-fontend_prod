// src/components/hooks/useVideoFeed.jsx
// Infinite-scroll feed of video posts (FB Watch / Reels style).
// Mirrors useFeed but hits the dedicated /community/posts/videos/ endpoint
// which returns only posts that contain at least one video.
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { normalizePost } from "../utils/normalizePost";

const extractResults = (data) =>
  Array.isArray(data)
    ? { results: data, next: null }
    : { results: data.results || [], next: data.next || null };

const getClient = () => (getAccessToken() ? axiosSecure : axios);

export default function useVideoFeed(startId) {
  const [posts, setPosts] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loaderRef = useRef(null);
  const nextRef = useRef(null);

  const loadFeed = useCallback(async () => {
    const token = getAccessToken();
    const prefix = token ? "/v1" : `${import.meta.env.VITE_API_URL}/api/v1`;

    setPosts([]);
    setNext(null);
    nextRef.current = null;
    setError(null);
    setLoading(true);

    try {
      const res = await getClient().get(`${prefix}/community/posts/videos/`);
      const parsed = extractResults(res.data);
      let results = parsed.results.map(normalizePost);

      // The user tapped a specific video (from home or a profile). The global
      // feed only returns the newest page, so that exact post may not be in it
      // — guarantee it opens by pinning it to the FRONT of the feed. If it's
      // already loaded we just hoist it; otherwise we fetch it directly.
      if (startId != null) {
        const sid = String(startId);
        const existing = results.find((p) => String(p.id) === sid);
        if (existing) {
          results = [existing, ...results.filter((p) => String(p.id) !== sid)];
        } else {
          try {
            const one = await getClient().get(
              `${prefix}/community/posts/${sid}/`
            );
            const startPost = normalizePost(one.data);
            if (startPost && startPost.id != null) {
              results = [
                startPost,
                ...results.filter((p) => String(p.id) !== sid),
              ];
            }
          } catch {
            // Post gone / not accessible — fall back to the plain global feed.
          }
        }
      }

      setPosts(results);
      setNext(parsed.next);
      nextRef.current = parsed.next;
    } catch (err) {
      console.error("useVideoFeed: loadFeed failed", err);
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startId]);

  const loadMore = useCallback(async () => {
    const currentNext = nextRef.current;
    if (!currentNext) return;
    try {
      const res = await getClient().get(currentNext);
      const parsed = extractResults(res.data);
      const incoming = parsed.results.map(normalizePost);
      setPosts((prev) => {
        // Drop anything already shown (e.g. the pinned start post) so it
        // doesn't appear twice while scrolling.
        const seen = new Set(prev.map((p) => String(p.id)));
        return [...prev, ...incoming.filter((p) => !seen.has(String(p.id)))];
      });
      setNext(parsed.next);
      nextRef.current = parsed.next;
    } catch (err) {
      console.error("useVideoFeed: loadMore failed", err);
    }
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [next, loadMore]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return { posts, setPosts, loaderRef, next, loading, error, reload: loadFeed };
}
