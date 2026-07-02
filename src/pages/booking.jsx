// src/pages/booking.jsx
import { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import axiosSecure from "../components/utils/axiosSecure";

import ExpertCard from "../components/profileFetch/expertBooking/ExpertCard";
import { resolveProfileRoute } from "../components/utils/getUserProfileRoute";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function ExpertCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-2/3 rounded bg-muted" />
          <div className="h-2.5 w-1/2 rounded bg-muted" />
          <div className="h-2.5 w-1/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-full rounded bg-muted" />
        <div className="h-2.5 w-4/5 rounded bg-muted" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-8 w-20 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function Booking() {
  const { data: loggedUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchExperts(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchExperts = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get(`/v1/experts/?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setItems(Array.isArray(data) ? data : (data?.results || []));
      setNext(data?.next || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load experts");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!next) return;
    try {
      const res = await axiosSecure.get(next);
      const data = res.data;
      const newItems = Array.isArray(data) ? data : (data?.results || []);
      setItems((prev) => [...prev, ...newItems]);
      setNext(data?.next || null);
    } catch (err) {
      console.error("Failed to load more", err);
    }
  };

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
  }, [next]);

  const resolveProfileImage = (expert) => {
    const url = expert.profile_picture || expert.user?.profile_picture;
    const name = expert.user?.first_name || expert.user?.username || "User";
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=1`;
    return url;
  };

  const handleExpertClick = (expert) => {
    if (!expert.user) return;
    navigate(resolveProfileRoute(expert.user, loggedUser));
  };

  const isEmpty = !loading && (!Array.isArray(items) || items.length === 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* HEADER */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Our <span className="text-primary">Experts</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Book consultations with verified professionals across the global QKICS community.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative w-full lg:w-80">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-muted/50 py-3 pl-11 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/40 hover:bg-muted"
            />
          </div>
        </div>

        {/* RESULT COUNT */}
        {!loading && !error && !isEmpty && (
          <p className="mb-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {items.length} expert{items.length === 1 ? "" : "s"}
            {searchQuery && <> for “<span className="text-foreground">{searchQuery}</span>”</>}
          </p>
        )}

        {/* CONTENT */}
        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <p className="text-sm font-bold text-danger">{error}</p>
            <button
              onClick={() => fetchExperts(searchQuery)}
              className="rounded-xl bg-primary px-5 py-2.5 text-2xs font-black uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary-hover"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ExpertCardSkeleton key={i} />)}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              No experts found
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
            {items.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                onClick={handleExpertClick}
                resolveProfileImage={resolveProfileImage}
              />
            ))}
          </div>
        )}

        {/* INFINITE SCROLL SENTINEL */}
        {next && !loading && (
          <div ref={loaderRef} className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
