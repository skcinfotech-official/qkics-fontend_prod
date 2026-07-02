// src/components/navbar.jsx
//
// Styling migrated to design tokens (bg-card / text-foreground / bg-muted /
// border-border / text-primary). Dark mode now flips automatically — no more
// `isDark ? … : …` ternaries for surfaces. Logic/structure unchanged.

import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  FaUser, FaKey, FaSignOutAlt, FaSearch, FaTimes, FaFileAlt,
  FaAddressBook, FaHandshake, FaChevronDown, FaChevronUp, FaChevronRight, FaBuilding,
} from "react-icons/fa";
import { FaUsersGear, FaCrown } from "react-icons/fa6";
import { IoChatboxEllipses } from "react-icons/io5";
import { MdNotificationsActive } from "react-icons/md";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

import useClickOutside from "./hooks/useClickOutside";
import { getOwnProfileRoute } from "./utils/getUserProfileRoute";
import { resolveAvatar } from "./utils/mediaUrl";
import { useNotifications } from "../context/NotificationContext";

// Non-throwing — Navbar can render outside UserLayout; falls back to props.
import { useUserLayoutOptional } from "../layouts/Userlayoutcontext";

function Navbar({ theme, onToggleTheme, user, onOpenLogin }) {
  const picVersion   = useSelector((state) => state.user.picVersion || 0);
  const isDark       = theme === "dark";
  const navigate     = useNavigate();
  const location     = useLocation();
  const { unreadCount } = useNotifications();

  // Modal openers live in UserLayout; fall back to props when rendered standalone.
  const layoutCtx = useUserLayoutOptional();
  const openLogin      = layoutCtx?.openLogin      ?? onOpenLogin      ?? (() => {});
  const openChangePass = layoutCtx?.openChangePass ?? (() => {});

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getNavClass = (path) => {
    const isActive = location.pathname === path;
    const base = "flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 text-2xs font-bold uppercase tracking-wider group";
    return isActive
      ? `${base} bg-muted text-primary shadow-sm`
      : `${base} text-muted-foreground hover:bg-muted hover:text-foreground`;
  };

  const megaItemClass =
    "w-full text-left block px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted";

  // ── Local state (only things that belong to the navbar UI itself) ────────
  const [searchQuery,      setSearchQuery]      = useState("");
  const [dropdown,         setDropdown]         = useState(false);
  const [searchMobile,     setSearchMobile]     = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [entDropdown,      setEntDropdown]      = useState(false);

  const isLoggedIn       = !!user;
  const searchInputRef   = useRef(null);
  const desktopSearchRef = useRef(null);
  const dropdownRef      = useRef(null);

  useClickOutside(desktopSearchRef, () => { if (!searchQuery) setIsSearchExpanded(false); });
  useClickOutside(dropdownRef, () => setDropdown(false));

  const clearSearch   = () => setSearchQuery("");
  const triggerSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=posts`);
    setSearchMobile(false);
  };
  const handleSearchKeyDown = (e) => { if (e.key === "Enter") triggerSearch(); };

  const goToProfile = () => {
    setDropdown(false);
    if (!user) return navigate("/");
    if (user.user_type === "admin" || user.user_type === "superadmin") {
      return navigate(user.user_type === "superadmin" ? "/superadmin" : "/admin");
    }
    navigate(getOwnProfileRoute(user.user_type, user.username));
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 border-b border-border backdrop-blur-xl supports-backdrop-filter:bg-opacity-60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-6">

          {/* LOGO */}
          <Link to="/" className="flex-shrink-0 group relative">
            <div className="absolute -inset-2 rounded-xl blur-lg transition-all opacity-0 group-hover:opacity-100 bg-primary/10" />
            <img src="/logo.png" alt="logo" className="h-12 lg:h-14 w-auto relative rounded-lg transform transition-transform duration-300 group-hover:scale-105" />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-3 p-1.5 rounded-3xl border border-border bg-muted/50 backdrop-blur-md transition-all duration-300">

            <Link to="/">
              <button className={getNavClass("/")} title="Home">
                {isSearchExpanded
                  ? <span className="text-xs animate-fadeIn">🏠</span>
                  : <span className="text-xs animate-fadeIn">Home</span>}
              </button>
            </Link>

            <button
              onClick={() => !isLoggedIn ? openLogin() : navigate("/experts")}
              className={getNavClass("/experts")}
              title="Experts"
            >
              {isSearchExpanded
                ? <FaUsersGear className="text-sm animate-fadeIn" />
                : <span className="text-xs animate-fadeIn">Experts</span>}
            </button>

            {/* MEGA DROPDOWN — Entrepreneurial Connect */}
            <div
              className="relative h-full flex flex-col justify-center"
              onMouseEnter={() => setEntDropdown(true)}
              onMouseLeave={() => setEntDropdown(false)}
            >
              <button className={getNavClass("/entrepreneur-connect")} title="Entrepreneurial Connect">
                {isSearchExpanded
                  ? <FaHandshake className="text-xs animate-fadeIn" />
                  : (
                    <span className="text-xs animate-fadeIn flex items-center gap-2">
                      ENTREPRENEURIAL CONNECT
                      {entDropdown ? <FaChevronUp className="text-2xs" /> : <FaChevronDown className="text-2xs" />}
                    </span>
                  )}
              </button>

              {entDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[850px] max-w-[calc(100vw-2rem)] z-50 animate-fadeInOut">
                  <div className="rounded-3xl shadow-2xl border border-border p-6 flex gap-8 bg-card">
                    <div className="flex-1 flex flex-col pt-1">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-primary ml-2">Knowledge Hub</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => { if (!isLoggedIn) openLogin(); else { navigate("/knowledge-hub"); setEntDropdown(false); } }}
                          className={megaItemClass}
                        >Researched Based Feed</button>
                        <button
                          onClick={() => { if (!isLoggedIn) openLogin(); else { navigate("/document"); setEntDropdown(false); } }}
                          className={megaItemClass}
                        >Documents</button>
                      </div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="flex-1 flex flex-col pt-1">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-primary ml-2">Investor Linkups</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => { if (!isLoggedIn) openLogin(); else { navigate("/entrepreneur-connect"); setEntDropdown(false); } }}
                          className={megaItemClass}
                        >Investors</button>
                      </div>
                    </div>
                    <div className="w-px bg-border" />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => !isLoggedIn ? openLogin() : navigate("/document")}
              className={getNavClass("/document")}
              title="Documents"
            >
              {isSearchExpanded
                ? <FaFileAlt className="text-sm animate-fadeIn" />
                : <span className="text-xs animate-fadeIn">Documents</span>}
            </button>

            <button
              onClick={() => !isLoggedIn ? openLogin() : navigate("/company")}
              className={getNavClass("/company")}
              title="Company"
            >
              {isSearchExpanded
                ? <FaBuilding className="text-sm animate-fadeIn" />
                : <span className="text-xs animate-fadeIn">Company</span>}
            </button>
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3 flex-1 justify-end">

            {/* SEARCH ICON — mobile only */}
            <button
              onClick={() => setSearchMobile(true)}
              className="lg:hidden h-11 w-11 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/70 transition-all"
            >
              <FaSearch size={16} />
            </button>

            {/* SEARCH BAR — desktop */}
            <div className="hidden lg:flex flex-1 justify-end max-w-sm relative group" ref={desktopSearchRef}>
              <div
                onClick={() => setIsSearchExpanded(true)}
                className={`flex items-center transition-all duration-300 overflow-hidden cursor-pointer border ${
                  isSearchExpanded
                    ? "w-full max-w-sm gap-3 rounded-2xl px-4 py-2.5 bg-card border-border shadow-xl"
                    : "w-11 h-11 rounded-xl justify-center bg-muted border-transparent text-muted-foreground hover:bg-muted/70"
                }`}
              >
                <FaSearch className={`transition-colors flex-shrink-0 ${isSearchExpanded ? "text-primary" : "text-inherit"}`} />
                {isSearchExpanded && (
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search discovery..."
                    className="bg-transparent outline-none w-full text-sm font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground"
                  />
                )}
                {isSearchExpanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); searchQuery ? clearSearch() : setIsSearchExpanded(false); }}
                    className="hover:text-primary transition-colors flex-shrink-0"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">

              {/* PREMIUM */}
              <button
                className="hidden xl:flex items-center gap-2 px-4 py-2.5 rounded-xl text-2xs font-black uppercase tracking-widest text-white bg-linear-to-r from-red-600 to-rose-600 hover:shadow-lg hover:shadow-red-600/30 hover:scale-105 transition-all active:scale-95"
                onClick={() => navigate("/subscription")}
              >
                <FaCrown size={15} className="text-yellow-300" />
                <span>Premium</span>
              </button>

              {/* NOTIFICATIONS */}
              {isLoggedIn && (
                <button
                  onClick={() => navigate("/notifications")}
                  className={`${getNavClass("/notifications")} relative`}
                  title="Notifications"
                >
                  <MdNotificationsActive size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-2xs font-bold text-white shadow-md">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* THEME TOGGLE */}
              <button
                onClick={onToggleTheme}
                className="h-11 w-11 rounded-xl flex items-center justify-center bg-muted text-foreground hover:bg-muted/70 transition-all duration-300 active:scale-90"
              >
                <FontAwesomeIcon
                  icon={isDark ? faSun : faMoon}
                  className={`text-lg ${isDark ? "text-yellow-400" : "text-muted-foreground"}`}
                />
              </button>

              {/* LOGIN / JOIN or AVATAR DROPDOWN */}
              {!isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={openLogin}
                    className="px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted transition-all"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => layoutCtx?.openSignup?.()}
                    className="px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-foreground text-background shadow-xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all"
                  >
                    Join
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdown((v) => !v)}
                    className="h-9 w-9 overflow-hidden rounded-xl ring-2 ring-border ring-offset-2 ring-offset-background transition-all duration-300 hover:ring-primary"
                  >
                    <UserAvatar user={user} picVersion={picVersion} />
                  </button>

                  {dropdown && (
                    <div className="absolute right-0 z-[100] mt-3 w-64 origin-top-right animate-pop overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                      {/* HEADER */}
                      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-3.5 py-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-2 ring-card">
                          <UserAvatar user={user} picVersion={picVersion} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-foreground">
                              {user.first_name || user.username}
                            </p>
                            {user.is_subscribed && (
                              <FaCrown className="shrink-0 text-amber-500" size={12} />
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <p className="truncate text-2xs text-muted-foreground">@{user.username}</p>
                            <span className="inline-flex shrink-0 rounded-full bg-primary-soft px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wide text-primary">
                              {user.user_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ITEMS */}
                      <div className="p-1.5">
                        <DropdownItem onClick={goToProfile}                                             icon={<FaUser />}            label="My Profile"   />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/my-company"); }}  icon={<FaBuilding />}        label="My Company"   />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/chat"); }}        icon={<IoChatboxEllipses />} label="Messages"     />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/my-bookings"); }} icon={<FaAddressBook />}     label="My Bookings"  />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/subscription"); }} icon={<FaCrown />}          label="Subscription" />
                        <div className="my-1.5 border-t border-border" />
                        <DropdownItem onClick={() => { setDropdown(false); openChangePass(); }}         icon={<FaKey />}             label="Security"     />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/logout"); }}      icon={<FaSignOutAlt />}      label="Logout" danger />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH OVERLAY */}
        {searchMobile && (
          <div className="lg:hidden absolute inset-0 z-60 flex items-center px-4 animate-fadeIn bg-card">
            <div className="flex items-center w-full gap-3 rounded-2xl px-4 py-2 border border-border bg-muted">
              <FaSearch className="text-primary" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search discovery..."
                className="bg-transparent outline-none w-full text-sm font-bold text-foreground"
              />
              <button
                onClick={() => { setSearchMobile(false); clearSearch(); }}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-muted"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Spacer so page content clears the fixed header */}
      <div className="h-16 lg:h-20" />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ user, picVersion }) {
  if (user?.profile_picture) {
    return (
      <img
        src={`${resolveAvatar(user.profile_picture, user.username)}?v=${picVersion}`}
        alt="profile"
        className="h-full w-full object-cover"
      />
    );
  }
  const initials = (user?.username || user?.first_name || "?").slice(0, 2).toUpperCase();
  return (
    <div className="h-full w-full flex items-center justify-center text-sm font-black bg-muted text-foreground">
      {initials}
    </div>
  );
}

function DropdownItem({ onClick, icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all ${
        danger ? "text-danger hover:bg-danger/10" : "text-foreground hover:bg-muted"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
          danger
            ? "bg-danger/10 text-danger"
            : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      <FaChevronRight
        size={10}
        className={`shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 ${
          danger ? "text-danger" : "text-muted-foreground"
        }`}
      />
    </button>
  );
}

export default Navbar;
