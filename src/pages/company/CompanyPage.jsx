import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import CompanyPostCard from "./components/CompanyPostCard";
import CompanyCard from "./components/CompanyCard"; 
import { useAlert } from "../../context/AlertContext";
import { FaBuilding, FaThList, FaRegNewspaper, FaArrowLeft } from "react-icons/fa";
import SponsorCard from "../../components/ui/SponsorCard";
import ConfirmationAlert from "../../components/ui/ConfirmationAlert";
import { useNavigate } from "react-router-dom";

export default function CompanyPage() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  /* ----------------------------
      TABS STATE
  ----------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("companyActiveTab") || "posts"
  );

  useEffect(() => {
    sessionStorage.setItem("companyActiveTab", activeTab);
  }, [activeTab]);

  /* ----------------------------
      POSTS STATE
  ----------------------------- */
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [pagePosts, setPagePosts] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState(null);
  const [myCompanyIds, setMyCompanyIds] = useState([]);

  /* ----------------------------
      COMPANIES STATE
  ----------------------------- */
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
  const [pageCompanies, setPageCompanies] = useState(1);

  /* ----------------------------
      OBSERVER (INFINITE SCROLL)
  ----------------------------- */
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      const loading = activeTab === "posts" ? loadingPosts : loadingCompanies;
      const hasMore = activeTab === "posts" ? hasMorePosts : hasMoreCompanies;
      
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          if (activeTab === "posts") {
            setPagePosts((prev) => prev + 1);
          } else {
            setPageCompanies((prev) => prev + 1);
          }
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingPosts, loadingCompanies, hasMorePosts, hasMoreCompanies, activeTab]
  );

  /* ----------------------------
      FETCHING LOGIC
  ----------------------------- */
  const fetchGlobalCompanyPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await axiosSecure.get("/v1/companies/posts/", {
        params: { page: pagePosts },
      });
      const data = res.data?.results || res.data || [];
      const newPosts = Array.isArray(data) ? data : [];
      setPosts((prev) => (pagePosts === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMorePosts(!!res.data.next);
    } catch (err) {
      console.error("Error fetching global company posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchCompaniesList = async () => {
    try {
      setLoadingCompanies(true);
      const res = await axiosSecure.get("/v1/companies/list/", {
        params: { page: pageCompanies },
      });
      const data = res.data?.results || res.data || [];
      const newCompanies = Array.isArray(data) ? data : [];
      setCompanies((prev) => (pageCompanies === 1 ? newCompanies : [...prev, ...newCompanies]));
      setHasMoreCompanies(!!res.data.next);
    } catch (err) {
      console.error("Error fetching companies list:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchMyCompanies = async () => {
    try {
      const res = await axiosSecure.get("/v1/companies/my/");
      const results = res.data?.results || [];
      setMyCompanyIds(results.map(c => c.id));
    } catch (err) {
      console.error("Error fetching my companies:", err);
    }
  };

  useEffect(() => {
    fetchMyCompanies();
  }, []);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchGlobalCompanyPosts();
    }
  }, [pagePosts, activeTab]);

  useEffect(() => {
    if (activeTab === "companies") {
      fetchCompaniesList();
    }
  }, [pageCompanies, activeTab]);

  /* ----------------------------
      DELETE LOGIC
  ----------------------------- */
  const handleDeleteClick = (postId) => {
    setPostIdToDelete(postId);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = async () => {
    if (!postIdToDelete) return;
    try {
      await axiosSecure.delete(`/v1/companies/posts/${postIdToDelete}/delete/`);
      setPosts((prev) => prev.filter((p) => p.id !== postIdToDelete));
      showAlert("Post deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting post:", err);
      showAlert("Error deleting post", "error");
    } finally {
      setShowDeleteConfirm(false);
      setPostIdToDelete(null);
    }
  };

  const text = isDark ? "text-white" : "text-black";

  return (
    <div className={`min-h-screen py-4 ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* HEADER & TABS SELECTOR */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-fadeIn">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              {/* <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-600">
                <FaBuilding size={20} />
              </div> */}
              <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${text}`}>
                Company <span className="text-red-600">Discovery</span>
              </h1>
            </div>
            <p className={`text-sm tracking-wide font-medium leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              Explore insights, updates, and innovations from across the organization. Track and manage your expert intelligence exchange.
            </p>
          </div>

          {/*
          want to add search functionality later, but it requires backend support for searching/filtering companies and posts. For now, we'll keep the UI clean and focused on discovery.
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full md:w-80 px-5 py-3 rounded-full text-sm font-bold border transition-all ${isDark
                ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500 hover:bg-white/10"
                : "bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-red-500 hover:bg-black/10"
              } outline-none`}
          /> */}
          
          <div className="flex-shrink-0">
            <div className={`inline-flex p-1.5 rounded-2xl shadow-xl transition-all ${isDark ? "bg-white/5" : "bg-black/5"}`}>
              {[
                { id: "posts", label: "Posts", icon: <FaRegNewspaper size={14} /> },
                { id: "companies", label: "Companies", icon: <FaThList size={14} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-2.5 md:px-8 md:py-3 rounded-xl text-2xs font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="animate-fadeIn">
          {/* POSTS TAB */}
          {activeTab === "posts" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT SIDEBAR (Empty for centering) */}
              <aside className="hidden lg:block lg:col-span-3" />

              {/* MAIN COLUMN (CENTER) */}
              <div className="col-span-12 lg:col-span-6 space-y-8">
                <div className="w-full space-y-6">
                  {posts.length > 0 ? (
                    posts.map((post, index) => {
                      const nodeRef = posts.length === index + 1 ? lastElementRef : null;
                      return (
                        <div ref={nodeRef} key={post.id}>
                          <CompanyPostCard 
                            post={post} 
                            isDark={isDark}                              
                          />
                        </div>
                      );
                    })
                  ) : (
                    !loadingPosts && (
                      <div className="text-center py-24 animate-fadeIn glass rounded-3xl border border-dashed border-red-500/10">
                        <FaRegNewspaper size={48} className="mx-auto mb-6 opacity-10 text-red-500" />
                        <p className={`text-lg font-bold opacity-30 ${text}`}>No company posts discovered yet.</p>
                        <p className={`text-2xs uppercase font-black tracking-widest opacity-20 mt-2 ${text}`}>Post insights to start the conversation</p>
                      </div>
                    )
                  )}
                  {loadingPosts && (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-2xs font-black uppercase tracking-widest opacity-30">Synchronizing Posts...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDEBAR (ADS) */}
              <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-24 space-y-8">
                      <SponsorCard isDark={isDark} />
                  </div>
              </aside>
            </div>
          )}

          {/* COMPANIES TAB */}
          {activeTab === "companies" && (
            <div className="animate-fadeIn">
              {companies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {companies.map((company, index) => {
                    const nodeRef = companies.length === index + 1 ? lastElementRef : null;
                    return (
                      <div ref={nodeRef} key={company.id}>
                        <CompanyCard company={company} isDark={isDark} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                !loadingCompanies && (
                  <div className="text-center py-24 animate-fadeIn glass rounded-3xl border border-dashed border-red-500/10">
                    <FaBuilding size={48} className="mx-auto mb-6 opacity-10 text-red-500" />
                    <p className={`text-lg font-bold opacity-30 ${text}`}>No organizations discovered yet.</p>
                    <p className={`text-2xs uppercase font-black tracking-widest opacity-20 mt-2 ${text}`}>Be the first to list your company</p>
                  </div>
                )
              )}
              {loadingCompanies && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-2xs font-black uppercase tracking-widest opacity-30">Gathering Intelligence...</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {showDeleteConfirm && (
        <ConfirmationAlert
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete"
          onConfirm={confirmDeletePost}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setPostIdToDelete(null);
          }}
        />
      )}
    </div>
  );
}

