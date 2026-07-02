import { useEffect, useState, useRef } from "react";
import axiosSecure from "../components/utils/axiosSecure";
import InvestorCard from "../components/profileFetch/investorFetch/InvestorCard";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { PageHeader, FullPageLoader, EmptyState, LoadingSpinner } from "../components/ui";

export default function EntrepreneurConnect() {
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
      fetchInvestors(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchInvestors = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get(`/v1/investors/?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setItems(Array.isArray(data) ? data : (data?.results || []));
      setNext(data?.next || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load investors");
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

  const goToUserProfile = (user) => {
    if (!loggedUser) {
      navigate(`/profile/${user.username}`);
      return;
    }

    if (loggedUser.username === user.username) {
      switch (loggedUser.user_type) {
        case "expert": navigate("/expert"); break;
        case "entrepreneur": navigate("/entrepreneur"); break;
        case "investor": navigate("/investor"); break;
        case "admin": navigate("/admin"); break;
        case "superadmin": navigate("/superadmin"); break;
        default: navigate("/normal");
      }
      return;
    }
    navigate(`/profile/${user.username}`);
  };

  if (loading) {
    return <FullPageLoader label="Mapping Investors..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-danger font-bold uppercase tracking-widest bg-background">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto md:pb-12 bg-background text-foreground">
      <PageHeader
        title={<>Connect with <span className="text-primary">Investors</span></>}
        description="Connect with strategic investors in the global QKICS community."
        size="lg"
        align="end"
      >
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 px-5 py-3 rounded-full text-sm font-bold border border-input bg-muted text-foreground placeholder:text-muted-foreground focus:border-primary hover:bg-muted/70 transition-all outline-none"
          />
        </div>
      </PageHeader>

      {(!Array.isArray(items) || items.length === 0) ? (
        <EmptyState title="No investors discovered yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fadeIn">
          {items?.map((item) => (
            <InvestorCard
              key={item.id}
              investor={item}
              onClick={(investor) => goToUserProfile(investor.user)}
            />
          ))}
        </div>
      )}

      {next && (
        <div ref={loaderRef} className="py-8 flex justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
