import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FaSearch, FaEye, FaUsers, FaUserCircle, FaEnvelope, FaPhone, FaCalendarAlt, FaPlus, FaArrowUp } from "react-icons/fa";
import { useAlert } from "../../context/AlertContext";
import AddInvestorModal from "./AddInvestorModal";
import UpgradeToInvestorModal from "./UpgradeToInvestorModal";

export default function AdminUsers({ theme }) {
    const isDark = theme === "dark";
    const { showAlert } = useAlert();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const [viewModal, setViewModal] = useState({ isOpen: false, user: null });
    const [isAddInvestorOpen, setIsAddInvestorOpen] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, user: null });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let url = "/v1/admin/users/?";
            const params = new URLSearchParams();

            params.append("page", page);
            if (searchText) params.append("search", searchText);
            if (filterRole) params.append("user_type", filterRole);

            const res = await axiosSecure.get(url + params.toString());
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            setUsers(data);

            if (!Array.isArray(res.data) && res.data?.count !== undefined) {
                setTotalUsers(res.data.count);
                setTotalPages(Math.ceil(res.data.count / 10) || 1);
            } else {
                setTotalUsers(data.length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error(err);
            showAlert("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset to page 1 unconditionally when search or filters change
    }, [searchText, filterRole]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchText, filterRole, page]);

    const handleViewClick = (user) => {
        setViewModal({ isOpen: true, user });
    };

    const handleUpgradeClick = (user) => {
        setUpgradeModal({ isOpen: true, user });
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case "superadmin":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "admin":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
            case "expert":
                return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400";
            case "normal":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
            case "entrepreneur":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            case "investor":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
    };

    const getStatusStyle = (isActive) => {
        if (isActive) {
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        }
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    };

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                        User Management
                    </h1>
                </div>
                <div>
                    <button
                        onClick={() => setIsAddInvestorOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm`}
                    >
                        <FaPlus className="text-xs" />
                        Add Investor
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`relative w-full sm:max-w-md flex items-center`}>
                    <FaSearch className={`absolute left-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    <input
                        type="text"
                        placeholder="Search users by name, username, email..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"}`}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className={`flex-1 sm:flex-none border rounded-lg font-medium text-sm px-4 py-2 outline-none transition-colors duration-200 ${isDark ? "bg-gray-800 border-gray-800 text-gray-300 hover:bg-gray-700 focus:ring-1 focus:ring-blue-500" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-1 focus:ring-blue-500"}`}
                    >
                        <option value="">All Roles</option>
                        <option value="normal">Normal</option>
                        <option value="expert">Expert</option>
                        <option value="entrepreneur">Entrepreneur</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
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
                                    <th className="py-4 px-5">User</th>
                                    <th className="py-4 px-5">Contact Info</th>
                                    <th className="py-4 px-5">Role</th>
                                    <th className="py-4 px-5">Joined On</th>
                                    <th className="py-4 px-5 text-center">Status</th>
                                    <th className="py-4 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                                {users.map((user) => (
                                    <tr key={user.id} className={`transition-colors duration-200 ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex shrink-0 items-center justify-center overflow-hidden">
                                                    {user.profile_picture ? (
                                                        <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaUserCircle className="text-gray-400 text-xl" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : "—"}</p>
                                                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <FaEnvelope className="text-gray-400 text-xs" />
                                                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} truncate max-w-[150px]`}>{user.email || "—"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaPhone className="text-gray-400 text-xs" />
                                                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{user.phone || "—"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getRoleStyle(user.user_type)}`}>
                                                {user.user_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 whitespace-nowrap">
                                            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {new Date(user.date_joined).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(user.is_active)}`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button title="View Details" onClick={() => handleViewClick(user)} className={`p-1.5 rounded-md transition-colors ${isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"}`}>
                                                    <FaEye />
                                                </button>
                                                {user.user_type === "normal" && (
                                                    <button title="Upgrade to Investor" onClick={() => handleUpgradeClick(user)} className={`p-1.5 rounded-md transition-colors ${isDark ? "text-green-400 hover:bg-green-400/10" : "text-green-600 hover:bg-green-50"}`}>
                                                        <FaArrowUp />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FaUsers className={`text-3xl mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                                                <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No users found.</p>
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
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading users...</p>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className={`px-5 py-3 border-t flex items-center justify-between ${isDark ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-gray-50"}`}>
                        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Showing <strong>{users.length}</strong> of <strong>{totalUsers}</strong> results
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
            {viewModal.isOpen && viewModal.user && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity p-4" onMouseDown={(e) => e.target === e.currentTarget && setViewModal({ isOpen: false, user: null })}>
                    <div className={`p-6 rounded-xl w-full max-w-lg border shadow-xl flex flex-col max-h-[90vh] ${isDark ? "bg-[#111111] border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`} onMouseDown={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className={`flex items-start justify-between pb-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex shrink-0 items-center justify-center overflow-hidden border">
                                    {viewModal.user.profile_picture ? (
                                        <img src={viewModal.user.profile_picture} alt={viewModal.user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <FaUserCircle className="text-gray-400 text-4xl" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-bold tracking-tight">{viewModal.user.first_name || viewModal.user.last_name ? `${viewModal.user.first_name} ${viewModal.user.last_name}` : viewModal.user.username}</h3>
                                    <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>@{viewModal.user.username}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${getRoleStyle(viewModal.user.user_type)}`}>
                                            {viewModal.user.user_type}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${getStatusStyle(viewModal.user.is_active)}`}>
                                            {viewModal.user.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto py-5 space-y-4 custom-scrollbar pr-2">

                            {/* Contact Box */}
                            <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Contact Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-800 text-gray-400" : "bg-white border text-gray-500"}`}>
                                            <FaEnvelope className="text-sm" />
                                        </div>
                                        <div>
                                            <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Email</p>
                                            <p className="text-sm font-medium">{viewModal.user.email || "Not provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-800 text-gray-400" : "bg-white border text-gray-500"}`}>
                                            <FaPhone className="text-sm" />
                                        </div>
                                        <div>
                                            <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Phone Number</p>
                                            <p className="text-sm font-medium">{viewModal.user.phone || "Not provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Box */}
                            <div className={`p-4 rounded-lg border flex flex-col sm:flex-row gap-4 sm:gap-8 ${isDark ? "bg-gray-900/50 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-800 text-gray-400" : "bg-white border text-gray-500"}`}>
                                        <FaCalendarAlt className="text-sm" />
                                    </div>
                                    <div>
                                        <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Joined On</p>
                                        <p className="text-sm font-medium">{new Date(viewModal.user.date_joined).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-800 text-gray-400" : "bg-white border text-gray-500"}`}>
                                        <FaCalendarAlt className="text-sm" />
                                    </div>
                                    <div>
                                        <p className={`text-2xs uppercase font-bold tracking-wider ${isDark ? "text-gray-500" : "text-gray-500"}`}>Last Login</p>
                                        <p className="text-sm font-medium">{viewModal.user.last_login ? new Date(viewModal.user.last_login).toLocaleDateString() : "Never"}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer (Actions) */}
                        <div className={`mt-2 pt-4 flex gap-3 justify-end border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                            <button
                                onClick={() => setViewModal({ isOpen: false, user: null })}
                                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD INVESTOR MODAL */}
            <AddInvestorModal
                isOpen={isAddInvestorOpen}
                onClose={() => setIsAddInvestorOpen(false)}
                onSuccess={() => {
                    setIsAddInvestorOpen(false);
                    fetchUsers();
                }}
                theme={theme}
            />

            {/* UPGRADE MODAL */}
            <UpgradeToInvestorModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ isOpen: false, user: null })}
                user={upgradeModal.user}
                onSuccess={() => {
                    setUpgradeModal({ isOpen: false, user: null });
                    fetchUsers();
                }}
                theme={theme}
            />
        </div>
    );
}