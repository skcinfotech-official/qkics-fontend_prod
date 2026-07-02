import { useEffect, useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { Button } from "../../components/ui";

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

        await axiosSecure.patch(
          `/v1/documents/admin/${document.uuid}/update/`,
          payload,
          { headers }
        );
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("access_type", accessType);
        formData.append("file", file);

        await axiosSecure.post(
          "/v1/documents/admin/upload/",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Document save failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 rounded border mt-1 bg-muted/40 border-input text-foreground focus:ring-ring focus:border-primary outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-3xl rounded-xl p-6 shadow-xl border border-border bg-card text-card-foreground">
        <h3 className="text-lg font-bold mb-4">
          {isEdit ? "Update Document" : "Upload Document"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Access Type</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className={fieldClass}
            >
              <option value="FREE">FREE</option>
              <option value="PREMIUM">PREMIUM</option>
              {/* <option value="PAID">PAID</option> */}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mr-2">
              {isEdit ? "Replace File (optional) :" : "Upload File :"}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              required={!isEdit}
              className="mt-1 border border-input px-3 rounded py-2 text-foreground"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Update" : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
