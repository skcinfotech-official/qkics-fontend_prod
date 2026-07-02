import { FaBuilding, FaMapMarkerAlt, FaBriefcase, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { resolveMedia } from "../../../components/utils/mediaUrl";

export default function CompanyCard({ company, isDark }) {
  const text = isDark ? "text-white" : "text-black";
  const bgCard = isDark ? "bg-neutral-900 border-white/5" : "bg-white border-black/5 shadow-sm hover:border-red-500/20";
  
  const identifier = company.slug || company.id;

  return (
    <Link 
      to={`/company/${identifier}`}
      className={`group relative flex flex-col h-full overflow-hidden rounded-3xl border p-3 transition-all duration-500 hover:shadow-2xl cursor-pointer ${bgCard}`}
    >
      {/* Hover Background Accent */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br ${isDark ? "from-red-600/5 to-orange-600/5" : "from-red-50 to-orange-50"}`} />

      <div className="relative z-10 flex gap-5 items-start">
        {/* Logo */}
        <div className={`h-16 w-16 md:h-16 md:w-16 rounded-2xl overflow-hidden flex-shrink-0 border transition-all duration-500 group-hover:scale-105 ${isDark ? "border-white/10 bg-neutral-800" : "border-black/5 bg-neutral-50 shadow-inner"}`}>
          {company.logo ? (
            <img 
              src={resolveMedia(company.logo)} 
              alt={company.name} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <FaBuilding size={28} className="text-neutral-400 opacity-40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 ">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`text-lg font-black tracking-tight truncate group-hover:text-red-600 transition-colors ${text}`}>
              {company.name}
            </h3>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 ${isDark ? "bg-white/5 text-white" : "bg-black/5 text-black"}`}>
              <FaChevronRight size={10} />
            </div>
          </div>

          {company.industry && (
            <div className={`flex items-center gap-1.5 text-2xs font-black uppercase tracking-widest  ${isDark ? "text-red-400" : "text-red-600"}`}>
              <FaBriefcase size={10} />
              {company.industry}
            </div>
          )}

          <p className={`text-xs truncate leading-relaxed mb-1 font-medium opacity-60 ${text}`}>
            {company.description || "No description provided."}
          </p>

          <div className="mt-auto pt-1 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            {company.location && (
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt size={10} className="text-red-500 opacity-60" />
                <span className={`text-2xs font-bold uppercase tracking-widest ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                  {company.location}
                </span>
              </div>
            )}
            <span className={`text-2xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-red-400" : "text-red-600"}`}>
              View Profile
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

