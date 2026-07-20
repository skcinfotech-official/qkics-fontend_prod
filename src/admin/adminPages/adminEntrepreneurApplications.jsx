import { useEffect, useState } from "react";
import {
  FaEye, FaCheck, FaTimes, FaUsers, FaCheckCircle, FaGlobe, FaMapMarkerAlt, FaBuilding, FaUserShield,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { PageHeader, SearchInput, Button, Badge, AdminModal } from "../../components/ui";
import { AdminTable, TablePagination, FIELD_CLASS, LABEL_CLASS } from "../adminComponents/adminUi";

const STATUS_VARIANT = { pending: "warning", approved: "success", rejected: "danger" };

export default function AdminEntrepreneurApplications() {
  const { showAlert } = useAlert();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  const [actionModal, setActionModal] = useState({ isOpen: false, id: null, actionType: null, note: "" });
  const [viewModal, setViewModal] = useState({ isOpen: false, app: null });
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);
      if (searchText) params.append("search", searchText);
      if (filterStatus === "verified") params.append("verified_by_admin", "true");
      else if (filterStatus) params.append("application_status", filterStatus);

      const res = await axiosSecure.get("/v1/admin/entrepreneurs/applications/?" + params.toString());
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
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

  useEffect(() => { setPage(1); }, [searchText, filterStatus]);
  useEffect(() => {
    const t = setTimeout(fetchApplications, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterStatus, page]);

  const submitAction = async () => {
    const { id, actionType, note } = actionModal;
    if (!note.trim() && actionType === "reject") {
      showAlert("A note is required for rejection", "error");
      return;
    }
    try {
      setSubmitting(true);
      await axiosSecure.patch(`/v1/admin/entrepreneurs/applications/${id}/`, { action: actionType, note: note.trim() });
      showAlert(`Application successfully ${actionType}d`, "success");
      setActionModal({ isOpen: false, id: null, actionType: null, note: "" });
      if (viewModal.isOpen) setViewModal({ isOpen: false, app: null });
      fetchApplications();
    } catch (error) {
      console.error(error);
      showAlert(`Failed to ${actionType} application`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "applicant", label: "Applicant" },
    { key: "startup", label: "Startup Details" },
    { key: "stage", label: "Funding Stage" },
    { key: "applied", label: "Applied On" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  const app = viewModal.app;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaUserShield />}
        title="Entrepreneur Applications"
        subtitle="Review and moderate startup onboarding"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Entrepreneur Applications" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search startups, names, industries…" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={applications}
        loading={loading}
        loadingLabel="Loading applications…"
        empty={{ icon: <FaUsers />, title: "No applications found", description: "Nothing to review right now." }}
        renderRow={(a) => (
          <>
            <td className="py-3 px-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex shrink-0 items-center justify-center overflow-hidden">
                  {a.user?.profile_picture ? <img src={a.user.profile_picture} alt="" className="w-full h-full object-cover" /> : <FaUsers className="text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{a.user?.first_name} {a.user?.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{a.user?.username}</p>
                </div>
              </div>
            </td>
            <td className="py-3 px-5">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{a.startup_name}</p>
                {a.verified_by_admin && <FaCheckCircle className="text-primary text-xs" title="Verified by Admin" />}
              </div>
              <p className="text-2xs uppercase font-semibold mt-0.5 truncate max-w-[180px] text-muted-foreground">
                {a.industry} • {a.location}
              </p>
            </td>
            <td className="py-3 px-5 font-medium capitalize text-foreground">{a.funding_stage?.replace("_", " ") || "Unknown"}</td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
            <td className="py-3 px-5 text-center"><Badge variant={STATUS_VARIANT[a.application_status] || "neutral"}>{a.application_status}</Badge></td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <button title="View Details" onClick={() => setViewModal({ isOpen: true, app: a })}
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors"><FaEye /></button>
                <button title="Approve" disabled={a.application_status === "approved"}
                  onClick={() => setActionModal({ isOpen: true, id: a.id, actionType: "approve", note: "" })}
                  className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"><FaCheck /></button>
                <button title="Reject" disabled={a.application_status === "rejected"}
                  onClick={() => setActionModal({ isOpen: true, id: a.id, actionType: "reject", note: "" })}
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"><FaTimes /></button>
              </div>
            </td>
          </>
        )}
        footer={
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalApplications} shownItems={applications.length}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        }
      />

      {/* ACTION MODAL */}
      {actionModal.isOpen && (
        <AdminModal
          open onClose={() => setActionModal({ ...actionModal, isOpen: false })} size="sm"
          title={`${actionModal.actionType ? actionModal.actionType[0].toUpperCase() + actionModal.actionType.slice(1) : ""} Application`}
          footer={
            <>
              <Button variant="outline" onClick={() => setActionModal({ ...actionModal, isOpen: false })} disabled={submitting}>Cancel</Button>
              <Button variant={actionModal.actionType === "reject" ? "danger" : "primary"} onClick={submitAction} loading={submitting}>Confirm</Button>
            </>
          }
        >
          <div>
            <label className={LABEL_CLASS}>
              Note / Reason {actionModal.actionType === "reject" && <span className="text-danger">*</span>}
            </label>
            <textarea
              value={actionModal.note}
              onChange={(e) => setActionModal({ ...actionModal, note: e.target.value })}
              placeholder={`Enter reason for ${actionModal.actionType}…`}
              className={`${FIELD_CLASS} min-h-[100px] resize-none`}
              autoFocus
            />
          </div>
        </AdminModal>
      )}

      {/* VIEW MODAL */}
      {viewModal.isOpen && app && (
        <AdminModal
          open onClose={() => setViewModal({ isOpen: false, app: null })} size="lg"
          title={app.startup_name}
          subtitle={app.one_liner}
          icon={app.logo ? <img src={app.logo} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <FaBuilding />}
          headerExtra={<Badge variant={STATUS_VARIANT[app.application_status] || "neutral"}>{app.application_status}</Badge>}
          footer={
            <>
              <Button variant="outline" onClick={() => setViewModal({ isOpen: false, app: null })}>Close</Button>
              {app.application_status !== "rejected" && (
                <Button variant="danger" onClick={() => setActionModal({ isOpen: true, id: app.id, actionType: "reject", note: "" })}>Reject Startup</Button>
              )}
              {app.application_status !== "approved" && (
                <Button className="!bg-green-600 hover:!bg-green-700 !text-white" onClick={() => setActionModal({ isOpen: true, id: app.id, actionType: "approve", note: "" })}>Approve Startup</Button>
              )}
            </>
          }
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-border bg-muted/40 flex items-center gap-4">
              {app.user?.profile_picture ? (
                <img src={app.user.profile_picture} alt="Applicant" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center"><FaUsers className="text-muted-foreground" /></span>
              )}
              <div>
                <p className="text-2xs uppercase font-bold text-muted-foreground mb-0.5 tracking-wider">Applicant</p>
                <p className="font-medium text-foreground">
                  {app.user?.first_name} {app.user?.last_name}{" "}
                  <span className="text-muted-foreground text-sm font-normal">(@{app.user?.username})</span>
                </p>
                <p className="text-xs text-muted-foreground">{app.is_owner ? "Owner / Founder" : "Representative"}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-4">
              <h4 className={LABEL_CLASS}>Company Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="font-medium text-foreground">{app.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Funding Stage</p>
                  <p className="font-medium capitalize text-foreground">{app.funding_stage?.replace("_", " ")}</p>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <FaMapMarkerAlt className="text-muted-foreground" /> <span className="font-medium">{app.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-muted-foreground" />
                  {app.website ? (
                    <a href={app.website} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium truncate">{app.website}</a>
                  ) : (
                    <span className="text-muted-foreground">No website provided</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className={`${LABEL_CLASS} mb-2`}>About the Startup</h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {app.description || "No detailed description provided by the applicant."}
              </p>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
