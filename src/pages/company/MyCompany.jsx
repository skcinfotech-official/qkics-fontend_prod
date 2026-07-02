import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaEdit, FaPlus, FaChevronRight } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import axiosSecure from "../../components/utils/axiosSecure";
import { resolveMedia } from "../../components/utils/mediaUrl";
import { Button } from "../../components/ui";
import CreateCompanyModal from "./components/CreateCompanyModal";
import CompanyPosts from "./components/CompanyPosts";
import CompanyMembers from "./components/CompanyMembers";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

export default function MyCompany() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const text = isDark ? "text-white" : "text-black";
  const { showAlert } = useAlert();

  const [company, setCompany] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  // Form State
  const initialFormData = {
    name: "",
    description: "",
    industry: "",
    website: "",
    location: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Fetch Existing Company Profile
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/companies/my/");
      const results = res.data?.results || [];
      setAllCompanies(results);

      if (results.length > 0) {
        const fetchedCompany = results[0];
        setCompany(fetchedCompany);
        updateFormData(fetchedCompany);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const updateFormData = (fetchedCompany) => {
    setFormData({
      name: fetchedCompany.name || "",
      description: fetchedCompany.description || "",
      industry: fetchedCompany.industry || "",
      website: fetchedCompany.website || "",
      location: fetchedCompany.location || "",
    });
  };

  const handleOpenCreateModal = () => {
    setIsCreating(true);
    setEditMode(false);
    setFormData(initialFormData);
    setLogoFile(null);
    setCoverFile(null);
    setLogoPreview(null);
    setCoverPreview(null);
  };

  const handleSelectCompany = (comp) => {
    setCompany(comp);
    updateFormData(comp);
    setEditMode(false);
    setActiveTab("about");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === "logo") {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (type === "cover") {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    submitData.append("industry", formData.industry);
    submitData.append("website", formData.website);
    submitData.append("location", formData.location);

    if (logoFile) submitData.append("logo", logoFile);
    if (coverFile) submitData.append("cover_image", coverFile);

    try {
      if (isCreating) {
        const res = await axiosSecure.post("/v1/companies/", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCompany(res.data);
        setAllCompanies((prev) => [res.data, ...prev]);
        setIsCreating(false);
        showAlert("Company profile created successfully! Pending approval.", "success");
      } else {
        const res = await axiosSecure.patch(`/v1/companies/${company.id}/update/`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCompany(res.data);
        setAllCompanies((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)));
        setEditMode(false);
        showAlert("Company profile updated successfully!", "success");
      }
    } catch (err) {
      console.error("Error submitting company:", err);
      showAlert(err.response?.data?.message || "Error submitting company info", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isCreating && allCompanies.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="text-2xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading Companies...</span>
        </div>
      </div>
    );
  }

  // Permission logic
  const { isOwner, isMember } = (() => {
    if (!company || !loggedUser) return { isOwner: false, isMember: false };

    const currentUsername = loggedUser.username;
    const currentUuid = loggedUser.uuid;
    const currentId = loggedUser.id;

    let ownerFlag = false;
    const owner = company.owner;

    if (typeof owner === "object" && owner !== null) {
      ownerFlag = owner.uuid === currentUuid || owner.id === currentId || owner.username === currentUsername;
    } else if (typeof owner === "string" || typeof owner === "number") {
      const ownerStr = String(owner);
      ownerFlag =
        ownerStr === String(currentUuid) ||
        ownerStr === String(currentId) ||
        ownerStr === currentUsername ||
        ownerStr.split(" ")[0] === currentUsername;
    }

    const memberFlag = (company.members || []).some((m) => {
      const u = m.user;
      if (typeof u === "object" && u !== null) {
        return u.uuid === currentUuid || u.id === currentId || u.username === currentUsername;
      }
      if (typeof u === "string" || typeof u === "number") {
        const uStr = String(u);
        return uStr === String(currentUuid) || uStr === String(currentId) || uStr === currentUsername;
      }
      return false;
    });

    return { isOwner: ownerFlag, isMember: memberFlag };
  })();

  const canEdit = isOwner || isMember;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* Header with Create Button */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              My <span className="text-primary">Companies</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your organizations and view connected profiles
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} className="shrink-0">
            <FaPlus /> Create Company
          </Button>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">

          {/* MAIN COLUMN (LEFT) */}
          <div className="lg:col-span-8">
            {editMode ? (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Edit Company Profile</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Update your company information.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Media Uploads */}
                  <div className="flex flex-col gap-5 md:flex-row">
                    {/* Logo Upload */}
                    <div className="flex-1">
                      <label className={labelClass}>Company Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                          ) : company?.logo ? (
                            <img src={resolveMedia(company.logo)} alt="Logo" className="h-full w-full object-cover" />
                          ) : (
                            <FaBuilding size={32} className="text-muted-foreground" />
                          )}
                        </div>
                        <label className="cursor-pointer rounded-xl bg-primary-soft px-4 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
                        </label>
                      </div>
                    </div>

                    {/* Cover Upload */}
                    <div className="flex-1">
                      <label className={labelClass}>Cover Image</label>
                      <div className="group relative flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted">
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
                        ) : company?.cover_image ? (
                          <img src={resolveMedia(company.cover_image)} alt="Cover" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">Add Cover Image</span>
                        )}
                        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Upload Cover
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "cover")} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Basic Fields */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Company Name *</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className={fieldClass} placeholder="Enter company name" />
                    </div>
                    <div>
                      <label className={labelClass}>Industry *</label>
                      <input type="text" name="industry" required value={formData.industry} onChange={handleInputChange} className={fieldClass} placeholder="e.g. Technology, Healthcare" />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} className={fieldClass} placeholder="City, Country" />
                    </div>
                    <div>
                      <label className={labelClass}>Website</label>
                      <input type="url" name="website" value={formData.website} onChange={handleInputChange} className={fieldClass} placeholder="https://example.com" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description *</label>
                    <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className={`${fieldClass} resize-none`} placeholder="Tell us about your company..." />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-border pt-5">
                    <Button type="button" variant="ghost" onClick={() => { setEditMode(false); setLogoPreview(null); setCoverPreview(null); }}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              /* VIEW MODE */
              company && (
                <div className="overflow-hidden rounded-2xl border border-border bg-card">
                  {/* Cover Image Header */}
                  <div className="relative h-40 bg-muted md:h-48">
                    {company.cover_image ? (
                      <img src={resolveMedia(company.cover_image)} alt="Cover" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary via-primary-hover to-primary/60">
                        <FaBuilding size={48} className="text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Profile Info Section */}
                  <div className="relative px-5 pb-6 md:px-8">
                    <div className="flex flex-col items-start gap-5 md:flex-row">
                      {/* Logo */}
                      <div className="relative z-10 -mt-10 flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-card ring-4 ring-card md:h-24 md:w-24">
                        {company.logo ? (
                          <img src={resolveMedia(company.logo)} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <FaBuilding size={36} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Header Details */}
                      <div className="mt-4 flex w-full flex-1 flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                        <div className="min-w-0 flex-1">
                          <h1 className="mb-1 truncate text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            {company.name}
                          </h1>
                          {company.industry && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                              <FaBriefcase size={12} />
                              {company.industry}
                            </div>
                          )}
                        </div>

                        {canEdit && (
                          <Button size="sm" onClick={() => setEditMode(true)} className="shrink-0">
                            <FaEdit /> Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* TABS NAVIGATION */}
                    <div className="mb-6 mt-6 flex justify-center border-b border-border pb-3">
                      <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1">
                        {['about', 'posts'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-lg px-7 py-2 text-2xs font-bold uppercase tracking-wide transition-all ${activeTab === tab
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                              }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="min-h-[300px] animate-fadeIn">
                      {activeTab === "about" && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="space-y-5 md:col-span-2">
                            <div>
                              <h3 className="mb-3 text-2xs font-bold uppercase tracking-wide text-muted-foreground">About Company</h3>
                              <div className="text-sm leading-relaxed text-foreground/80">
                                {company.description ? (
                                  <p className="whitespace-pre-line">{company.description}</p>
                                ) : (
                                  <p className="italic text-muted-foreground">No description provided yet.</p>
                                )}
                              </div>
                            </div>

                            {/* Contact Info */}
                            {(company.location || company.website) && (
                              <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-4">
                                <h3 className="mb-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">Contact Info</h3>
                                {company.location && (
                                  <div className="flex items-center gap-2.5">
                                    <FaMapMarkerAlt size={12} className="text-primary" />
                                    <span className="text-xs text-foreground/80">{company.location}</span>
                                  </div>
                                )}
                                {company.website && (
                                  <div className="flex items-center gap-2.5">
                                    <FaGlobe size={12} className="text-primary" />
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="truncate text-xs text-primary hover:underline">
                                      {company.website.replace(/^https?:\/\//, "")}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-1">
                            <CompanyMembers
                              companyId={company.id}
                              isDark={isDark}
                              isOwner={isOwner}
                              text={text}
                              onLeaveSuccess={() => {
                                setCompany(null);
                                fetchCompanies();
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {activeTab === "posts" && (
                        <div className="mt-2">
                          <CompanyPosts companyId={company.id} isDark={isDark} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* SIDEBAR COLUMN (RIGHT) */}
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
                <FaBuilding className="text-primary" />
                My Organizations
              </h2>

              <div className="space-y-2">
                {allCompanies.map((comp) => {
                  const active = company?.id === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => handleSelectCompany(comp)}
                      className={`group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:bg-muted"
                        }`}
                    >
                      <div className={`h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg ${active ? "bg-white/15" : "bg-muted"}`}>
                        {comp.logo ? (
                          <img src={resolveMedia(comp.logo)} alt={comp.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FaBuilding size={18} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold leading-tight">{comp.name}</p>
                        <p className={`mt-0.5 truncate text-2xs font-bold uppercase tracking-wide ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {comp.industry || "Organization"}
                        </p>
                      </div>
                      <FaChevronRight className={`flex-shrink-0 text-xs transition-transform group-hover:translate-x-0.5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}

                {allCompanies.length === 0 && !loading && (
                  <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs italic text-muted-foreground">
                    No organizations found.
                  </div>
                )}
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="group mt-5 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border py-3.5 text-muted-foreground transition-all hover:border-primary hover:text-primary"
              >
                <FaPlus size={16} className="transition-transform group-hover:scale-110" />
                <span className="text-2xs font-bold uppercase tracking-wide">Register New</span>
              </button>
            </div>

            {/* QUICK STATS CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary-soft p-5">
              <div className="relative z-10">
                <h3 className="mb-1 text-2xs font-bold uppercase tracking-wide text-primary">Connected Network</h3>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {allCompanies.length} <span className="ml-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">Active Profiles</span>
                </p>
              </div>
              <FaBuilding size={80} className="absolute -bottom-4 -right-4 -rotate-12 text-primary/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Company Modal wrapper */}
      {isCreating && (
        <CreateCompanyModal
          isDark={isDark}
          closeModal={() => setIsCreating(false)}
          formData={formData}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          logoPreview={logoPreview}
          coverPreview={coverPreview}
          loading={loading}
          onSuccess={(newComp) => {
            setAllCompanies((prev) => [newComp, ...prev]);
            setCompany(newComp);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}
