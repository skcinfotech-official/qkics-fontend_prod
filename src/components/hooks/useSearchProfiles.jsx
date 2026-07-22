// Profile search with cursor pagination (infinite scroll) + per-query caching.
// Mirrors useSearchPosts. Hits /auth/search/ (UserSearchCursorPagination).
import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";

const getClient = () => (getAccessToken() ? axiosSecure : axios);
const apiPrefix = () =>
  getAccessToken() ? "/v1" : `${import.meta.env.VITE_API_URL}/api/v1`;

export default function useSearchProfiles() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [next, setNext] = useState(null);

  const loaderRef = useRef(null);
  const nextRef = useRef(null);
  const controllerRef = useRef(null);
  const cacheRef = useRef(new Map()); // query -> { results, next }
  const queryRef = useRef("");

  const searchProfiles = useCallback(async (query) => {
    const q = (query || "").trim();
    queryRef.current = q;

    if (q.length < 2) {
      setResults([]);
      setNext(null);
      nextRef.current = null;
      return;
    }

    const cached = cacheRef.current.get(q);
    if (cached) {
      setResults(cached.results);
      setNext(cached.next);
      nextRef.current = cached.next;
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();

      const res = await getClient().get(
        `${apiPrefix()}/auth/search/?q=${encodeURIComponent(q)}`,
        { signal: controllerRef.current.signal }
      );

      const data = res.data;
      const items = Array.isArray(data) ? data : data?.results || [];
      const nx = data?.next || null;

      if (queryRef.current !== q) return;

      setResults(items);
      setNext(nx);
      nextRef.current = nx;
      cacheRef.current.set(q, { results: items, next: nx });
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Profile search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    const nx = nextRef.current;
    if (!nx) return;
    try {
      const res = await getClient().get(nx);
      const data = res.data;
      const incoming = Array.isArray(data) ? data : data?.results || [];
      const newNext = data?.next || null;

      setResults((prev) => {
        const seen = new Set(prev.map((u) => u.id));
        const merged = [...prev, ...incoming.filter((u) => !seen.has(u.id))];
        const q = queryRef.current;
        if (q) cacheRef.current.set(q, { results: merged, next: newNext });
        return merged;
      });
      setNext(newNext);
      nextRef.current = newNext;
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Profile loadMore failed");
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

  return { searchProfiles, results, next, loading, loaderRef };
}
