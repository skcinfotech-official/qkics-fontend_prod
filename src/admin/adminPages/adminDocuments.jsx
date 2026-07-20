import { useEffect, useState } from "react";
import { FaEdit, FaEye, FaPlus, FaFileAlt } from "react-icons/fa";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import axiosSecure from "../../components/utils/axiosSecure";
import { PageHeader, SearchInput, Button, Badge } from "../../components/ui";
import { AdminTable, StatusBadge } from "../adminComponents/adminUi";
import DocumentFormModal from "../adminComponents/DocumentFormModal";
import DocumentSettingsModal from "../adminComponents/DocumentSettingsModal";

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/documents/admin/list/");
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setDocuments(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axiosSecure.get("/v1/documents/admin/settings/");
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => { fetchDocuments(); fetchSettings(); }, []);

  useEffect(() => {
    const s = searchText.toLowerCase();
    setFiltered(
      documents?.filter(
        (d) => d.title.toLowerCase().includes(s) || d.access_type.toLowerCase().includes(s)
      ) || []
    );
  }, [searchText, documents]);

  const toggleStatus = async (doc) => {
    try {
      await axiosSecure.patch(`/v1/documents/admin/${doc.uuid}/toggle-status/`, { is_active: !doc.is_active });
      fetchDocuments();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const columns = [
    { key: "title", label: "Title" },
    { key: "description", label: "Description", className: "w-1/3" },
    { key: "access", label: "Access", align: "center" },
    { key: "status", label: "Status", align: "center" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaFileAlt />}
        title="Documents Management"
        subtitle="Upload, edit and control access to documents"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Documents" }]}
      >
        <Button onClick={() => { setEditingDoc(null); setShowModal(true); }}>
          <FaPlus className="text-2xs" /> Upload Document
        </Button>
      </PageHeader>

      {/* Settings summary */}
      {settings && (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Upload Limit</span>
              <span className="text-2xl font-black text-primary">
                {settings.monthly_upload_limit} <span className="text-sm font-medium text-muted-foreground">/ month</span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Download Limit</span>
              <span className="text-2xl font-black text-primary">
                {settings.monthly_download_limit} <span className="text-sm font-medium text-muted-foreground">/ month</span>
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Last Updated</span>
              <span className="text-xs font-medium text-muted-foreground">
                {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <FaEdit /> Edit Settings
          </Button>
        </div>
      )}

      <SearchInput value={searchText} onChange={setSearchText} placeholder="Search documents by title or access type…" />

      <AdminTable
        columns={columns}
        rows={filtered}
        loading={loading}
        loadingLabel="Loading documents…"
        keyField="uuid"
        empty={{ icon: <FaFileAlt />, title: "No documents found", description: "Upload your first document." }}
        renderRow={(doc) => (
          <>
            <td className="py-3 px-5 font-semibold text-foreground">{doc.title}</td>
            <td className="py-3 px-5 text-xs text-muted-foreground truncate max-w-[200px]">{doc.description}</td>
            <td className="py-3 px-5 text-center">
              <Badge variant={doc.access_type === "PREMIUM" ? "primary" : "neutral"}>{doc.access_type}</Badge>
            </td>
            <td className="py-3 px-5 text-center"><StatusBadge active={doc.is_active} /></td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <a href={doc.file} target="_blank" rel="noreferrer" title="View Document"
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors">
                  <FaEye />
                </a>
                <button onClick={() => { setEditingDoc(doc); setShowModal(true); }} title="Edit"
                  className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <FaEdit />
                </button>
                <button onClick={() => toggleStatus(doc)} title={doc.is_active ? "Deactivate" : "Activate"}
                  className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors">
                  {doc.is_active ? <MdToggleOn size={18} /> : <MdToggleOff size={18} />}
                </button>
              </div>
            </td>
          </>
        )}
      />

      {showModal && (
        <DocumentFormModal
          document={editingDoc}
          onClose={() => setShowModal(false)}
          onSuccess={fetchDocuments}
        />
      )}

      <DocumentSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSuccess={fetchSettings}
      />
    </div>
  );
}
