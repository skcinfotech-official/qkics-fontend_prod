import { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaTags } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";
import { PageHeader, SearchInput, Button, AdminModal } from "../../components/ui";
import { AdminTable, FIELD_CLASS, LABEL_CLASS } from "../adminComponents/adminUi";

function TagModal({ title, placeholder, initial = "", onClose, onSubmit }) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await onSubmit(name);
    setSaving(false);
  };

  return (
    <AdminModal
      open onClose={onClose} icon={<FaTags />} title={title} size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save</Button>
        </>
      }
    >
      <div>
        <label className={LABEL_CLASS}>Tag Name</label>
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={placeholder} className={FIELD_CLASS} autoFocus
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
    </AdminModal>
  );
}

export default function AdminTags() {
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [tags, setTags] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTag, setEditTag] = useState(null);
  const [searchText, setSearchText] = useState("");

  const fetchTags = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/community/tags/");
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTags(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  useEffect(() => {
    const s = searchText.toLowerCase();
    setFiltered(tags.filter((t) => t.name.toLowerCase().includes(s) || t.slug.toLowerCase().includes(s)));
  }, [searchText, tags]);

  const handleAddTag = async (name) => {
    if (!name.trim()) return showAlert("Tag name cannot be empty", "error");
    try {
      const res = await axiosSecure.post("/v1/community/tags/", { name: name.trim() });
      const updated = [...tags, res.data];
      setTags(updated);
      setShowAddModal(false);
      showAlert("Tag added successfully!", "success");
    } catch {
      showAlert("Failed to add tag", "error");
    }
  };

  const handleEditTag = async (name) => {
    if (!editTag || !name.trim()) return;
    try {
      const res = await axiosSecure.put(`/v1/community/tags/${editTag.id}/`, { name: name.trim() });
      setTags(tags.map((t) => (t.id === editTag.id ? res.data : t)));
      setEditTag(null);
      showAlert("Tag updated successfully!", "success");
    } catch {
      showAlert("Failed to update tag", "error");
    }
  };

  const handleDeleteTag = (id) => {
    showConfirm({
      title: "Delete Tag?",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/tags/${id}/`);
          setTags(tags.filter((t) => t.id !== id));
          showAlert("Tag deleted!", "success");
        } catch {
          showAlert("Failed to delete tag", "error");
        }
      },
    });
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaTags />}
        title="Tags Directory"
        subtitle="Manage community post tags"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Tags" }]}
      >
        <Button onClick={() => setShowAddModal(true)}>
          <FaPlus className="text-2xs" /> Add Tag
        </Button>
      </PageHeader>

      <SearchInput value={searchText} onChange={setSearchText} placeholder="Search tags by name or slug…" />

      <AdminTable
        columns={columns}
        rows={filtered}
        loading={loading}
        loadingLabel="Loading tags…"
        empty={{ icon: <FaTags />, title: "No tags found", description: "Add your first tag." }}
        renderRow={(tag) => (
          <>
            <td className="py-3 px-5 font-semibold text-foreground">{tag.name}</td>
            <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{tag.slug}</td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => setEditTag(tag)} title="Edit"
                  className="p-2 rounded-lg text-primary hover:bg-primary-soft transition-colors"><FaEdit /></button>
                <button onClick={() => handleDeleteTag(tag.id)} title="Delete"
                  className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"><FaTrash /></button>
              </div>
            </td>
          </>
        )}
      />

      {showAddModal && (
        <TagModal title="Add New Tag" placeholder="Enter tag name…" onClose={() => setShowAddModal(false)} onSubmit={handleAddTag} />
      )}
      {editTag && (
        <TagModal title="Edit Tag" placeholder="Update tag name…" initial={editTag.name} onClose={() => setEditTag(null)} onSubmit={handleEditTag} />
      )}
    </div>
  );
}
