import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaThLarge,
  FaTags,
  FaUsers,
  FaFileAlt,
  FaCreditCard,
  FaTerminal,
  FaChevronDown,
  FaUserTie,
  FaUserShield,
  FaAppStoreIos,
  FaBullhorn,
  FaBuilding,
  FaVideo,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { MdFeed } from "react-icons/md";

export default function AdminSidebar({ role, isOpen, setIsOpen }) {
  return (
    <aside
      className={`
        relative h-screen flex flex-col transition-all duration-200 ease-in-out z-30 shrink-0
        border-r border-border bg-card text-muted-foreground
        ${isOpen ? "w-64" : "w-[4.5rem]"}
      `}
    >
      {/* BRAND SECTION */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border h-16 transition-colors duration-200">
        <div className="relative flex items-center justify-center min-w-[2rem] w-8 h-8 rounded-lg bg-primary shadow-sm text-primary-foreground font-bold text-sm">
          <img src="/logo.png" className="absolute h-5 w-5 object-contain" alt="logo" />
        </div>
        {isOpen && (
          <span className="text-base font-bold tracking-tight truncate whitespace-nowrap text-foreground">
            QKICS Admin
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        <div className={`px-2 mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground ${!isOpen && "text-center"}`}>
          {isOpen ? "Main Menu" : "•••"}
        </div>

        <SidebarLink to="/admin" label="Dashboard" icon={<FaThLarge />} isOpen={isOpen} />

        <SidebarDropdown
          label="Application"
          icon={<FaAppStoreIos />}
          isOpen={isOpen}
          basePath="/admin-application"
        >
          <SidebarLink to="/admin-application/expert" label="Expert" icon={<FaUserTie />} isOpen={isOpen} isSubitem />
          <SidebarLink to="/admin-application/entrepreneur" label="Entrepreneur" icon={<FaUserShield />} isOpen={isOpen} isSubitem />
        </SidebarDropdown>

        <SidebarLink to="/admin-tags" label="Tags" icon={<FaTags />} isOpen={isOpen} />
        <SidebarLink to="/admin-users" label="Users" icon={<FaUsers />} isOpen={isOpen} />
        <SidebarLink to="/admin-companies" label="Companies" icon={<FaBuilding />} isOpen={isOpen} />
        <SidebarLink to="/admin-posts" label="Posts" icon={<MdFeed />} isOpen={isOpen} />
        <SidebarLink to="/subscriptions" label="Subscriptions" icon={<FaCreditCard />} isOpen={isOpen} />
        <SidebarLink to="/admin-documents" label="Documents" icon={<FaFileAlt />} isOpen={isOpen} />
        <SidebarLink to="/admin-advertisements" label="Advertisements" icon={<FaBullhorn />} isOpen={isOpen} />
        <SidebarLink to="/admin-recordings" label="Recordings" icon={<FaVideo />} isOpen={isOpen} />

        {role === "superadmin" && (
          <div className="pt-5 mt-5 border-t border-border">
            <div className={`px-2 mb-3 text-2xs font-semibold uppercase tracking-wider text-muted-foreground ${!isOpen && "text-center"}`}>
              {isOpen ? "System" : "•••"}
            </div>
            <SidebarLink to="/system-logs" label="Logs" icon={<FaTerminal />} isOpen={isOpen} />
          </div>
        )}
      </nav>

      {/* TOGGLE BUTTON SECTION */}
      <div className="px-1 py-1 border border-border transition-colors duration-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
            text-muted-foreground hover:bg-muted hover:text-foreground
            ${!isOpen ? "justify-center" : ""}
          `}
        >
          <span className="text-base">
            {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </span>
          {isOpen && (
            <span className="text-sm font-medium">Collapse</span>
          )}
        </button>
      </div>

      {/* FOOTER SECTION */}
      <div className="p-4 border-t border-border transition-colors duration-200">
        <div className={`flex items-center transition-all ${isOpen ? "gap-3" : "justify-center"}`}>
          <div className="min-w-[2rem] w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xs ring-2 ring-border bg-primary">
            {role?.[0].toUpperCase()}
          </div>
          {isOpen && (
            <div className="truncate flex-1">
              <p className="text-sm font-semibold truncate text-foreground">{role}</p>
              <p className="text-xs text-muted-foreground truncate">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarDropdown({ label, icon, isOpen, basePath, children }) {
  const location = useLocation();
  const isActiveGroup = location.pathname.startsWith(basePath);
  const [isExpanded, setIsExpanded] = useState(isActiveGroup);

  const toggleDropdown = () => {
    if (!isOpen) return; // Don't toggle if sidebar is collapsed
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-1">
      <button
        onClick={toggleDropdown}
        className={`
          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
          ${isActiveGroup && !isExpanded
            ? "bg-primary-soft text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }
          ${!isOpen ? "justify-center" : ""}
        `}
        title={!isOpen ? label : ""}
      >
        <span className={`text-base ${!isOpen ? "mx-auto" : ""} ${isActiveGroup && !isOpen ? "text-primary" : ""}`}>
          {icon}
        </span>
        {isOpen && (
          <>
            <span className="truncate text-sm whitespace-nowrap flex-1 text-left">{label}</span>
            <FaChevronDown className={`text-2xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {/* Expanded items */}
      {isOpen && isExpanded && (
        <div className="pt-1 pb-1 space-y-1 relative before:content-[''] before:absolute before:left-[1.35rem] before:top-0 before:bottom-2 before:w-px before:bg-border">
          {children}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ to, label, icon, isOpen, isSubitem = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        `
        flex items-center gap-3 py-2 rounded-lg transition-all duration-200 group
        ${isSubitem ? "pl-11 pr-3" : "px-3"}
        ${isActive
          ? "bg-primary-soft text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
        ${!isOpen ? "justify-center" : ""}
        `
      }
      title={!isOpen ? label : ""}
    >
      <span className={`text-base ${!isOpen ? "mx-auto" : ""} ${isSubitem ? "text-sm" : ""}`}>
        {icon}
      </span>
      {isOpen && <span className="truncate text-sm whitespace-nowrap">{label}</span>}
    </NavLink>
  );
}
