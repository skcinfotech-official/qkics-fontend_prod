import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaSearch, FaEye, FaCheck, FaTimes, FaUsers, FaArrowLeft, FaCheckCircle, FaGlobe, FaMapMarkerAlt, FaBuilding } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";

export default function AdminEntrepreneurApplications({ theme }) {
    const isDark = theme === "dark";
    const { showAlert } = useAlert();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState("pending");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalApplications, setTotalApplications] = useState(0);

    // actionModal for approve/reject
    const [actionModal, setActionModal] = useState({ isOpen: false, id: null, actionType: null, note: "" });
    // viewModal for detailed view
    const [viewModal, setViewModal] = useState({ isOpen: false, app: null });

    const fetchApplications = async () => {
        try {
            setLoading(true);
            let url = "/v1/admin/entrepreneurs/applications/?";
            const params = new URLSearchParams();

            params.append("page", page);
            if (searchText) params.append("search", searchText);

            if (filterStatus === "verified") {
                params.append("verified_by_admin", "true");
            } else if (filterStatus) {
                params.append("application_status", filterStatus);
            }

            const res = await axiosSecure.get(url + params.toString());
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setApplications(data);

            if (!Array.isArray(res.data) && res.data?.count !== undefined) {
                setTotalApplications(res.data.count);
                setTotalPages(Math.ceil(res.data.count / 10) || 1);
            } else {
                setTotalApplications(data.length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error(err);
            showAlert("Failed to load entrepreneur applications", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset page unconditionally when search or filters change
    }, [searchText, filterStatus]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchApplications();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchText, filterStatus, page]);

    const handleActionClick = (id, action) => {
        if (action === "view") {
            const app = applications.find(a => a.id === id);
            if (app) setViewModal({ isOpen: true, app });
            return;
        }
        setActionModal({ isOpen: true, id, actionType: action, note: "" });
    };

    const submitAction = async () => {
        const { id, actionType, note } = actionModal;
        if (!note.trim() && actionType === 'reject') {
            showAlert("A note is required for rejection", "error");
            return;
        }

        try {
            await axiosSecure.patch(`/v1/admin/entrepreneurs/applications/${id}/`, {
                action: actionType,
                note: note.trim()
            });
            showAlert(`Application successfully ${actionType}d`, "success");
            setActionModal({ isOpen: false, id: null, actionType: null, note: "" });
            fetchApplications(searchText, filterStatus);

            // if viewing details while approving, close view modal
            if (viewModal.isOpen) setViewModal({ isOpen: false, app: null });
        } catch (error) {
            console.error(error);
            showAlert(`Failed to ${actionType} application`, "error");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "approved":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "rejected":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                        Entrepreneur Applications
                    </h1>
                </div>
            </div>

            {/* Filters Area */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`relative w-full sm:max-w-md flex items-center`}>
                    <FaSearch className={`absolute left-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                        type="text"
                        placeholder="Search startups, names, industries..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"}`}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={`flex-1 sm:flex-none border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-800 text-gray-300 hover:bg-gray-700 focus:ring-1 focus:ring-blue-500" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500"}`}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
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
                                    <th className="py-4 px-5">Applicant</th>
                                    <th className="py-4 px-5">Startup Details</th>
                                    <th className="py-4 px-5">Funding Stage</th>
                                    <th className="py-4 px-5">Applied On</th>
                                    <th className="py-4 px-5 text-center">Status</th>
                                    <th className="py-4 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                                {applications.map((app) => (
                                    <tr key={app.id} className={`transition-colors duration-200 ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex shrink-0 items-center justify-center overflow-hidden">
                                                    {app.user?.profile_picture ? (
                                                        <img src={app.user.profile_picture} alt={app.user.first_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaUsers className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{app.user?.first_name} {app.user?.last_name}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>@{app.user?.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-800"}`}>{app.startup_name}</p>
                                                {app.verified_by_admin && <FaCheckCircle className="text-blue-500 text-xs" title="Verified by Admin" />}
                                            </div>
                                            <p className={`text-xs uppercase font-semibold mt-0.5 truncate max-w-[180px] ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                {app.industry} • {app.location}
                                            </p>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`font-medium capitalize ${isDark ? "text-gray-300" : "text-gray-700"}`}>{app.funding_stage?.replace('_', ' ') || 'Unknown'}</span>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap">
                                            <span className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(app.application_status)}`}>
                                                {app.application_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button title="View Details" onClick={() => handleActionClick(app.id, 'view')} className={`p-1.5 rounded-md transition-colors ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}>
                                                    <FaEye />
                                                </button>
                                                <button
                                                    title={app.application_status === "approved" ? "Already Approved" : "Approve"}
                                                    onClick={() => handleActionClick(app.id, 'approve')}
                                                    disabled={app.application_status === "approved"}
                                                    className={`p-1.5 rounded-md transition-colors ${app.application_status === "approved" ? "opacity-40 cursor-not-allowed" : (isDark ? "text-green-400 hover:bg-green-400/10" : "text-green-600 hover:bg-green-50")}`}
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    title={app.application_status === "rejected" ? "Already Rejected" : "Reject"}
                                                    onClick={() => handleActionClick(app.id, 'reject')}
                                                    disabled={app.application_status === "rejected"}
                                                    className={`p-1.5 rounded-md transition-colors ${app.application_status === "rejected" ? "opacity-40 cursor-not-allowed" : (isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-50")}`}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FaUsers className={`text-3xl mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                                                <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No applications found.</p>
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
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading applications...</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className={`px-5 py-3 border-t flex items-center justify-between ${isDark ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-gray-50"}`}>
                        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Showing <strong>{applications.length}</strong> of <strong>{totalApplications}</strong> applications
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

            {/* ACTION MODAL (APPROVE/REJECT) */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] backdrop-blur-sm transition-opacity" onMouseDown={(e) => e.target === e.currentTarget && setActionModal({ ...actionModal, isOpen: false })}>
                    <div className={`p-6 rounded-xl w-full max-w-sm border shadow-xl ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold tracking-tight mb-4 capitalize">{actionModal.actionType} Application</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                                    Note / Reason {actionModal.actionType === 'reject' && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={actionModal.note}
                                    onChange={(e) => setActionModal({ ...actionModal, note: e.target.value })}
                                    placeholder={`Enter reason for ${actionModal.actionType}...`}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 min-h-[100px] resize-none ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"}`}
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitAction}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-colors ${actionModal.actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW DETAILS MODAL */}
            {viewModal.isOpen && viewModal.app && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity p-4" onMouseDown={(e) => e.target === e.currentTarget && setViewModal({ isOpen: false, app: null })}>
                    <div className={`p-6 rounded-xl w-full max-w-2xl border shadow-xl flex flex-col max-h-[90vh] ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className={`flex items-start justify-between pb-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex shrink-0 items-center justify-center overflow-hidden">
                                    {viewModal.app.logo ? (
                                        <img src={viewModal.app.logo} alt={viewModal.app.startup_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <FaBuilding className="text-gray-400 text-2xl" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-semibold tracking-tight">{viewModal.app.startup_name}</h3>
                                        {viewModal.app.verified_by_admin && <FaCheckCircle className="text-blue-500 text-sm" title="Verified by Admin" />}
                                    </div>
                                    <p className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{viewModal.app.one_liner}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${getStatusStyle(viewModal.app.application_status)}`}>
                                {viewModal.app.application_status}
                            </span>
                        </div>

                        {/* Scrolling Content */}
                        <div className="flex-1 overflow-y-auto py-5 space-y-6 custom-scrollbar pr-2">
                            {/* Applicant Box */}
                            <div className={`p-4 rounded-lg flex items-center gap-4 border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                <img src={viewModal.app.user?.profile_picture} alt="Applicant" className="w-12 h-12 rounded-full object-cover border dark:border-gray-700" />
                                <div>
                                    <p className="text-xs uppercase font-bold text-gray-500 mb-0.5 tracking-wider">Applicant</p>
                                    <p className="font-medium">{viewModal.app.user?.first_name} {viewModal.app.user?.last_name} <span className="text-gray-500 text-sm font-normal">(@{viewModal.app.user?.username})</span></p>
                                    <p className="text-xs text-gray-500">{viewModal.app.is_owner ? "Owner / Founder" : "Representative"}</p>
                                </div>
                            </div>

                            {/* Startup Details */}
                            <div className={`p-4 rounded-lg border flex flex-col gap-4 ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Company Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Industry</p>
                                        <p className="font-medium">{viewModal.app.industry}</p>
                                    </div>
                                    <div>
                                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Funding Stage</p>
                                        <p className="font-medium capitalize">{viewModal.app.funding_stage?.replace('_', ' ')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-gray-400" />
                                        <span className="font-medium">{viewModal.app.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaGlobe className="text-gray-400" />
                                        {viewModal.app.website ? (
                                            <a href={viewModal.app.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-medium truncate">{viewModal.app.website}</a>
                                        ) : (
                                            <span className="text-gray-500">No website provided</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>About the Startup</h4>
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                    {viewModal.app.description || "No detailed description provided by the applicant."}
                                </p>
                            </div>
                        </div>

                        {/* Footer (Actions) */}
                        <div className={`mt-2 pt-4 flex gap-3 justify-end border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <button
                                onClick={() => setViewModal({ isOpen: false, app: null })}
                                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                Close View
                            </button>

                            {viewModal.app.application_status !== "rejected" && (
                                <button
                                    onClick={() => setActionModal({ isOpen: true, id: viewModal.app.id, actionType: 'reject', note: "" })}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                                >
                                    Reject Startup
                                </button>
                            )}

                            {viewModal.app.application_status !== "approved" && (
                                <button
                                    onClick={() => setActionModal({ isOpen: true, id: viewModal.app.id, actionType: 'approve', note: "" })}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors"
                                >
                                    Approve Startup
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
