import { FaChevronRight } from "react-icons/fa";

export default function InvestorCard({
  investor,
  onClick,
}) {
  const {
    display_name,
    one_liner,
    investor_type_display,
    location,
    profile_picture,
    user,
  } = investor;

  const resolveProfileImage = () => {
    const url = profile_picture || user?.profile_picture;
    const name = display_name || user?.first_name || user?.username || "Investor";
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=1`;
    return url;
  };

  return (
    <div
      onClick={() => onClick(investor)}
      className="group relative cursor-pointer premium-card p-4 bg-card shadow-lg shadow-black/5 hover:shadow-2xl transition-all duration-500 animate-fadeIn border border-border hover:border-primary/20"
    >
      {/* INVESTOR INFO */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-2">
          <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-border group-hover:ring-primary/20 transition-all duration-700 shadow-xl mx-auto">
            <img
                loading="lazy"
              src={resolveProfileImage()}
              alt="profile"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </div>

        <h2 className="font-black text-xl tracking-tight mb-1 text-foreground group-hover:text-primary transition-colors">
          {display_name}
        </h2>
        <p className="text-2xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {investor_type_display || "Private Investor"}
        </p>

        <div className="w-full rounded-2xl p-2 mb-2 transition-colors bg-muted group-hover:bg-primary-soft">
          <p className="text-xs font-medium leading-relaxed text-foreground/60 italic">
            "{one_liner || "Strategic capital focused on high-growth technology and innovative digital economies."}"
          </p>
        </div>

        <div className="w-full h-px mb-2 bg-border" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="text-2xs font-bold uppercase tracking-wider">{location || "Remote"}</span>
          </div>

          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-lg group-hover:shadow-primary/30">
             <FaChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
