import { useState, useEffect } from "react";
import { FiX, FiSave } from "react-icons/fi";
import { FaCog } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { AdminModal, Button } from "../../components/ui";
import { FIELD_CLASS, LABEL_CLASS } from "./adminUi";

export default function DocumentSettingsModal({ isOpen, onClose, settings, onSuccess }) {
  const [formData, setFormData] = useState({
    monthly_upload_limit: 5,
    monthly_download_limit: 20,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings) {
      setFormData({
        monthly_upload_limit: settings.monthly_upload_limit ?? 5,
        monthly_download_limit: settings.monthly_download_limit ?? 20,
      });
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await axiosSecure.patch("/v1/documents/admin/settings/", formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to update settings", err);
      setError(err.response?.data?.message || "Failed to update settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      icon={<FaCog />}
      title="Document Settings"
      subtitle="Update download and upload limits"
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="doc-settings-form" loading={isSubmitting}>
            <FiSave /> Save Settings
          </Button>
        </>
      }
    >
      <form id="doc-settings-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={LABEL_CLASS}>Monthly Upload Limit</label>
          <input type="number" name="monthly_upload_limit" required min="0" value={formData.monthly_upload_limit} onChange={handleChange} className={FIELD_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Monthly Download Limit</label>
          <input type="number" name="monthly_download_limit" required min="0" value={formData.monthly_download_limit} onChange={handleChange} className={FIELD_CLASS} />
        </div>
        {error && (
          <div className="p-3 rounded-lg border text-sm flex items-center gap-2 bg-danger/10 border-danger/30 text-danger">
            <FiX className="flex-shrink-0" /> {error}
          </div>
        )}
      </form>
    </AdminModal>
  );
}
