import { useEffect, useState } from "react";
import {
  FaEye, FaBuilding, FaMapMarkerAlt, FaGlobe, FaBriefcase, FaTrash,
  FaEdit, FaCog,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import ConfirmationAlert from "../../components/ui/ConfirmationAlert";
import { PageHeader, SearchInput, Button, Badge, AdminModal } from "../../components/ui";
import { AdminTable, FIELD_CLASS, LABEL_CLASS } from "../adminComponents/adminUi";
import { resolveMedia } from "../../components/utils/mediaUrl";

const STATUS_VARIANT = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  suspended: "warning",
};

export default function AdminCompanies() {
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
    name: "", description: "", industry: "", website: "", location: "", status: "pending",
  });

  const extractCursor = (url) => {
    if (!url) return null;
    try {
      return new URL(url, window.location.origin).searchParams.get("cursor");
    } catch {
      const match = url.match(/[?&]cursor=([^&]+)/);
      return match ? match[1] : null;
    }
  };

  const fetchCompanies = async (cursor = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (cursor) params.append("cursor", cursor);
      if (searchText) params.append("q", searchText);
      if (filterStatus) params.append("status", filterStatus);

      const res = await axiosSecure.get("/v1/admin/companies/?" + params.toString());
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

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchCompanies(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterStatus]);

  const fetchMembers = async (companyId, cursor = null) => {
    try {
      setFetchingMembers(true);
      const params = cursor ? `?cursor=${cursor}` : "";
      const res = await axiosSecure.get(`/v1/admin/companies/${companyId}/members/${params}`);
      const memberData = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setMembers((prev) => (cursor ? [...prev, ...memberData] : memberData));
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
      name: company.name || "", description: company.description || "",
      industry: company.industry || "", website: company.website || "",
      location: company.location || "", status: company.status || "pending",
    });
    fetchMembers(company.id);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await axiosSecure.delete(`/v1/admin/company-members/${memberToRemove.id}/remove/`);
      showAlert("Member removed successfully", "success");
      setMembers(members.filter((m) => m.id !== memberToRemove.id));
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

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await axiosSecure.patch("/v1/admin/company-settings/", settings);
      showAlert("Settings updated successfully", "success");
      setSettingsModal({ isOpen: false });
      fetchSettings();
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

  const renderSafe = (val) => {
    if (!val) return "—";
    if (typeof val === "object") return val.username || val.email || val.name || val.label || "Object";
    return String(val);
  };

  const columns = [
    { key: "org", label: "Organization" },
    { key: "details", label: "Details" },
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  const MemberRow = ({ member, onRemove }) => (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/40">
      <div className="flex items-center gap-3 truncate">
        <img
          src={member.user?.profile_picture ? resolveMedia(member.user.profile_picture) : `https://ui-avatars.com/api/?name=${member.user?.username || "U"}`}
          alt="User"
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
        <div className="truncate">
          <p className="text-xs font-bold text-foreground truncate">{member.user?.full_name || member.user?.username || "Unknown"}</p>
          <p className="text-2xs text-muted-foreground truncate">{member.user?.email}</p>
        </div>
      </div>
      {onRemove && (
        <button type="button" onClick={() => onRemove(member)} title="Remove Member"
          className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors">
          <FaTrash size={12} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaBuilding />}
        title="Company Management"
        subtitle="Moderate organizations and post limits"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Companies" }]}
      />

      {/* Settings summary */}
      {settings && (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap gap-10">
            <div className="flex flex-col">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Free Posts Limit</span>
              <span className="text-3xl font-black text-primary">
                {settings.free_posts_per_company}
                <span className="text-sm font-medium text-muted-foreground ml-2">/ Organization</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Paid Post Price</span>
              <span className="text-3xl font-black text-green-600 dark:text-green-400">
                ₹{settings.paid_post_price}
                <span className="text-sm font-medium text-muted-foreground ml-2">/ Extra Post</span>
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setSettingsModal({ isOpen: true })}>
            <FaCog /> Update Limits
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search companies by name…" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={companies}
        loading={loading}
        loadingLabel="Loading organizations…"
        empty={{ icon: <FaBuilding />, title: "No organizations found", description: "Try adjusting your search or filters." }}
        renderRow={(company) => (
          <>
            <td className="py-3 px-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex shrink-0 items-center justify-center overflow-hidden border border-border">
                  {company.logo ? (
                    <img src={resolveMedia(company.logo)} alt={renderSafe(company.name)} className="w-full h-full object-cover" />
                  ) : (
                    <FaBuilding className="text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{renderSafe(company.name)}</p>
                  <p className="text-xs font-medium text-primary truncate">@{renderSafe(company.slug)}</p>
                </div>
              </div>
            </td>
            <td className="py-3 px-5">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><FaBriefcase className="opacity-60" /> {renderSafe(company.industry)}</span>
                <span className="flex items-center gap-2"><FaMapMarkerAlt className="opacity-60" /> {renderSafe(company.location)}</span>
              </div>
            </td>
            <td className="py-3 px-5 text-xs font-medium text-foreground">{renderSafe(company.owner)}</td>
            <td className="py-3 px-5 text-center">
              <Badge variant={STATUS_VARIANT[String(company.status).toLowerCase()] || "neutral"}>
                {renderSafe(company.status)}
              </Badge>
            </td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => handleViewClick(company)} disabled={fetchingDetails} title="View Full Details"
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors">
                  {fetchingDetails ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin block" /> : <FaEye size={14} />}
                </button>
                <button onClick={() => handleEditClick(company)} title="Edit / Moderate"
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <FaEdit size={14} />
                </button>
                <button onClick={() => setDeleteConfirm({ isOpen: true, companyId: company.id })} title="Delete Permanently"
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors">
                  <FaTrash size={14} />
                </button>
              </div>
            </td>
          </>
        )}
        footer={
          (prevCursor || nextCursor) && !loading ? (
            <div className="px-5 py-4 border-t border-border bg-muted/40 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total: {totalCount} Organizations
              </p>
              <div className="flex gap-2">
                <button onClick={() => fetchCompanies(prevCursor)} disabled={!prevCursor}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  Previous
                </button>
                <button onClick={() => fetchCompanies(nextCursor)} disabled={!nextCursor}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none">
                  Next
                </button>
              </div>
            </div>
          ) : null
        }
      />

      {/* VIEW MODAL */}
      {viewModal.isOpen && viewModal.company && (
        <AdminModal
          open
          onClose={() => setViewModal({ isOpen: false, company: null })}
          size="lg"
          title={renderSafe(viewModal.company.name)}
          subtitle={`/company/${renderSafe(viewModal.company.slug)}`}
          icon={
            viewModal.company.logo ? (
              <img src={resolveMedia(viewModal.company.logo)} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : <FaBuilding />
          }
          headerExtra={<Badge variant={STATUS_VARIANT[String(viewModal.company.status).toLowerCase()] || "neutral"}>{renderSafe(viewModal.company.status)}</Badge>}
          footer={<Button variant="outline" onClick={() => setViewModal({ isOpen: false, company: null })}>Close</Button>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Detail label="Industry" value={renderSafe(viewModal.company.industry)} />
            <Detail label="Location" value={renderSafe(viewModal.company.location)} />
            <div>
              <p className={LABEL_CLASS}>Website</p>
              {viewModal.company.website ? (
                <a href={viewModal.company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                  <FaGlobe size={12} /> {viewModal.company.website.replace(/^https?:\/\//, "")}
                </a>
              ) : <p className="text-sm font-bold text-foreground">—</p>}
            </div>
            <Detail label="Owner" value={renderSafe(viewModal.company.owner)} />
            <Detail label="Created At" value={viewModal.company.created_at ? new Date(viewModal.company.created_at).toLocaleString() : "—"} />
            <div className="md:col-span-2">
              <p className={LABEL_CLASS}>Description</p>
              <div className="p-4 rounded-xl border border-border bg-muted/40 text-sm leading-relaxed text-foreground">
                {viewModal.company.description || "No description provided."}
              </div>
            </div>
            <div className="md:col-span-2">
              <p className={`${LABEL_CLASS} mb-2`}>Company Members ({totalMembers})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((m) => <MemberRow key={m.id} member={m} />)}
                {members.length === 0 && !fetchingMembers && <p className="text-xs text-muted-foreground italic col-span-2">No members assigned.</p>}
              </div>
              {memberNextCursor && (
                <div className="mt-4 flex justify-center">
                  <Button size="sm" variant="soft" onClick={() => fetchMembers(viewModal.company.id, memberNextCursor)} loading={fetchingMembers}>
                    Load More Members
                  </Button>
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      {/* EDIT MODAL */}
      {editModal.isOpen && (
        <AdminModal
          open
          onClose={() => setEditModal({ isOpen: false, company: null })}
          size="lg"
          icon={<FaEdit />}
          title="Moderate Organization"
          subtitle={`Update details or status for ${editModal.company.name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setEditModal({ isOpen: false, company: null })}>Cancel</Button>
              <Button type="submit" form="company-edit-form" loading={submitting}>Update Details</Button>
            </>
          }
        >
          <form id="company-edit-form" onSubmit={handleUpdateCompany} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Company Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Industry</label>
                <input type="text" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={FIELD_CLASS}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={FIELD_CLASS} />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Website</label>
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={FIELD_CLASS} placeholder="https://example.com" />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Description</label>
                <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${FIELD_CLASS} resize-none`} />
              </div>
            </div>

            <div>
              <label className={`${LABEL_CLASS} mb-3`}>Manage Members ({totalMembers})</label>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {members.map((m) => <MemberRow key={m.id} member={m} onRemove={setMemberToRemove} />)}
                {members.length === 0 && !fetchingMembers && <p className="text-xs text-muted-foreground italic">No members found.</p>}
              </div>
              {memberNextCursor && (
                <div className="mt-4 flex justify-center">
                  <Button type="button" size="sm" variant="soft" onClick={() => fetchMembers(editModal.company.id, memberNextCursor)} loading={fetchingMembers}>
                    Load More Members
                  </Button>
                </div>
              )}
            </div>
          </form>
        </AdminModal>
      )}

      {/* SETTINGS MODAL */}
      {settingsModal.isOpen && (
        <AdminModal
          open
          onClose={() => setSettingsModal({ isOpen: false })}
          size="sm"
          icon={<FaCog />}
          title="Company Settings"
          subtitle="Global limits for all organizations"
          footer={
            <>
              <Button variant="outline" onClick={() => setSettingsModal({ isOpen: false })}>Cancel</Button>
              <Button type="submit" form="company-settings-form" loading={savingSettings}>Save Settings</Button>
            </>
          }
        >
          <form id="company-settings-form" onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Free Posts Limit</label>
              <input type="number" min="0" value={settings.free_posts_per_company}
                onChange={(e) => setSettings({ ...settings, free_posts_per_company: parseInt(e.target.value) || 0 })} className={FIELD_CLASS} />
              <p className="text-2xs mt-1 text-muted-foreground">Number of posts allowed for free per company.</p>
            </div>
            <div>
              <label className={LABEL_CLASS}>Paid Post Price (₹)</label>
              <input type="number" min="0" step="0.01" value={settings.paid_post_price}
                onChange={(e) => setSettings({ ...settings, paid_post_price: parseFloat(e.target.value) || 0 })} className={FIELD_CLASS} />
              <p className="text-2xs mt-1 text-muted-foreground">Price for each post beyond the free limit.</p>
            </div>
          </form>
        </AdminModal>
      )}

      {deleteConfirm.isOpen && (
        <ConfirmationAlert
          title="Delete Organization"
          message="Are you sure you want to delete this company? This is a hard delete and cannot be undone."
          confirmText="Delete Permanently"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, companyId: null })}
        />
      )}
      {memberToRemove && (
        <ConfirmationAlert
          title="Remove Member"
          message={`Are you sure you want to remove ${memberToRemove.user?.username || "this member"} from the company?`}
          confirmText="Remove Member"
          onConfirm={confirmRemoveMember}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="block text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
