import { useEffect, useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { AdminModal, Button } from "../../components/ui";
import { FIELD_CLASS, LABEL_CLASS } from "./adminUi";

export default function DocumentFormModal({ document, onClose, onSuccess }) {
  const isEdit = Boolean(document);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState("FREE");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title || "");
      setDescription(document.description || "");
      setAccessType(document.access_type || "FREE");
    }
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit) {
        const hasFile = Boolean(file);
        let payload;
        let headers = {};
        if (hasFile) {
          payload = new FormData();
          payload.append("title", title);
          payload.append("description", description);
          payload.append("access_type", accessType);
          payload.append("file", file);
          headers["Content-Type"] = "multipart/form-data";
        } else {
          payload = { title, description, access_type: accessType };
        }
        await axiosSecure.patch(`/v1/documents/admin/${document.uuid}/update/`, payload, { headers });
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("access_type", accessType);
        formData.append("file", file);
        await axiosSecure.post("/v1/documents/admin/upload/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Document save failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      icon={<FaFileAlt />}
      title={isEdit ? "Update Document" : "Upload Document"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="document-form" loading={loading}>{isEdit ? "Update" : "Upload"}</Button>
        </>
      }
    >
      <form id="document-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={FIELD_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className={`${FIELD_CLASS} resize-none`} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Access Type</label>
          <select value={accessType} onChange={(e) => setAccessType(e.target.value)} className={FIELD_CLASS}>
            <option value="FREE">FREE</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>{isEdit ? "Replace File (optional)" : "Upload File"}</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            required={!isEdit}
            className="mt-1 w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary-soft/70"
          />
        </div>
      </form>
    </AdminModal>
  );
}
