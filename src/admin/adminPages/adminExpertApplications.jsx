import { useEffect, useState } from "react";
import { FaEye, FaCheck, FaTimes, FaUsers, FaUserTie } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { PageHeader, SearchInput, Button, Badge, AdminModal } from "../../components/ui";
import { AdminTable, TablePagination, FIELD_CLASS, LABEL_CLASS } from "../adminComponents/adminUi";

const STATUS_VARIANT = { pending: "warning", approved: "success", rejected: "danger" };

export default function AdminExpertApplications() {
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
      if (filterStatus) params.append("application_status", filterStatus);

      const res = await axiosSecure.get("/v1/admin/experts/applications/?" + params.toString());
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
      showAlert("Failed to load expert applications", "error");
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
      await axiosSecure.patch(`/v1/admin/experts/applications/${id}/`, { action: actionType, note: note.trim() });
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
    { key: "expertise", label: "Expertise" },
    { key: "rate", label: "Hourly Rate" },
    { key: "applied", label: "Applied On" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  const app = viewModal.app;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaUserTie />}
        title="Expert Applications"
        subtitle="Review and moderate expert onboarding"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Expert Applications" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search applicants…" />
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
                  <p className="font-semibold text-foreground truncate">{a.first_name} {a.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{a.user?.username}</p>
                </div>
              </div>
            </td>
            <td className="py-3 px-5">
              <p className="font-medium text-foreground">{a.primary_expertise}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">{a.other_expertise || "-"}</p>
            </td>
            <td className="py-3 px-5 font-medium text-foreground">₹{a.hourly_rate}</td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              {new Date(a.application_submitted_at || a.created_at).toLocaleDateString()}
            </td>
            <td className="py-3 px-5 text-center">
              <Badge variant={STATUS_VARIANT[a.application_status] || "neutral"}>{a.application_status}</Badge>
            </td>
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
          open onClose={() => setViewModal({ isOpen: false, app: null })} size="xl"
          title={`${app.first_name} ${app.last_name}`}
          subtitle={app.headline || `@${app.user?.username}`}
          icon={app.user?.profile_picture ? <img src={app.user.profile_picture} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <FaUsers />}
          headerExtra={<Badge variant={STATUS_VARIANT[app.application_status] || "neutral"}>{app.application_status}</Badge>}
          footer={
            <>
              <Button variant="outline" onClick={() => setViewModal({ isOpen: false, app: null })}>Close</Button>
              {app.application_status !== "rejected" && (
                <Button variant="danger" onClick={() => setActionModal({ isOpen: true, id: app.id, actionType: "reject", note: "" })}>Reject Expert</Button>
              )}
              {app.application_status !== "approved" && (
                <Button className="!bg-green-600 hover:!bg-green-700 !text-white" onClick={() => setActionModal({ isOpen: true, id: app.id, actionType: "approve", note: "" })}>Approve Expert</Button>
              )}
            </>
          }
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-border bg-muted/40">
              <h4 className={`${LABEL_CLASS} mb-3`}>Expertise Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-2xs uppercase text-muted-foreground">Primary Field</p>
                  <p className="font-medium text-foreground">{app.primary_expertise || "-"}</p>
                </div>
                <div>
                  <p className="text-2xs uppercase text-muted-foreground">Other Expertise</p>
                  <p className="text-sm text-foreground mt-1">{app.other_expertise || "-"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Experience" items={app.experiences} render={(exp) => (
                <>
                  <h5 className="font-semibold text-sm text-foreground">{exp.job_title}</h5>
                  <p className="text-xs font-medium text-muted-foreground">{exp.company} • {exp.employment_type?.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground mb-1">{exp.start_date} - {exp.end_date || "Present"} | {exp.location}</p>
                  {exp.description && <p className="text-xs text-muted-foreground line-clamp-2">{exp.description}</p>}
                </>
              )} />
              <Section title="Education" items={app.educations} render={(edu) => (
                <>
                  <h5 className="font-semibold text-sm text-foreground">{edu.school}</h5>
                  <p className="text-xs font-medium text-muted-foreground">{edu.degree} in {edu.field_of_study}</p>
                  <p className="text-xs text-muted-foreground mb-1">{edu.start_year} - {edu.end_year || "Present"} {edu.grade ? `| Grade: ${edu.grade}` : ""}</p>
                  {edu.description && <p className="text-xs text-muted-foreground line-clamp-2">{edu.description}</p>}
                </>
              )} />
              <Section title="Certifications" items={app.certifications} render={(cert) => (
                <>
                  <h5 className="font-semibold text-sm text-foreground">{cert.name}</h5>
                  <p className="text-xs font-medium text-muted-foreground">{cert.issuing_organization}</p>
                  <p className="text-xs text-muted-foreground">Issued: {cert.issue_date} {cert.expiration_date ? `- Expires: ${cert.expiration_date}` : ""}</p>
                  {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" className="text-xs mt-1 inline-block text-primary hover:underline">View Credential</a>}
                </>
              )} />
              <Section title="Honors & Awards" items={app.honors_awards} render={(award) => (
                <>
                  <h5 className="font-semibold text-sm text-foreground">{award.title}</h5>
                  <p className="text-xs font-medium text-muted-foreground">{award.issuer}</p>
                  <p className="text-xs text-muted-foreground">Issued: {award.issue_date}</p>
                  {award.description && <p className="text-xs text-muted-foreground line-clamp-2">{award.description}</p>}
                </>
              )} />
            </div>

            {app.admin_review_note && (
              <div className="p-4 rounded-xl border border-danger/30 bg-danger/10">
                <h4 className="text-2xs font-bold uppercase tracking-wider text-danger mb-2">Admin Review Note</h4>
                <p className="text-sm text-danger">{app.admin_review_note}</p>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}

function Section({ title, items, render }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-foreground mb-3">{title}</h4>
      {items?.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-3 rounded-lg border border-border bg-muted/30">
              {render(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added.</p>
      )}
    </div>
  );
}
