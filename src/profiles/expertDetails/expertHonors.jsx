import { useState } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";
import { GoPlus } from "react-icons/go";
import ModalOverlay from "../../components/ui/ModalOverlay";
import { Button } from "../../components/ui";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

export default function HonorsPage({
  honors_awards = [],
  setExpertData,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const emptyForm = {
    title: "",
    issuer: "",
    issue_date: "",
    description: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpenModal(true);
  };

  const openEditModal = (honor) => {
    setForm({ ...honor });
    setEditingId(honor.id);
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        title: form.title,
        issuer: form.issuer,
        issue_date: form.issue_date,
        description: form.description,
      };

      let res;

      if (editingId) {
        res = await axiosSecure.patch(`/v1/experts/honors/${editingId}/`, payload);

        setExpertData((prev) => ({
          ...prev,
          honors_awards: (prev.honors_awards || []).map((h) =>
            h.id === editingId ? res.data : h
          ),
        }));

        showAlert("Honor updated successfully!", "success");
      } else {
        res = await axiosSecure.post(`/v1/experts/honors/`, payload);

        setExpertData((prev) => ({
          ...prev,
          honors_awards: [...(prev.honors_awards || []), res.data],
        }));

        showAlert("Honor added successfully!", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Honor save failed:", err);
      showAlert("Failed to save honor!", "error");
    }
  };

  const deleteHonor = async (id) => {
    showConfirm({
      title: "Delete Honor/Award?",
      message: "Are you sure you want to delete this honor?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/honors/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            honors_awards: (prev.honors_awards || []).filter((h) => h.id !== id),
          }));

          showAlert("Honor deleted successfully!", "success");
        } catch (err) {
          console.log("Delete failed:", err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-base font-bold tracking-tight text-foreground">Honors &amp; Awards</h2>

        {!readOnly && (
          <Button size="sm" onClick={openAddModal}>
            <GoPlus size={16} /> Add
          </Button>
        )}
      </div>

      {/* HONORS LIST */}
      {!honors_awards || honors_awards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm font-medium text-muted-foreground">
          No honors added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {honors_awards.map((h) => (
            <div
              key={h.id}
              className="group relative rounded-xl border border-border bg-muted/30 p-5 transition-all hover:border-primary/30"
            >
              {!readOnly && (
                <div className="absolute right-4 top-4 flex gap-1">
                  <button
                    onClick={() => openEditModal(h)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FiEdit size={15} />
                  </button>
                  <button
                    onClick={() => deleteHonor(h.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              )}

              <div className="space-y-1 pr-16">
                <h3 className="text-base font-bold text-foreground">{h.title}</h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {h.issuer || "Unknown Issuer"}
                </p>

                <p className="mt-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                  Issued {h.issue_date}
                </p>

                {h.description && (
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {h.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {!readOnly && openModal && (
        <ModalOverlay close={() => setOpenModal(false)}>
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl md:p-8">

            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {editingId ? "Edit" : "Add"} <span className="text-primary">Honor</span>
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid gap-5">
              <div>
                <label className={labelClass}>Title <span className="text-primary">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={fieldClass}
                  placeholder="e.g. Best Innovator"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Issuer</label>
                  <input
                    value={form.issuer}
                    onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. TechCrunch"
                  />
                </div>

                <div>
                  <label className={labelClass}>Issue Date <span className="text-primary">*</span></label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={fieldClass}
                  placeholder="Describe the honor or award..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? "Save Changes" : "Add Honor"}</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
