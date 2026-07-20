import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaBoxOpen, FaCreditCard } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { PageHeader, SearchInput, Button } from "../../components/ui";
import { AdminTable, StatusBadge } from "../adminComponents/adminUi";
import SubscriptionFormModal from "../adminComponents/SubscriptionFormModal";

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/subscriptions/admin/plans/");
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setPlans(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to fetch plans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    const s = searchText.toLowerCase();
    setFiltered(
      plans.filter((p) => p.name.toLowerCase().includes(s) || String(p.price).includes(s))
    );
  }, [searchText, plans]);

  const columns = [
    { key: "name", label: "Name" },
    { key: "price", label: "Price" },
    { key: "duration", label: "Duration" },
    { key: "active", label: "Active", align: "center" },
    { key: "users", label: "Users", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaCreditCard />}
        title="Subscription Plans"
        subtitle="Create and manage membership plans"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Subscriptions" }]}
      >
        <Button onClick={() => { setEditingPlan(null); setShowModal(true); }}>
          <FaPlus className="text-2xs" /> Create Plan
        </Button>
      </PageHeader>

      <SearchInput value={searchText} onChange={setSearchText} placeholder="Search plans by name or price…" />

      <AdminTable
        columns={columns}
        rows={filtered}
        loading={loading}
        loadingLabel="Loading plans…"
        keyField="uuid"
        empty={{ icon: <FaBoxOpen />, title: "No plans found", description: "Create your first subscription plan." }}
        renderRow={(plan) => (
          <>
            <td className="py-3 px-5 font-semibold text-foreground">{plan.name}</td>
            <td className="py-3 px-5 font-medium text-foreground">₹{plan.price}</td>
            <td className="py-3 px-5 text-muted-foreground">{plan.duration_days} days</td>
            <td className="py-3 px-5 text-center">
              <StatusBadge active={plan.is_active} activeLabel="Yes" inactiveLabel="No" />
            </td>
            <td className="py-3 px-5 text-center font-medium text-foreground">{plan.active_user_count}</td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center">
                <button
                  onClick={() => { setEditingPlan(plan); setShowModal(true); }}
                  disabled={plan.active_user_count > 0}
                  title={plan.active_user_count > 0 ? "Cannot edit active plan" : "Edit"}
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <FaEdit />
                </button>
              </div>
            </td>
          </>
        )}
      />

      {showModal && (
        <SubscriptionFormModal
          plan={editingPlan}
          onClose={() => setShowModal(false)}
          onSuccess={fetchPlans}
        />
      )}
    </div>
  );
}
