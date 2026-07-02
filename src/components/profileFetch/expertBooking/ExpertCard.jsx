import { FaMapMarkerAlt, FaCheckCircle, FaArrowRight } from "react-icons/fa";

export default function ExpertCard({ expert, onClick, resolveProfileImage }) {
  const displayName =
    `${expert.first_name || expert.user?.first_name || ""} ${expert.last_name || expert.user?.last_name || ""}`.trim() ||
    "Expert";
  const subline = expert.primary_expertise || "Certified Expert";
  const location = expert.location || "Remote";
  const rateValue = Number(expert.hourly_rate) || 0;
  const rate = rateValue > 0 ? `₹${rateValue.toLocaleString("en-IN")}` : null;
  const available = expert.is_available;
  const verified = expert.verified_by_admin;

  const tags = (expert.other_expertise || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      onClick={() => onClick(expert)}
      className="group relative flex flex-col cursor-pointer rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 animate-fadeIn"
    >
      {/* AVAILABILITY */}
      {available && (
        <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Available
        </span>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-border transition-all duration-300 group-hover:ring-primary/30">
            <img
              loading="lazy"
              src={resolveProfileImage(expert)}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          {verified && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-0.5" title="Verified expert">
              <FaCheckCircle className="text-primary" size={16} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 pr-16">
          <h2 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
            {displayName}
          </h2>
          <p className="truncate text-xs font-semibold text-muted-foreground">{subline}</p>
          <div className="mt-1 flex items-center gap-1 text-muted-foreground">
            <FaMapMarkerAlt size={9} className="text-primary" />
            <span className="text-2xs font-medium">{location}</span>
          </div>
        </div>
      </div>

      {/* HEADLINE */}
      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {expert.headline || `Expert consultant specializing in ${subline.toLowerCase()}.`}
      </p>

      {/* TAGS */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2.5 py-1 text-2xs font-medium text-foreground/70"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 mt-5">
        <div>
          {rate ? (
            <>
              <span className="text-lg font-extrabold text-foreground">{rate}</span>
              <span className="text-xs font-medium text-muted-foreground">/hr</span>
            </>
          ) : (
            <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
              Free intro call
            </span>
          )}
        </div>
        <span className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-xs font-bold text-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          View
          <FaArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
