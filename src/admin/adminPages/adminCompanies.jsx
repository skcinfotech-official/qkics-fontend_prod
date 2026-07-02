import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaSearch, FaEye, FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaTrash, FaEdit, FaCheck, FaTimes, FaCog } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import ConfirmationAlert from "../../components/ui/ConfirmationAlert";
import { resolveMedia } from "../../components/utils/mediaUrl";

export default function AdminCompanies({ theme }) {
    const isDark = theme === "dark";
    const { showAlert } = useAlert();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [nextCursor, setNextCursor] = useState(null);
    const [prevCursor, setPrevCursor] = useState(null);
    const [totalCount, setTotalCount] = useState(0);

    const [viewModal, setViewModal] = useState({ isOpen: false, company: null });
    const [editModal, setEditModal] = useState({ isOpen: false, company: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, companyId: null });
    const [submitting, setSubmitting] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [members, setMembers] = useState([]);
    const [fetchingMembers, setFetchingMembers] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [memberNextCursor, setMemberNextCursor] = useState(null);
    const [totalMembers, setTotalMembers] = useState(0);
    const [settings, setSettings] = useState({ free_posts_per_company: 0, paid_post_price: 0 });
    const [settingsModal, setSettingsModal] = useState({ isOpen: false });
    const [savingSettings, setSavingSettings] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        industry: "",
        website: "",
        location: "",
        status: "pending"
    });

    const extractCursor = (url) => {
        if (!url) return null;
        try {
            // Safe URL parsing with fallback base
            const urlObj = new URL(url, window.location.origin);
            return urlObj.searchParams.get("cursor");
        } catch {
            // Fallback: manually parse if URL is malformed
            const match = url.match(/[?&]cursor=([^&]+)/);
            return match ? match[1] : null;
        }
    };

    const fetchCompanies = async (cursor = null) => {
        try {
            setLoading(true);
            let url = "/v1/admin/companies/?";
            const params = new URLSearchParams();

            if (cursor) params.append("cursor", cursor);
            if (searchText) params.append("q", searchText);
            if (filterStatus) params.append("status", filterStatus);

            const res = await axiosSecure.get(url + params.toString());
            
            // Handle both { results: [] } and direct [] responses
            const data = res.data?.results || (Array.isArray(res.data) ? res.data : []);
            setCompanies(data);
            
            setNextCursor(extractCursor(res.data?.next));
            setPrevCursor(extractCursor(res.data?.previous));
            setTotalCount(res.data?.count || data.length);

        } catch (err) {
            console.error(err);
            showAlert("Failed to load companies", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axiosSecure.get("/v1/admin/company-settings/");
            setSettings(res.data);
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCompanies();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchText, filterStatus]);

    const fetchMembers = async (companyId, cursor = null) => {
        try {
            setFetchingMembers(true);
            const params = cursor ? `?cursor=${cursor}` : "";
            const res = await axiosSecure.get(`/v1/admin/companies/${companyId}/members/${params}`);
            
            const memberData = res.data?.results || (Array.isArray(res.data) ? res.data : []);
            
            if (cursor) {
                setMembers(prev => [...prev, ...memberData]);
            } else {
                setMembers(memberData);
            }
            
            setMemberNextCursor(extractCursor(res.data?.next));
            setTotalMembers(res.data?.count || (cursor ? members.length + memberData.length : memberData.length));
        } catch (err) {
            console.error("Failed to fetch members:", err);
            if (!cursor) setMembers([]);
        } finally {
            setFetchingMembers(false);
        }
    };

    const handleViewClick = async (company) => {
        try {
            setFetchingDetails(true);
            setMembers([]);
            setMemberNextCursor(null);
            const res = await axiosSecure.get(`/v1/admin/companies/${company.id}/`);
            setViewModal({ isOpen: true, company: res.data });
            fetchMembers(company.id);
        } catch (err) {
            console.error(err);
            showAlert("Failed to fetch company details", "error");
            // Fallback to list data if single fetch fails
            setViewModal({ isOpen: true, company });
        } finally {
            setFetchingDetails(false);
        }
    };

    const handleEditClick = (company) => {
        setMembers([]);
        setMemberNextCursor(null);
        setEditModal({ isOpen: true, company });
        setFormData({
            name: company.name || "",
            description: company.description || "",
            industry: company.industry || "",
            website: company.website || "",
            location: company.location || "",
            status: company.status || "pending"
        });
        fetchMembers(company.id);
    };

    const handleRemoveMemberClick = (member) => {
        setMemberToRemove(member);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove) return;
        try {
            await axiosSecure.delete(`/v1/admin/company-members/${memberToRemove.id}/remove/`);
            showAlert("Member removed successfully", "success");
            setMembers(members.filter(m => m.id !== memberToRemove.id));
            setMemberToRemove(null);
        } catch (err) {
            console.error(err);
            showAlert("Failed to remove member", "error");
        }
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axiosSecure.patch(`/v1/admin/companies/${editModal.company.id}/update/`, formData);
            showAlert("Company updated successfully", "success");
            setEditModal({ isOpen: false, company: null });
            fetchCompanies();
        } catch (err) {
            console.error(err);
            showAlert("Failed to update company", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm({ isOpen: true, companyId: id });
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            await axiosSecure.patch("/v1/admin/company-settings/", settings);
            showAlert("Settings updated successfully", "success");
            setSettingsModal({ isOpen: false });
            fetchSettings(); // Refresh settings after update
        } catch (err) {
            console.error(err);
            showAlert("Failed to update settings", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await axiosSecure.delete(`/v1/admin/companies/${deleteConfirm.companyId}/delete/`);
            showAlert("Company deleted successfully", "success");
            setDeleteConfirm({ isOpen: false, companyId: null });
            fetchCompanies();
        } catch (err) {
            console.error(err);
            showAlert("Failed to delete company", "error");
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "suspended":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    const textStyle = isDark ? "text-gray-200" : "text-gray-900";
    const labelStyle = isDark ? "text-gray-400" : "text-gray-500";
    const bgCard = isDark ? "bg-[#111111]" : "bg-white";

    // Helper to safely render strings, numbers, or fallback from objects
    const renderSafe = (val) => {
        if (!val) return "—";
        if (typeof val === 'object') {
            // If it's the owner object {id, username, email}
            return (val.username || val.email || val.name || val.label || "Object");
        }
        return String(val);
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center">
                <h1 className={`text-2xl font-semibold tracking-tight ${textStyle}`}>
                    Company Management
                </h1>
            </div>

            {/* Global Settings Area (Like Documents Page) */}
            {settings && (
                <div className={`p-6 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-6 ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                    <div className="flex flex-wrap gap-10">
                        <div className="flex flex-col">
                            <span className={`text-2xs font-black uppercase tracking-[0.2em] mb-1 opacity-50 ${textStyle}`}>Free Posts Limit</span>
                            <span className={`text-3xl font-black ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                                {settings.free_posts_per_company} 
                                <span className="text-sm font-medium ml-2">/ Organization</span>
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-2xs font-black uppercase tracking-[0.2em] mb-1 opacity-50 ${textStyle}`}>Paid Post Price</span>
                            <span className={`text-3xl font-black ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                ₹{settings.paid_post_price}
                                <span className="text-sm font-medium ml-2">/ Extra Post</span>
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSettingsModal({ isOpen: true })}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-2xs font-black uppercase tracking-[0.2em] transition-all border ${isDark ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                    >
                        <FaCog className={isDark ? "text-blue-400" : "text-blue-600"} />
                        Update Limits
                    </button>
                </div>
            )}

            {/* Filters Area */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className="relative w-full sm:max-w-md">
                    <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                        type="text"
                        placeholder="Search companies by name..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900"}`}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full sm:w-auto border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-all ${isDark ? "bg-gray-800 border-gray-800 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>

            {/* Table Area */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-800 bg-[#111111]" : "border-gray-200 bg-white shadow-sm"}`}>
                {!loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className={`text-xs uppercase font-semibold ${isDark ? "bg-gray-800/50 text-gray-400 border-b border-gray-800" : "bg-gray-50 text-gray-600 border-b border-gray-200"}`}>
                                <tr>
                                    <th className="py-4 px-5">Organization</th>
                                    <th className="py-4 px-5">Details</th>
                                    <th className="py-4 px-5">Owner</th>
                                    <th className="py-4 px-5 text-center">Status</th>
                                    <th className="py-4 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                                {companies.map((company) => (
                                    <tr key={company.id} className={`transition-all ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex shrink-0 items-center justify-center overflow-hidden border border-black/5 dark:border-white/5">
                                                    {company.logo ? (
                                                        <img src={resolveMedia(company.logo)} alt={renderSafe(company.name)} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaBuilding className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-bold ${textStyle}`}>{renderSafe(company.name)}</p>
                                                    <p className="text-xs font-medium text-blue-500">@{renderSafe(company.slug)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <FaBriefcase className="text-gray-400" />
                                                    <span className={textStyle}>{renderSafe(company.industry)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <FaMapMarkerAlt className="text-gray-400" />
                                                    <span className={textStyle}>{renderSafe(company.location)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`text-xs font-medium ${textStyle}`}>
                                                {renderSafe(company.owner)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-widest ${getStatusStyle(String(company.status))}`}>
                                                {renderSafe(company.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleViewClick(company)} 
                                                    disabled={fetchingDetails}
                                                    className={`p-2 rounded-lg transition-all ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}
                                                    title="View Full Details"
                                                >
                                                    {fetchingDetails ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <FaEye size={14} />}
                                                </button>
                                                <button onClick={() => handleEditClick(company)} className={`p-2 rounded-lg transition-all ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`} title="Edit / Moderate">
                                                    <FaEdit size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(company.id)} className={`p-2 rounded-lg transition-all ${isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"}`} title="Delete Permanently">
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {companies.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <FaBuilding className={`text-4xl mx-auto mb-3 opacity-20 ${isDark ? "text-white" : "text-black"}`} />
                                            <p className={`text-sm opacity-50 ${textStyle}`}>No organizations found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className={`text-sm opacity-50 ${textStyle}`}>Loading organizations...</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && (prevCursor || nextCursor) && (
                    <div className={`px-5 py-4 border-t flex items-center justify-between ${isDark ? "border-gray-800" : "border-gray-100"}`}>
                         <p className={`text-xs font-black uppercase tracking-widest opacity-40 ${textStyle}`}>
                            Total: {totalCount} Organizations
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchCompanies(prevCursor)}
                                disabled={!prevCursor}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${!prevCursor ? "opacity-30 cursor-not-allowed" : (isDark ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-black")}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => fetchCompanies(nextCursor)}
                                disabled={!nextCursor}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${!nextCursor ? "opacity-30 cursor-not-allowed" : (isDark ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-black")}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VIEW MODAL */}
            {viewModal.isOpen && viewModal.company && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className={`relative w-full max-w-2xl my-8 p-8 rounded-3xl shadow-2xl ${bgCard} border ${isDark ? "border-white/10" : "border-black/5"}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-black/5 dark:border-white/10 shadow-lg">
                                    {viewModal.company.logo ? (
                                        <img src={resolveMedia(viewModal.company.logo)} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <FaBuilding size={32} className="text-neutral-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-black tracking-tighter ${textStyle}`}>{renderSafe(viewModal.company.name)}</h2>
                                    <span className={`px-2 py-0.5 rounded text-2xs font-black uppercase tracking-widest ${getStatusStyle(renderSafe(viewModal.company.status))}`}>
                                        {renderSafe(viewModal.company.status)}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setViewModal({ isOpen: false, company: null })} className={labelStyle + " hover:text-red-500 transition-colors"}>
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Industry</p>
                                    <p className={`text-sm font-bold ${textStyle}`}>{renderSafe(viewModal.company.industry)}</p>
                                </div>
                                <div>
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Location</p>
                                    <p className={`text-sm font-bold ${textStyle}`}>{renderSafe(viewModal.company.location)}</p>
                                </div>
                                <div>
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Website</p>
                                    {viewModal.company.website ? (
                                        <a href={viewModal.company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-1">
                                            <FaGlobe size={12} /> {viewModal.company.website.replace(/^https?:\/\//, "")}
                                        </a>
                                    ) : <p className={`text-sm font-bold ${textStyle}`}>—</p>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Owner (Username/Email)</p>
                                    <p className={`text-sm font-bold ${textStyle}`}>
                                        {renderSafe(viewModal.company.owner)}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Slug URL</p>
                                    <p className="text-sm font-mono opacity-60">/company/{renderSafe(viewModal.company.slug)}</p>
                                </div>
                                <div>
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Created At</p>
                                    <p className={`text-sm font-bold ${textStyle}`}>{new Date(viewModal.company.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle} mb-2`}>Description</p>
                                <div className={`p-4 rounded-2xl border ${isDark ? "bg-white/5 border-white/5 text-neutral-300" : "bg-black/5 border-black/5 text-neutral-700"} text-sm leading-relaxed`}>
                                    {viewModal.company.description || "No description provided."}
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <div className="flex justify-between items-end mb-4">
                                    <p className={`text-2xs font-black uppercase tracking-widest ${labelStyle}`}>Company Members ({totalMembers})</p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {members.map((member) => (
                                        <div key={member.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-gray-50 border-black/5"}`}>
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
                                                <img 
                                                    src={member.user?.profile_picture ? resolveMedia(member.user.profile_picture) : `https://ui-avatars.com/api/?name=${member.user?.username || "U"}`} 
                                                    alt="User" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="truncate">
                                                <p className={`text-xs font-bold truncate ${textStyle}`}>{member.user?.full_name || member.user?.username || "Unknown"}</p>
                                                <p className="text-2xs opacity-50 truncate">{member.user?.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {members.length === 0 && !fetchingMembers && <p className="text-xs opacity-40 italic col-span-2">No members assigned to this company.</p>}
                                </div>

                                {memberNextCursor && (
                                    <div className="mt-4 flex justify-center">
                                        <button 
                                            onClick={() => fetchMembers(viewModal.company.id, memberNextCursor)}
                                            disabled={fetchingMembers}
                                            className="px-4 py-1.5 text-2xs font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600/20 transition-all disabled:opacity-50"
                                        >
                                            {fetchingMembers ? "Loading..." : "Load More Members"}
                                        </button>
                                    </div>
                                )}

                                {fetchingMembers && members.length === 0 && (
                                    <div className="flex items-center gap-2 opacity-50 py-4">
                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs">Loading members...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-black/5 dark:border-white/5">
                            <button
                                onClick={() => setViewModal({ isOpen: false, company: null })}
                                className="px-8 py-2.5 rounded-xl text-2xs font-black uppercase tracking-[0.2em] bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white hover:opacity-80 transition-all"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className={`relative w-full max-w-2xl my-8 p-8 rounded-3xl shadow-2xl ${bgCard} border ${isDark ? "border-white/10" : "border-black/5"}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className={`text-2xl font-black tracking-tighter ${textStyle}`}>Moderate Organization</h2>
                                <p className={labelStyle}>Update details or change status for {editModal.company.name}</p>
                            </div>
                            <button onClick={() => setEditModal({ isOpen: false, company: null })} className={labelStyle + " hover:text-red-500 transition-colors"}>
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCompany} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Company Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Industry</label>
                                    <input
                                        type="text"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Website</label>
                                    <div className="relative">
                                        <FaGlobe className={`absolute left-4 top-1/2 -translate-y-1/2 ${labelStyle}`} />
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Description</label>
                                    <textarea
                                        rows="4"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all resize-none ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                    />
                                </div>
                            </div>

                            {/* Members Section in Edit */}
                            <div className="pt-4">
                                <label className={`block text-2xs font-black uppercase tracking-widest mb-4 ${labelStyle}`}>Manage Members ({totalMembers})</label>
                                
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {members.map((member) => (
                                        <div key={member.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-gray-50 border-black/5"}`}>
                                            <div className="flex items-center gap-3 truncate">
                                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                                    <img 
                                                        src={member.user?.profile_picture ? resolveMedia(member.user.profile_picture) : `https://ui-avatars.com/api/?name=${member.user?.username || "U"}`} 
                                                        alt="User" 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                                <div className="truncate">
                                                    <p className={`text-xs font-bold truncate ${textStyle}`}>{member.user?.full_name || member.user?.username || "Unknown"}</p>
                                                    <p className="text-2xs opacity-50 truncate">{member.user?.email}</p>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveMemberClick(member)}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Remove Member"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {members.length === 0 && !fetchingMembers && <p className="text-xs opacity-40 italic">No members found.</p>}
                                </div>

                                {memberNextCursor && (
                                    <div className="mt-4 flex justify-center">
                                        <button 
                                            type="button"
                                            onClick={() => fetchMembers(editModal.company.id, memberNextCursor)}
                                            disabled={fetchingMembers}
                                            className="px-4 py-1.5 text-2xs font-black uppercase tracking-widest bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600/20 transition-all disabled:opacity-50"
                                        >
                                            {fetchingMembers ? "Loading..." : "Load More Members"}
                                        </button>
                                    </div>
                                )}

                                {fetchingMembers && members.length === 0 && (
                                    <div className="flex items-center gap-2 opacity-50 py-4">
                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs">Loading members...</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-black/5 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setEditModal({ isOpen: false, company: null })}
                                    className={`px-6 py-2.5 rounded-xl text-2xs font-black uppercase tracking-[0.2em] transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-2.5 rounded-xl text-2xs font-black uppercase tracking-[0.2em] bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <FaCheck />
                                    )}
                                    Update Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION */}
            {deleteConfirm.isOpen && (
                <ConfirmationAlert
                    title="Delete Organization"
                    message="Are you sure you want to delete this company? This is a hard delete and cannot be undone."
                    confirmText="Delete Permanently"
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm({ isOpen: false, companyId: null })}
                />
            )}
            {/* DELETE MEMBER CONFIRMATION */}
            {memberToRemove && (
                <ConfirmationAlert
                    title="Remove Member"
                    message={`Are you sure you want to remove ${memberToRemove.user?.username || "this member"} from the company?`}
                    confirmText="Remove Member"
                    onConfirm={confirmRemoveMember}
                    onCancel={() => setMemberToRemove(null)}
                />
            )}
            {/* SETTINGS MODAL */}
            {settingsModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                    <div className={`relative w-full max-w-md my-8 p-8 rounded-3xl shadow-2xl ${bgCard} border ${isDark ? "border-white/10" : "border-black/5"}`}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className={`text-2xl font-black tracking-tighter ${textStyle}`}>Company Settings</h2>
                                <p className={labelStyle}>Global limitations for all organizations</p>
                            </div>
                            <button onClick={() => setSettingsModal({ isOpen: false })} className={labelStyle + " hover:text-red-500 transition-colors"}>
                                <FaTimes size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSettings} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Free Posts Limit</label>
                                    <input
                                        type="number"
                                        value={settings.free_posts_per_company}
                                        onChange={(e) => setSettings({ ...settings, free_posts_per_company: parseInt(e.target.value) })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                        min="0"
                                    />
                                    <p className="text-2xs mt-1 opacity-50">Number of posts allowed for free per company.</p>
                                </div>
                                <div>
                                    <label className={`block text-2xs font-black uppercase tracking-widest mb-2 ${labelStyle}`}>Paid Post Price (₹)</label>
                                    <input
                                        type="number"
                                        value={settings.paid_post_price}
                                        onChange={(e) => setSettings({ ...settings, paid_post_price: parseFloat(e.target.value) })}
                                        className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all ${isDark ? "bg-[#0a0a0a] border-gray-800 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 text-black focus:border-blue-500"}`}
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="text-2xs mt-1 opacity-50">Price for each post beyond the free limit.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-black/5 dark:border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setSettingsModal({ isOpen: false })}
                                    className={`px-6 py-2.5 rounded-xl text-2xs font-black uppercase tracking-[0.2em] transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="px-8 py-2.5 rounded-xl text-2xs font-black uppercase tracking-[0.2em] bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    {savingSettings ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <FaCheck />
                                    )}
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
