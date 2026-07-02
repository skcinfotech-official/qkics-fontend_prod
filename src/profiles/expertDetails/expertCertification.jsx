import { useState } from "react";
import { useSelector } from "react-redux";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { useConfirm } from "../../context/ConfirmContext";
import { useAlert } from "../../context/AlertContext";
import { GoPlus } from "react-icons/go";
import ModalOverlay from "../../components/ui/ModalOverlay";
import { Button } from "../../components/ui";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

export default function CertificationPage({
  certifications = [],
  setExpertData,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const emptyForm = {
    name: "",
    issuing_organization: "",
    issue_date: "",
    expiration_date: "",
    credential_id: "",
    credential_url: "",
  };

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpenModal(true);
  };

  const openEditModal = (cert) => {
    setForm({ ...cert });
    setEditingId(cert.id);
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        expiration_date: form.expiration_date === "" ? null : form.expiration_date,
      };

      let res;

      if (editingId) {
        res = await axiosSecure.patch(`/v1/experts/certifications/${editingId}/`, payload);

        setExpertData((prev) => ({
          ...prev,
          certifications: prev.certifications.map((c) =>
            c.id === editingId ? res.data : c
          ),
        }));

        showAlert("Certification updated", "success");
      } else {
        res = await axiosSecure.post(`/v1/experts/certifications/`, payload);

        setExpertData((prev) => ({
          ...prev,
          certifications: [...prev.certifications, res.data],
        }));

        showAlert("Certification added", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Certification save failed:", err);
    }
  };

  const deleteCertification = async (id) => {
    showConfirm({
      title: "Delete certification?",
      message: "Are you sure you want to delete this certification? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/certifications/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((c) => c.id !== id),
          }));

          showAlert("Certification deleted successfully!", "success");
        } catch (err) {
          console.log("Delete error:", err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      {/* HEADING + ADD BUTTON */}
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-base font-bold tracking-tight text-foreground">Certifications</h2>

        {!readOnly && (
          <Button size="sm" onClick={openAddModal}>
            <GoPlus size={16} /> Add
          </Button>
        )}
      </div>

      {/* CERTIFICATIONS LIST */}
      {!certifications || certifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm font-medium text-muted-foreground">
          No certifications added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="group relative rounded-xl border border-border bg-muted/30 p-5 transition-all hover:border-primary/30"
            >
              {!readOnly && (
                <div className="absolute right-4 top-4 flex gap-1">
                  <button
                    onClick={() => openEditModal(cert)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FiEdit size={15} />
                  </button>
                  <button
                    onClick={() => deleteCertification(cert.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              )}

              <div className="space-y-1 pr-16">
                <h3 className="text-base font-bold text-foreground">{cert.name}</h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {cert.issuing_organization}
                </p>

                <p className="mt-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                  Issued {cert.issue_date}
                  {cert.expiration_date ? ` • Expires ${cert.expiration_date}` : " • No Expiration"}
                </p>

                {cert.credential_id && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Credential ID: {cert.credential_id}
                  </p>
                )}

                {cert.credential_url && (
                  <p className="mt-2">
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-2xs font-bold uppercase tracking-wider text-primary hover:underline"
                    >
                      View Credential &rarr;
                    </a>
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
                {editingId ? "Edit" : "Add"} <span className="text-primary">Certification</span>
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
                <label className={labelClass}>Certification Name <span className="text-primary">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={fieldClass}
                  placeholder="e.g. AWS Certified Solutions Architect"
                />
              </div>

              <div>
                <label className={labelClass}>Issuing Organization <span className="text-primary">*</span></label>
                <input
                  value={form.issuing_organization}
                  onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
                  className={fieldClass}
                  placeholder="e.g. Amazon Web Services"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Issue Date <span className="text-primary">*</span></label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Expiration Date</label>
                  <input
                    type="date"
                    value={form.expiration_date ?? ""}
                    onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Credential ID</label>
                  <input
                    value={form.credential_id}
                    onChange={(e) => setForm({ ...form, credential_id: e.target.value })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Credential URL</label>
                  <input
                    value={form.credential_url}
                    onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? "Save Changes" : "Add Certification"}</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
