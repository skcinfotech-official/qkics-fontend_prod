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

export default function ExperiencePage({
  experiences = [],
  setExpertData,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const emptyForm = {
    job_title: "",
    company: "",
    employment_type: "",
    location: "",
    start_date: "",
    end_date: "",
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

  const openEditModal = (exp) => {
    setEditingId(exp.id);
    setForm({ ...exp });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        job_title: form.job_title,
        company: form.company,
        employment_type: form.employment_type,
        location: form.location,
        start_date: form.start_date,
        end_date:
          form.end_date === "" || form.end_date === null || form.end_date === undefined
            ? null
            : form.end_date,
        description: form.description,
      };

      let res;

      if (editingId) {
        res = await axiosSecure.patch(`/v1/experts/experience/${editingId}/`, payload);

        setExpertData((prev) => ({
          ...prev,
          experiences: prev.experiences.map((exp) =>
            exp.id === editingId ? res.data : exp
          ),
        }));

        showAlert("Experience updated successfully!", "success");
      } else {
        res = await axiosSecure.post(`/v1/experts/experience/`, payload);

        setExpertData((prev) => ({
          ...prev,
          experiences: [...prev.experiences, res.data],
        }));

        showAlert("Experience added successfully!", "success");
      }

      setOpenModal(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.log("Experience save failed:", err);
    }
  };

  const deleteExperience = async (id) => {
    showConfirm({
      title: "Delete experience?",
      message: "Are you sure you want to delete this experience? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/experts/experience/${id}/`);

          setExpertData((prev) => ({
            ...prev,
            experiences: prev.experiences.filter((c) => c.id !== id),
          }));

          showAlert("Experience deleted successfully!", "success");
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
        <h2 className="text-base font-bold tracking-tight text-foreground">Experience</h2>

        {!readOnly && (
          <Button size="sm" onClick={openAddModal}>
            <GoPlus size={16} /> Add
          </Button>
        )}
      </div>

      {experiences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm font-medium text-muted-foreground">
          No experience added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="group relative rounded-xl border border-border bg-muted/30 p-5 transition-all hover:border-primary/30"
            >
              {!readOnly && (
                <div className="absolute right-4 top-4 flex gap-1">
                  <button
                    onClick={() => openEditModal(exp)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <FiEdit size={15} />
                  </button>
                  <button
                    onClick={() => deleteExperience(exp.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              )}

              <div className="space-y-1 pr-16">
                <h3 className="text-base font-bold text-foreground">{exp.job_title}</h3>

                <p className="text-sm font-medium text-muted-foreground">
                  {exp.company}
                  {exp.location ? ` • ${exp.location}` : ""}
                </p>

                <p className="mt-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                  {exp.employment_type?.replace("_", " ")} • {exp.start_date} — {exp.end_date ? exp.end_date : "Present"}
                </p>

                {exp.description && (
                  <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
                    {exp.description}
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
                {editingId ? "Edit" : "Add"} <span className="text-primary">Experience</span>
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid gap-5">

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Job Title <span className="text-primary">*</span></label>
                  <input
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <label className={labelClass}>Company <span className="text-primary">*</span></label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. Google"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Location <span className="text-primary">*</span></label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className={fieldClass}
                    placeholder="e.g. New York, USA"
                  />
                </div>
                <div>
                  <label className={labelClass}>Employment Type <span className="text-primary">*</span></label>
                  <select
                    value={form.employment_type}
                    onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                    className={fieldClass}
                  >
                    <option value="">Select Type</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Start Date <span className="text-primary">*</span></label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>End Date</label>
                  <input
                    type="date"
                    value={form.end_date ?? ""}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
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
                  placeholder="Describe your role and achievements..."
                />
              </div>

            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button variant="ghost" onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingId ? "Save Changes" : "Add Experience"}</Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
