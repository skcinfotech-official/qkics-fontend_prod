import { useEffect, useState } from "react";
import {
  FaEye, FaBullhorn, FaImage, FaVideo, FaLink, FaPlus, FaEdit, FaTrash,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import ConfirmationAlert from "../../components/ui/ConfirmationAlert";
import { PageHeader, SearchInput, Button, Badge, AdminModal } from "../../components/ui";
import { AdminTable, TablePagination, StatusBadge, FIELD_CLASS, LABEL_CLASS } from "../adminComponents/adminUi";

const EMPTY_FORM = {
  title: "", file: null, redirect_url: "", start_datetime: "", end_datetime: "",
  description: "", button_text: "Learn More", placement: "sidebar_featured", is_active: true,
};

const formatPlacement = (p) =>
  ({ sidebar_featured: "Sidebar Featured Partner" }[p] || p);

const selectClass = "rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary";

export default function AdminAdvertisements() {
  const { showAlert } = useAlert();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterPlacement, setFilterPlacement] = useState("");
  const [filterMediaType, setFilterMediaType] = useState("");
  const [filterIsActive, setFilterIsActive] = useState("");
  const [ordering, setOrdering] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);

  const [viewModal, setViewModal] = useState({ isOpen: false, ad: null });
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, adId: null });
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, adId: null });

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page);
      if (searchText) params.append("search", searchText);
      if (filterPlacement) params.append("placement", filterPlacement);
      if (filterMediaType) params.append("media_type", filterMediaType);
      if (filterIsActive !== "") params.append("is_active", filterIsActive);
      if (ordering) params.append("ordering", ordering);

      const res = await axiosSecure.get("/v1/admin/ads/?" + params.toString());
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
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

  useEffect(() => { setPage(1); }, [searchText, filterPlacement, filterMediaType, filterIsActive, ordering]);
  useEffect(() => {
    const t = setTimeout(fetchAds, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterPlacement, filterMediaType, filterIsActive, ordering, page]);

  const buildFormData = (form, requireFile) => {
    const fd = new FormData();
    fd.append("title", form.title);
    if (form.file) fd.append("file", form.file);
    fd.append("redirect_url", form.redirect_url);
    fd.append("start_datetime", new Date(form.start_datetime).toISOString());
    fd.append("end_datetime", new Date(form.end_datetime).toISOString());
    if (form.description) fd.append("description", form.description);
    if (form.button_text) fd.append("button_text", form.button_text);
    if (form.placement) fd.append("placement", form.placement);
    fd.append("is_active", form.is_active);
    return fd;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.file || !createForm.redirect_url || !createForm.start_datetime || !createForm.end_datetime) {
      showAlert("Please fill in all required fields", "warning");
      return;
    }
    try {
      setCreateLoading(true);
      await axiosSecure.post("/v1/admin/ads/create/", buildFormData(createForm), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showAlert("Advertisement created successfully", "success");
      setCreateModal(false);
      setCreateForm(EMPTY_FORM);
      fetchAds();
    } catch (err) {
      console.error(err);
      showAlert("Failed to create advertisement", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClick = (ad) => {
    const formatForInput = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setEditForm({
      title: ad.title || "", file: null, redirect_url: ad.redirect_url || "",
      start_datetime: formatForInput(ad.start_datetime), end_datetime: formatForInput(ad.end_datetime),
      description: ad.description || "", button_text: ad.button_text || "Learn More",
      placement: ad.placement || "sidebar_featured", is_active: ad.is_active !== undefined ? ad.is_active : true,
    });
    setEditModal({ isOpen: true, adId: ad.id });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title || !editForm.redirect_url || !editForm.start_datetime || !editForm.end_datetime) {
      showAlert("Please fill in all required fields", "warning");
      return;
    }
    try {
      setEditLoading(true);
      await axiosSecure.patch(`/v1/admin/ads/${editModal.adId}/`, buildFormData(editForm), {
        headers: { "Content-Type": "multipart/form-data" },
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

  const handleDeleteConfirm = async () => {
    try {
      await axiosSecure.delete(`/v1/admin/ads/${deleteModal.adId}/delete/`);
      showAlert("Advertisement deleted successfully", "success");
      setDeleteModal({ isOpen: false, adId: null });
      fetchAds();
    } catch (err) {
      console.error(err);
      showAlert("Failed to delete advertisement", "error");
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "placement", label: "Placement" },
    { key: "media", label: "Media" },
    { key: "duration", label: "Duration" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaBullhorn />}
        title="Advertisements"
        subtitle="Create and schedule sponsored placements"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Advertisements" }]}
      >
        <Button onClick={() => setCreateModal(true)}>
          <FaPlus className="text-2xs" /> Create Ad
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search ads by title, description…" />
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterPlacement} onChange={(e) => setFilterPlacement(e.target.value)} className={selectClass}>
            <option value="">All Placements</option>
            <option value="sidebar_featured">Sidebar Featured</option>
          </select>
          <select value={filterMediaType} onChange={(e) => setFilterMediaType(e.target.value)} className={selectClass}>
            <option value="">All Media</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <select value={filterIsActive} onChange={(e) => setFilterIsActive(e.target.value)} className={selectClass}>
            <option value="">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select value={ordering} onChange={(e) => setOrdering(e.target.value)} className={selectClass}>
            <option value="">Sort By</option>
            <option value="-created_at">Latest Created</option>
            <option value="-start_datetime">Latest Start Time</option>
            <option value="-end_datetime">Latest End Time</option>
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={ads}
        loading={loading}
        loadingLabel="Loading ads…"
        empty={{ icon: <FaBullhorn />, title: "No advertisements found", description: "Create your first ad campaign." }}
        renderRow={(ad) => (
          <>
            <td className="py-3 px-5">
              <p className="font-semibold text-foreground">{ad.title}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.description}</p>
            </td>
            <td className="py-3 px-5"><Badge variant="primary">{formatPlacement(ad.placement)}</Badge></td>
            <td className="py-3 px-5">
              <span className="flex items-center gap-2 text-muted-foreground capitalize">
                {ad.media_type === "image" ? <FaImage className="opacity-60" /> : <FaVideo className="opacity-60" />}
                {ad.media_type}
              </span>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground text-xs">
              <div className="flex flex-col gap-0.5">
                <span><span className="font-semibold">Start:</span> {ad.start_datetime ? new Date(ad.start_datetime).toLocaleDateString() : "N/A"}</span>
                <span><span className="font-semibold">End:</span> {ad.end_datetime ? new Date(ad.end_datetime).toLocaleDateString() : "N/A"}</span>
              </div>
            </td>
            <td className="py-3 px-5 text-center"><StatusBadge active={ad.is_active} /></td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <button title="View Details" onClick={() => setViewModal({ isOpen: true, ad })}
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors"><FaEye /></button>
                <button title="Edit Ad" onClick={() => handleEditClick(ad)}
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><FaEdit /></button>
                <button title="Delete Ad" onClick={() => setDeleteModal({ isOpen: true, adId: ad.id })}
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"><FaTrash /></button>
              </div>
            </td>
          </>
        )}
        footer={
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalAds} shownItems={ads.length}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        }
      />

      {/* VIEW MODAL */}
      {viewModal.isOpen && viewModal.ad && (
        <AdminModal
          open onClose={() => setViewModal({ isOpen: false, ad: null })} size="lg"
          icon={<FaBullhorn />} title={viewModal.ad.title}
          headerExtra={<StatusBadge active={viewModal.ad.is_active} />}
          footer={<Button variant="outline" onClick={() => setViewModal({ isOpen: false, ad: null })}>Close</Button>}
        >
          <div className="space-y-5">
            <div className="w-full flex justify-center bg-muted rounded-xl overflow-hidden border border-border">
              {viewModal.ad.file ? (
                viewModal.ad.media_type === "video"
                  ? <video src={viewModal.ad.file} controls className="max-h-64 object-contain" />
                  : <img src={viewModal.ad.file} alt={viewModal.ad.title} className="max-h-64 object-contain" />
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">No media uploaded</div>
              )}
            </div>
            <div>
              <h4 className={LABEL_CLASS}>Description</h4>
              <p className="text-sm text-foreground">{viewModal.ad.description || "No description provided."}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
                <h4 className={LABEL_CLASS}>Ad Info</h4>
                <AdDetail label="Placement" value={formatPlacement(viewModal.ad.placement)} />
                <AdDetail label="Media Type" value={viewModal.ad.media_type} />
                <AdDetail label="Created By" value={viewModal.ad.created_by || "System"} />
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
                <h4 className={LABEL_CLASS}>Dates</h4>
                <AdDetail label="Start" value={viewModal.ad.start_datetime ? new Date(viewModal.ad.start_datetime).toLocaleString() : "N/A"} />
                <AdDetail label="End" value={viewModal.ad.end_datetime ? new Date(viewModal.ad.end_datetime).toLocaleString() : "N/A"} />
                <AdDetail label="Created At" value={viewModal.ad.created_at ? new Date(viewModal.ad.created_at).toLocaleString() : "N/A"} />
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
              <h4 className={LABEL_CLASS}>Call to Action</h4>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-muted-foreground"><FaLink className="text-sm" /></span>
                <div>
                  <p className="text-2xs uppercase font-bold tracking-wider text-muted-foreground">Redirect URL</p>
                  <a href={viewModal.ad.redirect_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">{viewModal.ad.redirect_url || "No URL provided"}</a>
                </div>
              </div>
              <AdDetail label="Button Text" value={viewModal.ad.button_text || "Default"} />
            </div>
          </div>
        </AdminModal>
      )}

      {/* CREATE MODAL */}
      {createModal && (
        <AdminModal
          open onClose={() => setCreateModal(false)} size="lg" icon={<FaBullhorn />} title="Create Advertisement"
          footer={
            <>
              <Button variant="outline" onClick={() => setCreateModal(false)} disabled={createLoading}>Cancel</Button>
              <Button type="submit" form="ad-create-form" loading={createLoading}>Create Ad</Button>
            </>
          }
        >
          <form id="ad-create-form" onSubmit={handleCreateSubmit}>
            <AdFields form={createForm} setForm={setCreateForm} isEdit={false} />
          </form>
        </AdminModal>
      )}

      {/* EDIT MODAL */}
      {editModal.isOpen && (
        <AdminModal
          open onClose={() => setEditModal({ isOpen: false, adId: null })} size="lg" icon={<FaEdit />} title="Edit Advertisement"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditModal({ isOpen: false, adId: null })} disabled={editLoading}>Cancel</Button>
              <Button type="submit" form="ad-edit-form" loading={editLoading}>Save Changes</Button>
            </>
          }
        >
          <form id="ad-edit-form" onSubmit={handleEditSubmit}>
            <AdFields form={editForm} setForm={setEditForm} isEdit />
          </form>
        </AdminModal>
      )}

      {deleteModal.isOpen && (
        <ConfirmationAlert
          title="Delete Advertisement"
          message="Are you sure you want to delete this advertisement? This action cannot be undone."
          confirmText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal({ isOpen: false, adId: null })}
        />
      )}
    </div>
  );
}

function AdFields({ form, setForm, isEdit }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={LABEL_CLASS}>Title *</label>
        <input type="text" required value={form.title} onChange={(e) => set({ title: e.target.value })} className={FIELD_CLASS} placeholder="Ad Title" />
      </div>
      <div className="md:col-span-2">
        <label className={LABEL_CLASS}>Description</label>
        <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} className={`${FIELD_CLASS} min-h-[80px] resize-none`} placeholder="Ad Description (Optional)" />
      </div>
      <div>
        <label className={LABEL_CLASS}>{isEdit ? "Media File (blank keeps current)" : "Media File *"}</label>
        <input type="file" required={!isEdit} accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && set({ file: e.target.files[0] })}
          className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary-soft/70" />
      </div>
      <div>
        <label className={LABEL_CLASS}>Redirect URL *</label>
        <input type="url" required value={form.redirect_url} onChange={(e) => set({ redirect_url: e.target.value })} className={FIELD_CLASS} placeholder="https://example.com" />
      </div>
      <div>
        <label className={LABEL_CLASS}>Start Datetime *</label>
        <input type="datetime-local" required value={form.start_datetime} onChange={(e) => set({ start_datetime: e.target.value })} className={FIELD_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>End Datetime *</label>
        <input type="datetime-local" required value={form.end_datetime} onChange={(e) => set({ end_datetime: e.target.value })} className={FIELD_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Button Text</label>
        <input type="text" value={form.button_text} onChange={(e) => set({ button_text: e.target.value })} className={FIELD_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Placement</label>
        <select value={form.placement} onChange={(e) => set({ placement: e.target.value })} className={FIELD_CLASS}>
          <option value="sidebar_featured">Sidebar Featured</option>
        </select>
      </div>
      <label className="flex items-center gap-2 cursor-pointer pt-2 md:col-span-2">
        <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="accent-primary h-4 w-4" />
        <span className="text-sm font-medium text-foreground">Active</span>
      </label>
    </div>
  );
}

function AdDetail({ label, value }) {
  return (
    <div>
      <p className="text-2xs uppercase font-bold tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground capitalize">{value}</p>
    </div>
  );
}
