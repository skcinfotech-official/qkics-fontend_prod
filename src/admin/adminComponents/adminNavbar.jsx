import { FaSignOutAlt, FaBars, FaTimes, FaBell, FaSearch } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar({ theme, onToggleTheme, toggleSidebar, isSidebarOpen }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 w-full h-16 px-6 flex items-center justify-between transition-colors duration-200 border-b border-border bg-card text-foreground">
      <div className="flex items-center gap-4">
        {/* SIDEBAR TOGGLE */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <FaBars className={`text-lg absolute transition-all duration-200 ${isSidebarOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
            <FaTimes className={`text-lg absolute transition-all duration-200 ${!isSidebarOpen ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
          </div>
        </button>

        {/* BREADCRUMB OR TITILE */}
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-base font-semibold capitalize text-foreground">
            {window.location.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, ' ') || "Dashboard"}
          </h1>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 sm:gap-4">

        {/* SEARCH & NOTIFICATION (Mocks for UI) */}
        <div className="hidden sm:flex items-center gap-1 mr-2">
          <button className="p-2 rounded-md transition-colors duration-200 text-muted-foreground hover:bg-muted hover:text-foreground">
            <FaSearch className="text-sm" />
          </button>
          <button className="relative p-2 rounded-md transition-colors duration-200 text-muted-foreground hover:bg-muted hover:text-foreground">
            <FaBell className="text-sm" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary"></span>
          </button>
        </div>

        <div className="w-px h-6 hidden sm:block bg-border"></div>

        {/* THEME TOGGLE BUTTON */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="text-sm" />
        </button>

        {/* LOGOUT BUTTON */}
        <button
          onClick={() => navigate("/logout")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 bg-transparent text-muted-foreground hover:bg-muted hover:text-danger"
        >
          <FaSignOutAlt className="text-sm" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
