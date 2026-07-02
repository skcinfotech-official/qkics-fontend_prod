import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaSearch, FaEye, FaCheck, FaTimes, FaUsers, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";

export default function AdminExpertApplications({ theme }) {
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
            let url = "/v1/admin/experts/applications/?";
            const params = new URLSearchParams();

            params.append("page", page);
            if (searchText) params.append("search", searchText);
            if (filterStatus) params.append("application_status", filterStatus);

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
            showAlert("Failed to load expert applications", "error");
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
            await axiosSecure.patch(`/v1/admin/experts/applications/${id}/`, {
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
                        Expert Applications
                    </h1>
                </div>
            </div>

            {/* Filters Area */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`relative w-full sm:max-w-md flex items-center`}>
                    <FaSearch className={`absolute left-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                        type="text"
                        placeholder="Search server-side..."
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
                                    <th className="py-4 px-5">Expertise</th>
                                    <th className="py-4 px-5">Hourly Rate</th>
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
                                                        <img src={app.user.profile_picture} alt={app.first_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaUsers className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{app.first_name} {app.last_name}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>@{app.user?.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-800"}`}>{app.primary_expertise}</p>
                                            <p className={`text-xs truncate max-w-[150px] ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                                {app.other_expertise || "-"}
                                            </p>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>₹{app.hourly_rate}</span>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap">
                                            <span className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {new Date(app.application_submitted_at || app.created_at).toLocaleDateString()}
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
                    <div className={`p-6 rounded-xl w-full max-w-4xl border shadow-xl flex flex-col max-h-[90vh] ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex shrink-0 items-center justify-center overflow-hidden border">
                                    {(viewModal.app.user?.profile_picture || viewModal.app.profile_picture) ? (
                                        <img src={viewModal.app.user?.profile_picture || viewModal.app.profile_picture} alt={viewModal.app.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <FaUsers className="text-gray-400 text-2xl" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold tracking-tight">{viewModal.app.first_name} {viewModal.app.last_name}</h3>
                                        {viewModal.app.verified_by_admin && <span className="text-blue-500" title="Verified Expert"><FaCheck /></span>}
                                    </div>
                                    {viewModal.app.headline && <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>{viewModal.app.headline}</p>}
                                    <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>@{viewModal.app.user?.username}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${getStatusStyle(viewModal.app.application_status)}`}>
                                    {viewModal.app.application_status}
                                </span>
                                {/* {viewModal.app.is_available && (
                                    <span className="text-xs font-semibold text-green-500 flex items-center gap-1">Available&nbsp;<FaCheckCircle /></span>
                                )} */}
                            </div>
                        </div>

                        {/* Scrolling Content */}
                        <div className="flex-1 overflow-y-auto py-5 space-y-6 custom-scrollbar pr-2">

                            {/* Expertise Box */}
                            <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Expertise Details</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-xs uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>Primary Field</p>
                                        <p className="font-medium">{viewModal.app.primary_expertise || "-"}</p>
                                    </div>
                                    <div>
                                        <p className={`text-xs uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>Other Expertise</p>
                                        <p className="text-sm mt-1 leading-relaxed">{viewModal.app.other_expertise || "-"}</p>
                                    </div>

                                </div>
                            </div>

                            {/* Detailed Sections Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Experience */}
                                <div>
                                    <h4 className={`text-sm font-bold tracking-wider mb-3 ${isDark ? "text-gray-300" : "text-gray-800"}`}>Experience</h4>
                                    {viewModal.app.experiences?.length > 0 ? (
                                        <div className="space-y-3">
                                            {viewModal.app.experiences.map(exp => (
                                                <div key={exp.id} className={`p-3 rounded-lg border ${isDark ? "bg-gray-800/20 border-gray-700" : "bg-white border-gray-200"}`}>
                                                    <h5 className="font-semibold text-sm">{exp.job_title}</h5>
                                                    <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>{exp.company} • {exp.employment_type?.replace('_', ' ')}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"} mb-1`}>{exp.start_date} - {exp.end_date || "Present"} | {exp.location}</p>
                                                    {exp.description && <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>{exp.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No experience added.</p>
                                    )}
                                </div>

                                {/* Education */}
                                <div>
                                    <h4 className={`text-sm font-bold tracking-wider mb-3 ${isDark ? "text-gray-300" : "text-gray-800"}`}>Education</h4>
                                    {viewModal.app.educations?.length > 0 ? (
                                        <div className="space-y-3">
                                            {viewModal.app.educations.map(edu => (
                                                <div key={edu.id} className={`p-3 rounded-lg border ${isDark ? "bg-gray-800/20 border-gray-700" : "bg-white border-gray-200"}`}>
                                                    <h5 className="font-semibold text-sm">{edu.school}</h5>
                                                    <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>{edu.degree} in {edu.field_of_study}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"} mb-1`}>{edu.start_year} - {edu.end_year || "Present"} {edu.grade ? `| Grade: ${edu.grade}` : ''}</p>
                                                    {edu.description && <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>{edu.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No education added.</p>
                                    )}
                                </div>

                                {/* Certifications */}
                                <div>
                                    <h4 className={`text-sm font-bold tracking-wider mb-3 ${isDark ? "text-gray-300" : "text-gray-800"}`}>Certifications</h4>
                                    {viewModal.app.certifications?.length > 0 ? (
                                        <div className="space-y-3">
                                            {viewModal.app.certifications.map(cert => (
                                                <div key={cert.id} className={`p-3 rounded-lg border ${isDark ? "bg-gray-800/20 border-gray-700" : "bg-white border-gray-200"}`}>
                                                    <h5 className="font-semibold text-sm">{cert.name}</h5>
                                                    <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>{cert.issuing_organization}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>Issued: {cert.issue_date} {cert.expiration_date ? `- Expires: ${cert.expiration_date}` : ''}</p>
                                                    {cert.credential_url && (
                                                        <a href={cert.credential_url} target="_blank" rel="noreferrer" className={`text-xs mt-1 inline-block text-blue-500 hover:underline`}>View Credential</a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No certifications added.</p>
                                    )}
                                </div>

                                {/* Honors and Awards */}
                                <div>
                                    <h4 className={`text-sm font-bold tracking-wider mb-3 ${isDark ? "text-gray-300" : "text-gray-800"}`}>Honors & Awards</h4>
                                    {viewModal.app.honors_awards?.length > 0 ? (
                                        <div className="space-y-3">
                                            {viewModal.app.honors_awards.map(award => (
                                                <div key={award.id} className={`p-3 rounded-lg border ${isDark ? "bg-gray-800/20 border-gray-700" : "bg-white border-gray-200"}`}>
                                                    <h5 className="font-semibold text-sm">{award.title}</h5>
                                                    <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}>{award.issuer}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>Issued: {award.issue_date}</p>
                                                    {award.description && <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>{award.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No awards added.</p>
                                    )}
                                </div>
                            </div>

                            {/* Admin Note if any */}
                            {viewModal.app.admin_review_note && (
                                <div className={`p-4 rounded-lg border ${isDark ? "bg-red-900/10 border-red-800/30" : "bg-red-50 border-red-100"}`}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? "text-red-400" : "text-red-600"}`}>Admin Review Note</h4>
                                    <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{viewModal.app.admin_review_note}</p>
                                </div>
                            )}

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
                                    Reject Expert
                                </button>
                            )}

                            {viewModal.app.application_status !== "approved" && (
                                <button
                                    onClick={() => setActionModal({ isOpen: true, id: viewModal.app.id, actionType: 'approve', note: "" })}
                                    className="px-5 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors"
                                >
                                    Approve Expert
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
