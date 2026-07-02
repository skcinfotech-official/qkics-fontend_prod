export default function EntrepreneurCard({
  entrepreneur,
  onClick,
}) {
  const {
    startup_name,
    one_liner,
    industry,
    funding_stage,
    logo,
    user,
  } = entrepreneur;

  const resolveProfileImage = () => {
    const url = user?.profile_picture || logo;
    const name = startup_name || user?.first_name || user?.username || "Startup";
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=1`;
    return url;
  };

  return (
    <div
      onClick={() => onClick(entrepreneur)}
      className="group relative cursor-pointer premium-card p-6 bg-card hover:shadow-2xl transition-all duration-500 animate-fadeIn"
    >
      {/* STARTUP INFO */}
      <div className="flex flex-col">
        <div className="flex items-center gap-5 mb-6">
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg border border-border transition-transform duration-700 group-hover:scale-105">
            <img
                loading="lazy"
              src={resolveProfileImage()}
              alt="logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tighter mb-1 text-foreground group-hover:text-primary transition-colors">
              {startup_name}
            </h2>
            <p className="text-2xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {industry || "Technology"}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium leading-relaxed text-foreground/70 line-clamp-2">
            {one_liner || "Building the next generation of digital infrastructure for global scale."}
          </p>
        </div>

        <div className="w-full h-px mb-6 bg-border" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">Founder</p>
            <p className="text-xs font-bold text-foreground">{user?.first_name} {user?.last_name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">Stage</p>
            <span className="text-xs font-black text-primary">{funding_stage || "Seed"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
