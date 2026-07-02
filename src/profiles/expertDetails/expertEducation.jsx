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

export default function EducationPage({
  education = [],
  setExpertData,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const emptyForm = {
    school: "",
    degree: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
    grade: "",
    description: "",
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

  const openEditModal = (edu) => {
    setForm({ ...edu });
    setEditingId(edu.id);
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        end_year: form.end_year ? Number(form.end_year) : null,
        start_year: form.start_year ? Number(form.start_year) : null,
      };

      let res;

      if (editingId) {
        res = await axiosSecure.patch(`/v1/experts/education/${editingId}/`, payload);

        setExpertData((prev) => ({
          ...prev,
          educations: prev.educations.map((e) =>
            e.id === editingId ? res.data : e
          ),
        }));

        showAlert("Education updated", "success");
      } else {
        res = await axiosSecure.post(`/v1/experts/education/`, payload);

        setExpertData((prev) => ({
          ...prev,
          educations: [...prev.educations, res.data],
        }));

        showAlert("Education added", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Education save failed:", err);
    }
  };

  const deleteEducation = async (id) => {
    showConfirm({
      title: "Delete education?",
      message: "Are you sure you want to delete this education? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/education/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            educations: prev.educations.filter((c) => c.id !== id),
          }));

          showAlert("Education deleted successfully!", "success");
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
        <h2 className="text-base font-bold tracking-tight text-foreground">Education</h2>

        {!readOnly && (
          <Button size="sm" onClick={openAddModal}>
            <GoPlus size={16} /> Add
          </Button>
        )}
      </div>

      {/* EDUCATION LIST */}
      {!education || education.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm font-medium text-muted-foreground">
          No education added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="group relative rounded-xl border border-border bg-muted/30 p-5 transition-all hover:border-primary/30"
            >
              {!readOnly && (
                <div className="absolute right-4 top-4 flex gap-1">
                  <button
                    onClick={() => openEditModal(edu)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FiEdit size={15} />
                  </button>
                  <button
                    onClick={() => deleteEducation(edu.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              )}

              <div className="space-y-1 pr-16">
                <h3 className="text-base font-bold text-foreground">{edu.school}</h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {edu.degree}
                  {edu.field_of_study ? ` • ${edu.field_of_study}` : ""}
                </p>

                <p className="mt-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                  {edu.start_year} — {edu.end_year ? edu.end_year : "Present"}
                  {edu.grade ? ` • Grade: ${edu.grade}` : ""}
                </p>

                {edu.description && (
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {edu.description}
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
                {editingId ? "Edit" : "Add"} <span className="text-primary">Education</span>
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
                <label className={labelClass}>Institute <span className="text-primary">*</span></label>
                <input
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  className={fieldClass}
                  placeholder="e.g. Stanford University"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Degree <span className="text-primary">*</span></label>
                  <input
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. Bachelor's"
                  />
                </div>
                <div>
                  <label className={labelClass}>Field of Study <span className="text-primary">*</span></label>
                  <input
                    value={form.field_of_study}
                    onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Start Year <span className="text-primary">*</span></label>
                  <input
                    type="number"
                    value={form.start_year}
                    onChange={(e) => setForm({ ...form, start_year: e.target.value })}
                    className={fieldClass}
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className={labelClass}>End Year</label>
                  <input
                    type="number"
                    value={form.end_year ?? ""}
                    onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                    className={fieldClass}
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className={labelClass}>Grade <span className="text-primary">*</span></label>
                  <input
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. 3.8 GPA"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={fieldClass}
                  placeholder="Activities and societies..."
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? "Save Changes" : "Add Education"}</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
