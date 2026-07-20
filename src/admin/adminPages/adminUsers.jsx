import { useEffect, useState } from "react";
import {
  FaEye, FaUsers, FaUserCircle, FaEnvelope, FaPhone, FaCalendarAlt,
  FaPlus, FaArrowUp,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { PageHeader, SearchInput, Button, AdminModal } from "../../components/ui";
import { AdminTable, TablePagination, RoleBadge, StatusBadge } from "../adminComponents/adminUi";
import AddInvestorModal from "./AddInvestorModal";
import UpgradeToInvestorModal from "./UpgradeToInvestorModal";

export default function AdminUsers() {
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
      const params = new URLSearchParams();
      params.append("page", page);
      if (searchText) params.append("search", searchText);
      if (filterRole) params.append("user_type", filterRole);

      const res = await axiosSecure.get("/v1/admin/users/?" + params.toString());
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
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
    setPage(1);
  }, [searchText, filterRole]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterRole, page]);

  const columns = [
    { key: "user", label: "User" },
    { key: "contact", label: "Contact Info" },
    { key: "role", label: "Role" },
    { key: "joined", label: "Joined On" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaUsers />}
        title="User Management"
        subtitle="View, add and manage platform users"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Users" }]}
      >
        <Button onClick={() => setIsAddInvestorOpen(true)}>
          <FaPlus className="text-2xs" /> Add Investor
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput
          value={searchText}
          onChange={setSearchText}
          placeholder="Search by name, username, email…"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary"
        >
          <option value="">All Roles</option>
          <option value="normal">Normal</option>
          <option value="expert">Expert</option>
          <option value="entrepreneur">Entrepreneur</option>
          <option value="investor">Investor</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={users}
        loading={loading}
        loadingLabel="Loading users…"
        empty={{ icon: <FaUsers />, title: "No users found", description: "Try adjusting your search or filters." }}
        renderRow={(user) => (
          <>
            <td className="py-3 px-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex shrink-0 items-center justify-center overflow-hidden">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <FaUserCircle className="text-muted-foreground text-xl" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </div>
            </td>
            <td className="py-3 px-5">
              <div className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FaEnvelope className="text-2xs opacity-60" />
                  <span className="truncate max-w-[160px]">{user.email || "—"}</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FaPhone className="text-2xs opacity-60" /> {user.phone || "—"}
                </span>
              </div>
            </td>
            <td className="py-3 px-5"><RoleBadge role={user.user_type} /></td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}
            </td>
            <td className="py-3 px-5 text-center"><StatusBadge active={user.is_active} /></td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <button
                  title="View Details"
                  onClick={() => setViewModal({ isOpen: true, user })}
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors"
                >
                  <FaEye />
                </button>
                {user.user_type === "normal" && (
                  <button
                    title="Upgrade to Investor"
                    onClick={() => setUpgradeModal({ isOpen: true, user })}
                    className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <FaArrowUp />
                  </button>
                )}
              </div>
            </td>
          </>
        )}
        footer={
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            shownItems={users.length}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        }
      />

      {/* VIEW DETAILS MODAL */}
      {viewModal.isOpen && viewModal.user && (
        <AdminModal
          open
          onClose={() => setViewModal({ isOpen: false, user: null })}
          size="lg"
          title={
            viewModal.user.first_name || viewModal.user.last_name
              ? `${viewModal.user.first_name} ${viewModal.user.last_name}`
              : viewModal.user.username
          }
          subtitle={`@${viewModal.user.username}`}
          icon={
            viewModal.user.profile_picture ? (
              <img src={viewModal.user.profile_picture} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <FaUserCircle />
            )
          }
          headerExtra={
            <div className="flex items-center gap-2">
              <RoleBadge role={viewModal.user.user_type} />
              <StatusBadge active={viewModal.user.is_active} />
            </div>
          }
          footer={
            <Button variant="outline" onClick={() => setViewModal({ isOpen: false, user: null })}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <h4 className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Contact Information
              </h4>
              <div className="space-y-3">
                <DetailRow icon={<FaEnvelope />} label="Email" value={viewModal.user.email || "Not provided"} />
                <DetailRow icon={<FaPhone />} label="Phone Number" value={viewModal.user.phone || "Not provided"} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
              <DetailRow icon={<FaCalendarAlt />} label="Joined On" value={viewModal.user.date_joined ? new Date(viewModal.user.date_joined).toLocaleDateString() : "—"} />
              <DetailRow icon={<FaCalendarAlt />} label="Last Login" value={viewModal.user.last_login ? new Date(viewModal.user.last_login).toLocaleDateString() : "Never"} />
            </div>
          </div>
        </AdminModal>
      )}

      <AddInvestorModal
        isOpen={isAddInvestorOpen}
        onClose={() => setIsAddInvestorOpen(false)}
        onSuccess={() => { setIsAddInvestorOpen(false); fetchUsers(); }}
      />

      <UpgradeToInvestorModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false, user: null })}
        user={upgradeModal.user}
        onSuccess={() => { setUpgradeModal({ isOpen: false, user: null }); fetchUsers(); }}
      />
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card border border-border text-muted-foreground text-sm">
        {icon}
      </span>
      <div>
        <p className="text-2xs uppercase font-bold tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
