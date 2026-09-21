// src/components/hooks/useActiveAds.jsx
//
// Fetches the currently-running sponsored placements ONCE per page load and
// shares them between the desktop sidebar (SponsorCard) and the in-feed card
// (FeedAdCard). Module-level cache so mounting both never double-requests.
import { useState, useEffect } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";

let cached = null;      // resolved list
let inflight = null;    // pending promise

const fetchAds = () => {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  const token = getAccessToken();
  const url = token ? "/v1/ads/active/" : `${import.meta.env.VITE_API_URL}/api/v1/ads/active/`;
  const client = token ? axiosSecure : axios;
  inflight = client
    .get(url)
    .then(({ data }) => {
      cached = Array.isArray(data) ? data : [];
      return cached;
    })
    .catch(() => []) // adblock / network — show nothing, never break the feed
    .finally(() => { inflight = null; });
  return inflight;
};

export default function useActiveAds() {
  const [ads, setAds] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let alive = true;
    fetchAds().then((list) => {
      if (!alive) return;
      setAds(list);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return { ads, loading };
}

/**
 * Feed injection rule (shared with the mobile app — see IN_FEED_ADS_API.md):
 * an ad slot opens after every `every`-th post. Slot k shows ads[k % ads.length]
 * so rotation is deterministic and never repeats back-to-back.
 * If the feed has ended with fewer than `every` posts, one ad is shown after
 * the last post so short feeds still get a single placement.
 *
 * @returns {object|null} the ad to render after post `index`, or null
 */
export const adAfterPost = (ads, index, total, hasMore, every = 10) => {
  if (!ads || ads.length === 0) return null;
  const position = index + 1;
  if (position % every === 0) {
    return ads[(position / every - 1) % ads.length];
  }
  if (!hasMore && total < every && position === total) {
    return ads[0];
  }
  return null;
};
