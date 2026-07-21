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

export default function useVideoFeed() {
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
      setPosts(parsed.results.map(normalizePost));
      setNext(parsed.next);
      nextRef.current = parsed.next;
    } catch (err) {
      console.error("useVideoFeed: loadFeed failed", err);
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    const currentNext = nextRef.current;
    if (!currentNext) return;
    try {
      const res = await getClient().get(currentNext);
      const parsed = extractResults(res.data);
      setPosts((prev) => [...prev, ...parsed.results.map(normalizePost)]);
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
