import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaSearch, FaEye, FaBullhorn, FaImage, FaVideo, FaLink, FaCalendarAlt, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";

export default function AdminAdvertisements({ theme }) {
    const isDark = theme === "dark";
    const { showAlert } = useAlert();

    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters and pagination state
    const [searchText, setSearchText] = useState("");
    const [filterPlacement, setFilterPlacement] = useState("");
    const [filterMediaType, setFilterMediaType] = useState("");
    const [filterIsActive, setFilterIsActive] = useState("");
    const [ordering, setOrdering] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAds, setTotalAds] = useState(0);

    const [viewModal, setViewModal] = useState({ isOpen: false, ad: null });

    // Create Ad State
    const [createModal, setCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: "",
        file: null,
        redirect_url: "",
        start_datetime: "",
        end_datetime: "",
        description: "",
        button_text: "Learn More",
        placement: "sidebar_featured",
        is_active: true
    });
    const [createLoading, setCreateLoading] = useState(false);

    // Edit Ad State
    const [editModal, setEditModal] = useState({ isOpen: false, adId: null });
    const [editForm, setEditForm] = useState({
        title: "",
        file: null,
        redirect_url: "",
        start_datetime: "",
        end_datetime: "",
        description: "",
        button_text: "Learn More",
        placement: "sidebar_featured",
        is_active: true
    });
    const [editLoading, setEditLoading] = useState(false);

    // Delete Ad State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, adId: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchAds = async () => {
        try {
            setLoading(true);
            let url = "/v1/admin/ads/?";
            const params = new URLSearchParams();

            params.append("page", page);
            if (searchText) params.append("search", searchText);
            if (filterPlacement) params.append("placement", filterPlacement);
            if (filterMediaType) params.append("media_type", filterMediaType);
            if (filterIsActive !== "") params.append("is_active", filterIsActive);
            if (ordering) params.append("ordering", ordering);

            const res = await axiosSecure.get(url + params.toString());
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setAds(data);

            if (!Array.isArray(res.data) && res.data?.count !== undefined) {
                setTotalAds(res.data.count);
                setTotalPages(Math.ceil(res.data.count / 10) || 1);
            } else {
                setTotalAds(data.length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error(err);
            showAlert("Failed to load advertisements", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [searchText, filterPlacement, filterMediaType, filterIsActive, ordering]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAds();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchText, filterPlacement, filterMediaType, filterIsActive, ordering, page]);

    const handleViewClick = (ad) => {
        setViewModal({ isOpen: false, ad: null });
        // slight delay to ensure re-render if it was already open
        setTimeout(() => setViewModal({ isOpen: true, ad }), 10);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setCreateForm({ ...createForm, file: e.target.files[0] });
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (!createForm.title || !createForm.file || !createForm.redirect_url || !createForm.start_datetime || !createForm.end_datetime) {
            showAlert("Please fill in all required fields", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("title", createForm.title);
        formData.append("file", createForm.file);
        formData.append("redirect_url", createForm.redirect_url);

        try {
            formData.append("start_datetime", new Date(createForm.start_datetime).toISOString());
            formData.append("end_datetime", new Date(createForm.end_datetime).toISOString());
        } catch (err) {
            console.error(err);
            showAlert("Invalid start or end datetime format", "error");
            return;
        }

        if (createForm.description) formData.append("description", createForm.description);
        if (createForm.button_text) formData.append("button_text", createForm.button_text);
        if (createForm.placement) formData.append("placement", createForm.placement);
        formData.append("is_active", createForm.is_active);

        try {
            setCreateLoading(true);
            await axiosSecure.post("/v1/admin/ads/create/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            showAlert("Advertisement created successfully", "success");
            setCreateModal(false);
            setCreateForm({
                title: "",
                file: null,
                redirect_url: "",
                start_datetime: "",
                end_datetime: "",
                description: "",
                button_text: "Learn More",
                placement: "sidebar_featured",
                is_active: true
            });
            fetchAds();
        } catch (err) {
            console.error(err);
            showAlert("Failed to create advertisement", "error");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleEditClick = (ad) => {
        const formatForInput = (isoString) => {
            if (!isoString) return "";
            const date = new Date(isoString);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            return date.toISOString().slice(0, 16);
        };

        setEditForm({
            title: ad.title || "",
            file: null, // Don't set file initially
            redirect_url: ad.redirect_url || "",
            start_datetime: formatForInput(ad.start_datetime),
            end_datetime: formatForInput(ad.end_datetime),
            description: ad.description || "",
            button_text: ad.button_text || "Learn More",
            placement: ad.placement || "sidebar_featured",
            is_active: ad.is_active !== undefined ? ad.is_active : true
        });
        setEditModal({ isOpen: true, adId: ad.id });
    };

    const handleEditFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setEditForm({ ...editForm, file: e.target.files[0] });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!editForm.title || !editForm.redirect_url || !editForm.start_datetime || !editForm.end_datetime) {
            showAlert("Please fill in all required fields", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("title", editForm.title);
        if (editForm.file) {
            formData.append("file", editForm.file);
        }
        formData.append("redirect_url", editForm.redirect_url);

        try {
            formData.append("start_datetime", new Date(editForm.start_datetime).toISOString());
            formData.append("end_datetime", new Date(editForm.end_datetime).toISOString());
        } catch (err) {
            showAlert("Invalid start or end datetime format", "error");
            return;
        }

        if (editForm.description) formData.append("description", editForm.description);
        if (editForm.button_text) formData.append("button_text", editForm.button_text);
        if (editForm.placement) formData.append("placement", editForm.placement);
        formData.append("is_active", editForm.is_active);

        try {
            setEditLoading(true);
            await axiosSecure.patch(`/v1/admin/ads/${editModal.adId}/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            showAlert("Advertisement updated successfully", "success");
            setEditModal({ isOpen: false, adId: null });
            fetchAds();
        } catch (err) {
            console.error(err);
            showAlert("Failed to update advertisement", "error");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteClick = (adId) => {
        setDeleteModal({ isOpen: true, adId });
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleteLoading(true);
            await axiosSecure.delete(`/v1/admin/ads/${deleteModal.adId}/delete/`);
            showAlert("Advertisement deleted successfully", "success");
            setDeleteModal({ isOpen: false, adId: null });
            fetchAds();
        } catch (err) {
            console.error(err);
            showAlert("Failed to delete advertisement", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const getStatusStyle = (isActive) => {
        if (isActive) {
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        }
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    };

    const formatPlacement = (placement) => {
        const PLACEMENT_CHOICES = {
            "sidebar_featured": "Sidebar Featured Partner"
        };
        return PLACEMENT_CHOICES[placement] || placement;
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                        Advertisements
                    </h1>
                </div>
                <button
                    onClick={() => setCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition-colors"
                >
                    <FaPlus className="text-sm" />
                    Create Ad
                </button>
            </div>

            {/* Filters Area */}
            <div className={`p-4 rounded-xl border flex flex-col xl:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`relative w-full xl:max-w-md flex items-center`}>
                    <FaSearch className={`absolute left-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                        type="text"
                        placeholder="Search ads by title, description..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"}`}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <select
                        value={filterPlacement}
                        onChange={(e) => setFilterPlacement(e.target.value)}
                        className={`flex-1 sm:flex-none border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    >
                        <option value="">All Placements</option>
                        <option value="sidebar_featured">Sidebar Featured</option>
                    </select>

                    <select
                        value={filterMediaType}
                        onChange={(e) => setFilterMediaType(e.target.value)}
                        className={`flex-1 sm:flex-none border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    >
                        <option value="">All Media</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                    </select>

                    <select
                        value={filterIsActive}
                        onChange={(e) => setFilterIsActive(e.target.value)}
                        className={`flex-1 sm:flex-none border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    >
                        <option value="">Status: All</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    <select
                        value={ordering}
                        onChange={(e) => setOrdering(e.target.value)}
                        className={`flex-1 sm:flex-none border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    >
                        <option value="">Sort By</option>
                        <option value="-created_at">Latest Created</option>
                        <option value="-start_datetime">Latest Start Time</option>
                        <option value="-end_datetime">Latest End Time</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-800 bg-[#111111]" : "border-gray-200 bg-white shadow-sm"}`}>
                {!loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className={`text-xs uppercase font-semibold ${isDark ? "bg-gray-800/50 text-gray-400 border-b border-gray-800" : "bg-gray-50 text-gray-600 border-b border-gray-200"}`}>
                                <tr>
                                    <th className="py-4 px-5">Title</th>
                                    <th className="py-4 px-5">Placement</th>
                                    <th className="py-4 px-5">Media</th>
                                    <th className="py-4 px-5">Duration</th>
                                    <th className="py-4 px-5 text-center">Status</th>
                                    <th className="py-4 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                                {ads.map((ad) => (
                                    <tr key={ad.id} className={`transition-colors duration-200 ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                                        <td className="py-3 px-5">
                                            <div>
                                                <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{ad.title}</p>
                                                <p className={`text-xs truncate max-w-[200px] ${isDark ? "text-gray-500" : "text-gray-500"}`}>{ad.description}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`}>
                                                {formatPlacement(ad.placement)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-2">
                                                {ad.media_type === "image" ? <FaImage className="text-gray-400" /> : <FaVideo className="text-gray-400" />}
                                                <span className={`text-sm capitalize ${isDark ? "text-gray-300" : "text-gray-700"}`}>{ad.media_type}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                    <span className="font-semibold text-xs">Start:</span> {ad.start_datetime ? new Date(ad.start_datetime).toLocaleDateString() : "N/A"}
                                                </span>
                                                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                    <span className="font-semibold text-xs">End:</span> {ad.end_datetime ? new Date(ad.end_datetime).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getStatusStyle(ad.is_active)}`}>
                                                {ad.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button title="View Details" onClick={() => handleViewClick(ad)} className={`p-1.5 rounded-md transition-colors ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}>
                                                    <FaEye />
                                                </button>
                                                <button title="Edit Ad" onClick={() => handleEditClick(ad)} className={`p-1.5 rounded-md transition-colors ${isDark ? "text-slate-400 hover:bg-slate-400/10" : "text-slate-600 hover:bg-slate-50"}`}>
                                                    <FaEdit />
                                                </button>
                                                <button title="Delete Ad" onClick={() => handleDeleteClick(ad.id)} className={`p-1.5 rounded-md transition-colors ${isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50"}`}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {ads.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FaBullhorn className={`text-3xl mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                                                <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No advertisements found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-16 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading ads...</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className={`px-5 py-3 border-t flex items-center justify-between ${isDark ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-gray-50"}`}>
                        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Showing <strong>{ads.length}</strong> of <strong>{totalAds}</strong> results
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === 1 ? "opacity-50 cursor-not-allowed" : (isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-white border text-gray-700 hover:bg-gray-100")}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${page === totalPages ? "opacity-50 cursor-not-allowed" : (isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-white border text-gray-700 hover:bg-gray-100")}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VIEW DETAILS MODAL */}
            {viewModal.isOpen && viewModal.ad && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity p-4" onMouseDown={(e) => e.target === e.currentTarget && setViewModal({ isOpen: false, ad: null })}>
                    <div className={`p-6 rounded-xl w-full max-w-2xl border shadow-xl flex flex-col max-h-[90vh] ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>

                        <div className={`flex items-start justify-between pb-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <div>
                                <h3 className="text-xl font-bold tracking-tight mb-1">{viewModal.ad.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${getStatusStyle(viewModal.ad.is_active)}`}>
                                    {viewModal.ad.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto py-5 space-y-6 custom-scrollbar pr-2">
                            {/* Media Display */}
                            <div className="w-full flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border dark:border-gray-700">
                                {viewModal.ad.file ? (
                                    viewModal.ad.media_type === "video" ? (
                                        <video src={viewModal.ad.file} controls className="max-h-64 object-contain" />
                                    ) : (
                                        <img src={viewModal.ad.file} alt={viewModal.ad.title} className="max-h-64 object-contain" />
                                    )
                                ) : (
                                    <div className="h-40 flex items-center justify-center">
                                        <span className="text-gray-400">No media uploaded</span>
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Description</h4>
                                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{viewModal.ad.description || "No description provided."}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Ad Info</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Placement</p>
                                            <p className="text-sm font-medium">{formatPlacement(viewModal.ad.placement)}</p>
                                        </div>
                                        <div>
                                            <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Media Type</p>
                                            <p className="text-sm font-medium capitalize">{viewModal.ad.media_type}</p>
                                        </div>
                                        <div>
                                            <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Created By</p>
                                            <p className="text-sm font-medium">{viewModal.ad.created_by || "System"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg border flex flex-col gap-3 ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-0 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Dates</h4>
                                    <div>
                                        <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Start Datetime</p>
                                        <p className="text-sm font-medium">{viewModal.ad.start_datetime ? new Date(viewModal.ad.start_datetime).toLocaleString() : "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>End Datetime</p>
                                        <p className="text-sm font-medium">{viewModal.ad.end_datetime ? new Date(viewModal.ad.end_datetime).toLocaleString() : "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Created At</p>
                                        <p className="text-sm font-medium">{viewModal.ad.created_at ? new Date(viewModal.ad.created_at).toLocaleString() : "N/A"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Redirect Link Setup */}
                            <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Call to Action</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-800 text-gray-400" : "bg-white border text-gray-500"}`}>
                                            <FaLink className="text-sm" />
                                        </div>
                                        <div>
                                            <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Redirect URL</p>
                                            <a href={viewModal.ad.redirect_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-500 hover:underline">{viewModal.ad.redirect_url || "No URL provided"}</a>
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Button Text</p>
                                        <p className="text-sm font-medium">{viewModal.ad.button_text || "Default"}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer (Actions) */}
                        <div className={`mt-2 pt-4 flex gap-3 justify-end border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <button
                                onClick={() => setViewModal({ isOpen: false, ad: null })}
                                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {createModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setCreateModal(false)}>
                    <div className={`p-6 rounded-xl w-full max-w-2xl border shadow-xl flex flex-col my-auto max-h-[90vh] ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={`flex items-start justify-between pb-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <h3 className="text-xl font-bold tracking-tight">Create Advertisement</h3>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto py-5 space-y-4 custom-scrollbar pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.title}
                                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                        placeholder="Ad Title"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Description</label>
                                    <textarea
                                        value={createForm.description}
                                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                        placeholder="Ad Description (Optional)"
                                    ></textarea>
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Media File *</label>
                                    <input
                                        type="file"
                                        required
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Redirect URL *</label>
                                    <input
                                        type="url"
                                        required
                                        value={createForm.redirect_url}
                                        onChange={(e) => setCreateForm({ ...createForm, redirect_url: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Start Datetime *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.start_datetime}
                                        onChange={(e) => setCreateForm({ ...createForm, start_datetime: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>End Datetime *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={createForm.end_datetime}
                                        onChange={(e) => setCreateForm({ ...createForm, end_datetime: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Button Text</label>
                                    <input
                                        type="text"
                                        value={createForm.button_text}
                                        onChange={(e) => setCreateForm({ ...createForm, button_text: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Placement</label>
                                    <select
                                        value={createForm.placement}
                                        onChange={(e) => setCreateForm({ ...createForm, placement: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    >
                                        <option value="sidebar_featured">Sidebar Featured</option>
                                    </select>
                                </div>

                                <div className="col-span-1 flex items-center mt-6">
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={createForm.is_active}
                                                onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                                            />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${createForm.is_active ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${createForm.is_active ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <div className={`ml-3 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            Active
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className={`mt-6 pt-4 flex gap-3 justify-end border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                                <button
                                    type="button"
                                    onClick={() => setCreateModal(false)}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {createLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                                    Create Ad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editModal.isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && setEditModal({ isOpen: false, adId: null })}>
                    <div className={`p-6 rounded-xl w-full max-w-2xl border shadow-xl flex flex-col my-auto max-h-[90vh] ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>
                        <div className={`flex items-start justify-between pb-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <h3 className="text-xl font-bold tracking-tight">Edit Advertisement</h3>
                        </div>

                        <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto py-5 space-y-4 custom-scrollbar pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                        placeholder="Ad Title"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                        placeholder="Ad Description (Optional)"
                                    ></textarea>
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Media File (Leave blank to keep current)</label>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleEditFileChange}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Redirect URL *</label>
                                    <input
                                        type="url"
                                        required
                                        value={editForm.redirect_url}
                                        onChange={(e) => setEditForm({ ...editForm, redirect_url: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Start Datetime *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.start_datetime}
                                        onChange={(e) => setEditForm({ ...editForm, start_datetime: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>End Datetime *</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.end_datetime}
                                        onChange={(e) => setEditForm({ ...editForm, end_datetime: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Button Text</label>
                                    <input
                                        type="text"
                                        value={editForm.button_text}
                                        onChange={(e) => setEditForm({ ...editForm, button_text: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:bg-white"}`}
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className={`block text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Placement</label>
                                    <select
                                        value={editForm.placement}
                                        onChange={(e) => setEditForm({ ...editForm, placement: e.target.value })}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? "bg-[#0a0a0a] border-gray-800" : "bg-gray-50 border-gray-200"}`}
                                    >
                                        <option value="sidebar_featured">Sidebar Featured</option>
                                    </select>
                                </div>

                                <div className="col-span-1 flex items-center mt-6">
                                    <label className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={editForm.is_active}
                                                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                            />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${editForm.is_active ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editForm.is_active ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <div className={`ml-3 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            Active
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className={`mt-6 pt-4 flex gap-3 justify-end border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                                <button
                                    type="button"
                                    onClick={() => setEditModal({ isOpen: false, adId: null })}
                                    className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {editLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && setDeleteModal({ isOpen: false, adId: null })}>
                    <div className={`p-6 rounded-xl w-full max-w-sm border shadow-xl flex flex-col text-center ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                            <FaTrash className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Delete Advertisement</h3>
                        <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Are you sure you want to delete this advertisement? This action cannot be undone.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, adId: null })}
                                disabled={deleteLoading}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex-1 ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteLoading}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {deleteLoading && <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
