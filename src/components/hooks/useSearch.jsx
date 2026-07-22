// src/hooks/useSearch.jsx
// Post search with cursor pagination (infinite scroll) + per-query caching.
// - Aborts stale requests so only the latest query's response is applied.
// - Caches each query's loaded results so tab-switching / re-searching the same
//   term is instant (no refetch). setResults keeps the cache in sync.
import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { normalizePost } from "../utils/normalizePost";

const getClient = () => (getAccessToken() ? axiosSecure : axios);
const apiPrefix = () =>
  getAccessToken() ? "/v1" : `${import.meta.env.VITE_API_URL}/api/v1`;

export default function useSearchPosts() {
  const [loading, setLoading] = useState(false);
  const [results, setRawResults] = useState([]);
  const [next, setNext] = useState(null);
  const [error, setError] = useState(null);

  const loaderRef = useRef(null);
  const nextRef = useRef(null);
  const controllerRef = useRef(null);
  const cacheRef = useRef(new Map()); // query -> { results, next }
  const queryRef = useRef("");

  // setResults wrapper that also keeps the active query's cache fresh, so
  // like/delete/edit updates survive a tab switch + return.
  const setResults = useCallback((updater) => {
    setRawResults((prev) => {
      const nextVal = typeof updater === "function" ? updater(prev) : updater;
      const q = queryRef.current;
      if (q) cacheRef.current.set(q, { results: nextVal, next: nextRef.current });
      return nextVal;
    });
  }, []);

  const searchPosts = useCallback(
    async (query) => {
      const q = (query || "").trim();
      queryRef.current = q;

      // Minimum 3 characters
      if (q.length < 3) {
        setRawResults([]);
        setNext(null);
        nextRef.current = null;
        return;
      }

      // Cache hit → show instantly, no request.
      const cached = cacheRef.current.get(q);
      if (cached) {
        setRawResults(cached.results);
        setNext(cached.next);
        nextRef.current = cached.next;
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();

        const res = await getClient().get(
          `${apiPrefix()}/community/search/?q=${encodeURIComponent(q)}`,
          { signal: controllerRef.current.signal }
        );

        const data = res.data;
        const items = (
          data?.results || (Array.isArray(data) ? data : [])
        ).map(normalizePost);
        const nx = data?.next || null;

        // Ignore if the query changed while this request was in flight.
        if (queryRef.current !== q) return;

        setRawResults(items);
        setNext(nx);
        nextRef.current = nx;
        cacheRef.current.set(q, { results: items, next: nx });
      } catch (err) {
        if (err.name !== "CanceledError") setError("Search failed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    const nx = nextRef.current;
    if (!nx) return;
    try {
      const res = await getClient().get(nx);
      const data = res.data;
      const incoming = (data?.results || []).map(normalizePost);
      const newNext = data?.next || null;

      setRawResults((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...incoming.filter((p) => !seen.has(p.id))];
        const q = queryRef.current;
        if (q) cacheRef.current.set(q, { results: merged, next: newNext });
        return merged;
      });
      setNext(newNext);
      nextRef.current = newNext;
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Search loadMore failed");
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

  return { searchPosts, results, setResults, next, loading, error, loaderRef };
}
