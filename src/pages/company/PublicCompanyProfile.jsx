import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaArrowLeft,
  FaEdit, FaPlus, FaCheck, FaTimes, FaRegBuilding, FaBullhorn,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { resolveMedia } from "../../components/utils/mediaUrl";
import CompanyPosts from "./components/CompanyPosts";
import CompanyMembers from "./components/CompanyMembers";
import SponsorCard from "../../components/ui/SponsorCard";
import { Button } from "../../components/ui";
import { useAlert } from "../../context/AlertContext";

const STATUS_STYLES = {
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rejected: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
  suspended: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function PublicCompanyProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({ name: "", description: "", industry: "", website: "", location: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get(`/v1/companies/${slug}/`);
      const data = res.data;
      setCompany(data);
      setFormData({
        name: data.name || "",
        description: data.description || "",
        industry: data.industry || "",
        website: data.website || "",
        location: data.location || "",
      });
    } catch (err) {
      console.error("[CompanyProfile] Fetch error:", err.response || err);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchCompanyProfile();
      setEditMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* PERMISSIONS */
  const { isOwner, isMember } = (() => {
    if (!company || !loggedUser) return { isOwner: false, isMember: false };
    const { username, uuid } = loggedUser;
    let ownerFlag = false;
    const owner = company.owner;
    if (typeof owner === "object" && owner !== null) {
      ownerFlag = owner.uuid === uuid || owner.username === username;
    } else if (typeof owner === "string") {
      ownerFlag = owner === uuid || owner === username || owner.split(" ")[0] === username;
    }
    const memberFlag = (company.members || []).some((m) => {
      const u = m.user;
      if (typeof u === "object" && u !== null) return u.uuid === uuid || u.username === username;
      if (typeof u === "string") return u === uuid || u === username || u.split(" ")[0] === username;
      return false;
    });
    return { isOwner: ownerFlag, isMember: memberFlag };
  })();

  const canManage = isOwner || isMember;

  /* EDIT HANDLERS */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === "logo") { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
    else { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const submitData = new FormData();
    Object.keys(formData).forEach((k) => submitData.append(k, formData[k]));
    if (logoFile) submitData.append("logo", logoFile);
    if (coverFile) submitData.append("cover_image", coverFile);
    try {
      const res = await axiosSecure.patch(`/v1/companies/${company.id}/update/`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCompany(res.data);
      setEditMode(false);
      setLogoPreview(null); setCoverPreview(null); setLogoFile(null); setCoverFile(null);
      showAlert("Company updated successfully!", "success");
      if (res.data.slug !== slug) navigate(`/company/${res.data.slug}`, { replace: true });
    } catch (err) {
      console.error("Update failed:", err);
      showAlert("Failed to update company info", "error");
    } finally {
      setLoading(false);
    }
  };

  /* LOADING */
  if (loading && !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="text-2xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading Company…</span>
        </div>
      </div>
    );
  }

  /* NOT FOUND */
  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-soft text-primary">
            <FaBuilding size={38} />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Company Not Found</h1>
          <p className="mb-8 text-sm text-muted-foreground">We couldn't find the company you're looking for.</p>
          <Button onClick={() => navigate("/company")}>
            <FaArrowLeft /> Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  const website = company.website
    ? (company.website.startsWith("http") ? company.website : `https://${company.website}`)
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => navigate("/company")}
          className="mb-5 inline-flex items-center gap-2 text-2xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          <FaArrowLeft size={11} /> All Companies
        </button>

        {editMode ? (
          <EditPanel
            company={company} formData={formData} loading={loading}
            logoPreview={logoPreview} coverPreview={coverPreview}
            onInput={handleInputChange} onFile={handleFileChange} onSubmit={handleUpdate}
            onCancel={() => { setEditMode(false); setLogoPreview(null); setCoverPreview(null); }}
          />
        ) : (
          <>
            {/* ── HERO ───────────────────────────────── */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              {/* Cover */}
              <div className="relative h-40 md:h-56">
                {company.cover_image ? (
                  <img src={resolveMedia(company.cover_image)} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <div className="relative h-full w-full bg-gradient-to-br from-primary via-primary-hover to-primary/50">
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
                  </div>
                )}
                {isOwner && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-xl bg-card/90 px-4 py-2 text-2xs font-bold uppercase tracking-wide text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-card"
                  >
                    <FaEdit size={12} /> Edit
                  </button>
                )}
              </div>

              {/* Identity row */}
              <div className="px-5 pb-6 md:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  {/* Logo */}
                  <div className="relative z-10 -mt-12 h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-card ring-4 ring-card shadow-xl md:h-28 md:w-28">
                    {company.logo ? (
                      <img src={resolveMedia(company.logo)} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                        <FaBuilding size={40} />
                      </div>
                    )}
                  </div>

                  {/* Name + badges */}
                  <div className="min-w-0 flex-1 sm:pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        {company.name}
                      </h1>
                      {company.status === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          <FaCheck size={9} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                        @{company.slug}
                      </span>
                      {company.industry && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-2xs font-bold uppercase tracking-wide text-primary">
                          <FaBriefcase size={11} /> {company.industry}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick facts strip */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <FactTile icon={<FaBriefcase />} label="Industry" value={company.industry || "—"} />
                  <FactTile icon={<FaMapMarkerAlt />} label="Location" value={company.location || "—"} />
                  <FactTile
                    icon={<FaGlobe />}
                    label="Website"
                    value={website ? company.website.replace(/^https?:\/\//, "") : "—"}
                    href={website}
                  />
                  <FactTile
                    icon={<FaRegBuilding />}
                    label="Status"
                    valueClass={STATUS_STYLES[company.status] ? "" : ""}
                    value={
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-bold uppercase tracking-wide ${STATUS_STYLES[company.status] || "border-border text-muted-foreground"}`}>
                        {company.status || "Unverified"}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>

            {/* ── TABS ───────────────────────────────── */}
            <div className="mt-6 flex justify-center">
              <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm">
                {[
                  { id: "about", label: "About", icon: <FaBuilding size={12} /> },
                  { id: "positions", label: "Positions", icon: <FaBullhorn size={12} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-2xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── CONTENT ────────────────────────────── */}
            <div className="mt-6 animate-fadeIn">
              {activeTab === "about" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    {/* About */}
                    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                      <h3 className="mb-4 text-2xs font-bold uppercase tracking-[0.2em] text-muted-foreground">About</h3>
                      {company.description ? (
                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{company.description}</p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">No description added yet.</p>
                      )}
                    </section>

                    {/* Details */}
                    {(company.location || website) && (
                      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
                        <h3 className="mb-4 text-2xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Details</h3>
                        <div className="space-y-4">
                          {company.location && (
                            <DetailRow icon={<FaMapMarkerAlt />} label="Location" value={company.location} />
                          )}
                          {website && (
                            <DetailRow
                              icon={<FaGlobe />}
                              label="Website"
                              value={
                                <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {company.website.replace(/^https?:\/\//, "")}
                                </a>
                              }
                            />
                          )}
                          {company.industry && (
                            <DetailRow icon={<FaBriefcase />} label="Industry" value={company.industry} />
                          )}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                      <CompanyMembers
                        companyId={company.id}
                        isOwner={isOwner}
                        onLeaveSuccess={fetchCompanyProfile}
                      />
                    </section>
                    <SponsorCard isDark={isDark} />
                  </div>
                </div>
              )}

              {activeTab === "positions" && (
                <div className="mx-auto max-w-3xl">
                  <CompanyPosts companyId={company.id} showCreate={canManage} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */

function FactTile({ icon, label, value, href, valueClass = "" }) {
  const inner = (
    <div className="rounded-2xl border border-border bg-muted/40 p-3.5 transition-colors hover:bg-muted">
      <div className="mb-1 flex items-center gap-1.5 text-primary">
        <span className="text-xs">{icon}</span>
        <span className="text-3xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      </div>
      <div className={`truncate text-sm font-bold text-foreground ${valueClass}`}>{value}</div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>
  ) : inner;
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-3xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EditPanel({ company, formData, loading, logoPreview, coverPreview, onInput, onFile, onSubmit, onCancel }) {
  const field = "w-full rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Company</h2>
            <p className="mt-1 text-sm text-muted-foreground">Update your identity, branding and details.</p>
          </div>
          <button onClick={onCancel} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-7">
          {/* Assets */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">Logo</label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40">
                  {(logoPreview || company.logo) ? (
                    <img src={logoPreview || resolveMedia(company.logo)} alt="" className="h-full w-full object-cover" />
                  ) : <FaBuilding size={30} className="text-muted-foreground" />}
                </div>
                <label className="cursor-pointer rounded-xl bg-muted px-5 py-2.5 text-2xs font-bold uppercase tracking-wide text-foreground transition-all hover:bg-primary hover:text-primary-foreground">
                  Change Logo
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => onFile(e, "logo")} />
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">Cover</label>
              <div className="group relative h-24 w-full overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40">
                {(coverPreview || company.cover_image) ? (
                  <img src={coverPreview || resolveMedia(company.cover_image)} alt="" className="h-full w-full object-cover" />
                ) : <div className="flex h-full w-full items-center justify-center text-muted-foreground"><FaPlus /></div>}
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-2xs font-bold uppercase tracking-wide text-white">Upload Cover</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => onFile(e, "cover")} />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input name="name" value={formData.name} onChange={onInput} placeholder="Company name" className={field} />
            <input name="industry" value={formData.industry} onChange={onInput} placeholder="Industry" className={field} />
            <input name="location" value={formData.location} onChange={onInput} placeholder="Location" className={field} />
            <input name="website" value={formData.website} onChange={onInput} placeholder="Website URL" className={field} />
          </div>

          <textarea name="description" value={formData.description} onChange={onInput} rows="5" placeholder="Describe your company…" className={`${field} resize-none`} />

          <div className="flex justify-end gap-3 border-t border-border pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={loading}><FaCheck /> Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
