import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import SubscriptionFormModal from "../adminComponents/SubscriptionFormModal";
import { FaEdit, FaSearch, FaFilter, FaPlus, FaBoxOpen } from "react-icons/fa";

export default function AdminSubscriptions({ theme }) {
  const isDark = theme === "dark";

  const [plans, setPlans] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  /* ----------------------------
        FETCH PLANS
  ---------------------------- */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/subscriptions/admin/plans/");
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setPlans(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  /* ----------------------------
        SEARCH FILTER
  ---------------------------- */
  useEffect(() => {
    const s = searchText.toLowerCase();
    const f = plans.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        String(p.price).includes(s)
    );
    setFiltered(f);
  }, [searchText, plans]);

  /* =============================================================== */

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            Subscription Plans
          </h1>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200"
        >
          <FaPlus /> Create Plan
        </button>
      </div>

      {/* Filters Area */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between items-center ${isDark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className={`relative w-full sm:max-w-md flex items-center`}>
          <FaSearch className={`absolute left-3 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search plans by name or price..."
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 ${isDark ? "bg-[#0a0a0a] border-gray-800 text-gray-200 placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500"
              }`}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border rounded-lg font-medium text-sm transition-colors duration-200 ${isDark ? "border-gray-800 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}>
            <FaFilter className="text-xs" /> Filter
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? "border-gray-800 bg-[#111111]" : "border-gray-200 bg-white shadow-sm"}`}>
        {!loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs uppercase font-semibold ${isDark ? "bg-gray-800/50 text-gray-400 border-b border-gray-800" : "bg-gray-50 text-gray-600 border-b border-gray-200"}`}>
                <tr>
                  <th className="py-4 px-5">Name</th>
                  <th className="py-4 px-5">Price</th>
                  <th className="py-4 px-5">Duration</th>
                  <th className="py-4 px-5 text-center">Active</th>
                  <th className="py-4 px-5 text-center">Users</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-200"}`}>
                {filtered.map((plan) => (
                  <tr key={plan.uuid} className={`transition-colors duration-200 ${isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-50"}`}>
                    <td className={`py-3 px-5 font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}>{plan.name}</td>
                    <td className={`py-3 px-5 font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>₹{plan.price}</td>
                    <td className={`py-3 px-5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {plan.duration_days} days
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${plan.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                        {plan.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className={`py-3 px-5 text-center font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {plan.active_user_count}
                    </td>

                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingPlan(plan);
                            setShowModal(true);
                          }}
                          disabled={plan.active_user_count > 0}
                          className={`p-1.5 rounded-md transition-colors ${plan.active_user_count > 0
                              ? "opacity-40 cursor-not-allowed"
                              : isDark ? "text-blue-400 hover:bg-blue-400/10" : "text-blue-600 hover:bg-blue-50"
                            }`}
                          title={
                            plan.active_user_count > 0
                              ? "Cannot edit active plan"
                              : "Edit"
                          }
                        >
                          <FaEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaBoxOpen className={`text-3xl mb-3 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
                        <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>No plans found.</p>
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
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading plans...</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <SubscriptionFormModal
          plan={editingPlan}
          onClose={() => setShowModal(false)}
          onSuccess={fetchPlans}
          isDark={isDark}
        />
      )}
    </div>
  );
}
