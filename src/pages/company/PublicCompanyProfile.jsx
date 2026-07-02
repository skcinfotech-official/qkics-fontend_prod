import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, 
  FaArrowLeft, FaEdit, FaPlus, FaCheck, FaTimes 
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { resolveMedia } from "../../components/utils/mediaUrl";
import CompanyPosts from "./components/CompanyPosts";
import CompanyMembers from "./components/CompanyMembers";
import SponsorCard from "../../components/ui/SponsorCard";
import { useAlert } from "../../context/AlertContext";

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
  
  // Form State for Editing
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
    location: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      console.log("[CompanyProfile] Fetching details for identifier:", slug);
      // Using relative path to honor baseURL (/api)
      const res = await axiosSecure.get(`/v1/companies/${slug}/`);
      console.log("[CompanyProfile] Data received:", res.data);
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
  }, [slug]);

  /* ----------------------------
      PERMISSION CHECK
  ----------------------------- */
  const { isOwner, isMember } = (() => {
    if (!company || !loggedUser) return { isOwner: false, isMember: false };

    const currentUsername = loggedUser.username;
    const currentUuid = loggedUser.uuid;

    // 1. Check Owner
    let ownerFlag = false;
    const owner = company.owner;
    if (typeof owner === 'object' && owner !== null) {
      ownerFlag = (owner.uuid === currentUuid || owner.username === currentUsername);
    } else if (typeof owner === 'string') {
      // Handles both UUID string and "username (type)" string
      ownerFlag = (owner === currentUuid || owner === currentUsername || owner.split(" ")[0] === currentUsername);
    }

    // 2. Check Members List
    const memberFlag = (company.members || []).some(m => {
      const u = m.user;
      if (typeof u === 'object' && u !== null) {
        return u.uuid === currentUuid || u.username === currentUsername;
      }
      if (typeof u === 'string') {
        return u === currentUuid || u === currentUsername || u.split(" ")[0] === currentUsername;
      }
      return false;
    });

    return { isOwner: ownerFlag, isMember: memberFlag };
  })();

  const canManage = isOwner || isMember;

  /* ----------------------------
      EDIT HANDLERS
  ----------------------------- */
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
      } else {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    if (logoFile) submitData.append("logo", logoFile);
    if (coverFile) submitData.append("cover_image", coverFile);

    try {
      const res = await axiosSecure.patch(`/v1/companies/${company.id}/update/`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCompany(res.data);
      setEditMode(false);
      showAlert("Company updated successfully!", "success");
      // If slug changed, navigate to new URL
      if (res.data.slug !== slug) {
        navigate(`/company/${res.data.slug}`, { replace: true });
      }
    } catch (err) {
      console.error("Update failed:", err);
      showAlert("Failed to update company info", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !company) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className={`text-2xs font-black uppercase tracking-[0.3em] opacity-30 ${isDark ? "text-white" : "text-black"}`}>Syncing Organization Intelligence...</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="text-center px-6">
            <div className="h-20 w-20 bg-red-600/10 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FaBuilding size={40} />
            </div>
            <h1 className={`text-2xl font-black mb-2 ${isDark ? "text-white" : "text-black"}`}>Organization Not Found</h1>
            <p className="text-xs opacity-50 uppercase font-bold tracking-widest mb-8 text-neutral-500">The requested entity could not be located in the network</p>
            <button 
                onClick={() => navigate("/company")}
                className="flex items-center gap-3 mx-auto px-8 py-3 bg-red-600 text-white rounded-xl text-2xs font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all"
            >
                <FaArrowLeft /> Return to Discovery
            </button>
        </div>
      </div>
    );
  }

  const text = isDark ? "text-white" : "text-black";
  const bgCard = isDark ? "bg-neutral-900" : "bg-white";

  return (
    <div className={`min-h-screen px-4 py-8 md:px-8 ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MAIN COLUMN (LEFT) */}
          <div className="lg:col-span-8">
            {/* Mobile Header Controls */}
            {isOwner && !editMode && (
              <div className="lg:hidden flex justify-end items-center mb-6">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-2xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
                  >
                    <FaEdit size={12} /> Edit
                  </button>
              </div>
            )}

            {/* Desktop Edit Button - Floating above main column */}
            {isOwner && !editMode && (
              <div className="hidden lg:flex justify-end mb-4">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl text-2xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <FaEdit size={14} />
                    Edit Profile
                  </button>
              </div>
            )}

            {editMode ? (
              /* EDIT MODE CONTENT */
              <div className={`overflow-hidden rounded-3xl shadow-xl ${bgCard} border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                   <div className="p-8 md:p-12">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                           <h2 className={`text-3xl font-black tracking-tighter ${text}`}>Configuration</h2>
                           <p className="text-2xs font-black uppercase tracking-widest opacity-40 mt-1">Identity & Branding Management</p>
                        </div>
                        <button onClick={() => { setEditMode(false); setLogoPreview(null); setCoverPreview(null); }} className="text-neutral-500 hover:text-red-500 transition-colors">
                           <FaTimes size={20} />
                        </button>
                      </div>

                      <form onSubmit={handleUpdate} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                               <label className="text-2xs font-black uppercase tracking-widest opacity-50">Logo Asset</label>
                               <div className="flex items-center gap-4">
                                  <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center bg-black/5 dark:bg-white/5">
                                      {(logoPreview || company.logo) ? (
                                        <img src={logoPreview || resolveMedia(company.logo)} className="h-full w-full object-cover" />
                                      ) : <FaBuilding size={32} className="opacity-20" />}
                                  </div>
                                  <label className="px-6 py-2.5 bg-neutral-100 dark:bg-white/5 rounded-xl text-2xs font-black uppercase tracking-widest cursor-pointer hover:bg-red-600 hover:text-white transition-all">
                                      Change Logo
                                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
                                  </label>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <label className="text-2xs font-black uppercase tracking-widest opacity-50">Cover Background</label>
                               <div className="h-24 w-full rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 overflow-hidden relative group bg-black/5 dark:bg-white/5">
                                  {(coverPreview || company.cover_image) ? (
                                    <img src={coverPreview || resolveMedia(company.cover_image)} className="h-full w-full object-cover" />
                                  ) : <div className="h-full w-full flex items-center justify-center"><FaPlus className="opacity-20" /></div>}
                                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                      <span className="text-2xs font-black uppercase tracking-widest text-white">Upload Brand Cover</span>
                                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'cover')} />
                                  </label>
                               </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Project Name" className={`w-full px-5 py-3.5 rounded-2xl border focus:border-red-500 outline-none transition-all font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`} />
                            <input name="industry" value={formData.industry} onChange={handleInputChange} placeholder="Industry Sector" className={`w-full px-5 py-3.5 rounded-2xl border focus:border-red-500 outline-none transition-all font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`} />
                            <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Regional Location" className={`w-full px-5 py-3.5 rounded-2xl border focus:border-red-500 outline-none transition-all font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`} />
                            <input name="website" value={formData.website} onChange={handleInputChange} placeholder="Operational URL" className={`w-full px-5 py-3.5 rounded-2xl border focus:border-red-500 outline-none transition-all font-bold ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`} />
                        </div>

                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="5" placeholder="Operational Description & Strategy" className={`w-full px-5 py-3.5 rounded-2xl border focus:border-red-500 outline-none transition-all font-bold resize-none ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`} />

                        <div className="flex justify-end gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                            <button type="button" onClick={() => setEditMode(false)} className={`px-8 py-3 rounded-xl text-2xs font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'}`}>
                                Abandon Edits
                            </button>
                            <button type="submit" disabled={loading} className="px-8 py-3 bg-red-600 text-white rounded-xl text-2xs font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaCheck />}
                                Update Intelligence
                            </button>
                        </div>
                      </form>
                   </div>
              </div>
            ) : (
              /* VIEW MODE CONTENT */
              <div className={`overflow-hidden rounded-3xl shadow-xl ${bgCard} shadow-black/10 transition-all border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                {/* Cover Image Header */}
                <div className="h-40 md:h-48 bg-neutral-200 dark:bg-neutral-800 relative">
                  {company.cover_image ? (
                    <img src={resolveMedia(company.cover_image)} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full bg-gradient-to-r from-red-600/20 to-orange-600/20 flex items-center justify-center">
                        <FaBuilding size={48} className="text-red-500/20" />
                      </div>
                  )}
                </div>

                {/* Profile Info Section */}
                <div className="px-6 md:px-8 pb-8 relative">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    
                    {/* Logo */}
                    <div className="-mt-10 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-neutral-900 bg-white dark:bg-neutral-800 flex-shrink-0 shadow-xl relative z-10">
                      {company.logo ? (
                        <img src={resolveMedia(company.logo)} alt="Logo" className="w-full h-full object-cover bg-white" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                          <FaBuilding size={40} className="text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Header Details */}
                    <div className="flex-1 mt-4 w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                         <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${text}`}>
                           {company.name}
                         </h1>
                         {company.status === 'approved' && (
                           <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-2xs font-black uppercase tracking-tighter flex items-center gap-1 border border-green-500/10">
                              <FaCheck size={8} /> Verified Organization
                           </div>
                         )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {company.industry && (
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>
                            <FaBriefcase size={12} />
                            {company.industry}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TABS NAVIGATION */}
                  <div className={`flex justify-center mt-8 mb-6 py-3 border-b border-black/5 dark:border-white/5`}>
                    <div className={`inline-flex p-1 rounded-xl shadow-inner ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                      {['about', 'posts'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-8 py-2 rounded-lg text-2xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                            ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                            : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                            }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TAB CONTENT */}
                  <div className="animate-fadeIn min-h-[300px]">
                    {activeTab === "about" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                          <div>
                            <h3 className={`text-2xs font-black uppercase tracking-[0.2em] mb-4 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                              Strategic Summary
                            </h3>
                            <div className={`prose max-w-none text-sm leading-relaxed ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                              {company.description ? (
                                <p className="whitespace-pre-line">{company.description}</p>
                              ) : (
                                <p className="italic opacity-50">No strategic description logged in records.</p>
                              )}
                            </div>
                          </div>

                          {/* Contact Info */}
                          {(company.location || company.website) && (
                            <div className={`rounded-2xl border p-5 space-y-4 ${isDark ? "border-white/5 bg-neutral-900/50" : "border-black/5 bg-neutral-50/50"}`}>
                              <h3 className={`text-2xs font-black uppercase tracking-[0.2em] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                                Operational Coordinates
                              </h3>
                              {company.location && (
                                <div className="flex items-center gap-2.5">
                                  <FaMapMarkerAlt size={12} className="text-red-500" />
                                  <span className={`text-xs font-bold ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>{company.location}</span>
                                </div>
                              )}
                              {company.website && (
                                <div className="flex items-center gap-2.5">
                                  <FaGlobe size={12} className="text-blue-500" />
                                  <a
                                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs font-bold truncate hover:underline ${isDark ? "text-blue-400" : "text-blue-600"}`}
                                  >
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
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === "posts" && (
                      <div className="mt-2">
                        {/* showCreate is only true if they are owner/member */}
                        <CompanyPosts 
                          companyId={company.id} 
                          isDark={isDark} 
                          showCreate={canManage} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR COLUMN (RIGHT) */}
          <div className="lg:col-span-4 space-y-6">
             <div className={`p-6 rounded-3xl border overflow-hidden relative ${isDark ? 'bg-gradient-to-br from-red-600/20 to-orange-600/20 border-white/5' : 'bg-gradient-to-br from-red-50 to-orange-50 border-black/5'}`}>
                 <div className="relative z-10">
                     <h3 className={`text-2xs font-black uppercase tracking-[0.2em] mb-2 ${isDark ? "text-red-400" : "text-red-600"}`}>Intelligence Dashboard</h3>
                     <p className={`text-sm font-black opacity-60 uppercase tracking-widest ${text}`}>Verification Status: {company.status || "Unverified"}</p>
                     <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                        <p className={`text-2xs opacity-40 uppercase font-black ${text}`}>Registry Entry ID</p>
                        <p className={`text-2xs font-mono break-all opacity-60 ${text}`}>{company.id}</p>
                     </div>
                 </div>
                 <FaBuilding size={80} className="absolute -right-4 -bottom-4 opacity-10 -rotate-12" />
            </div>

            {/* SPONSOR/ADS SECTION */}
            <div className="pt-2">
                <SponsorCard isDark={isDark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

