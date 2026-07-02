import { useState, useEffect } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { FiX, FiSave } from "react-icons/fi";
import { Button } from "../../components/ui";

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
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            console.error("Failed to update settings", err);
            setError(err.response?.data?.message || "Failed to update settings. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldClass =
        "w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none bg-muted/40 border-input text-foreground focus:border-primary focus:ring-ring";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-card border border-border text-card-foreground">
                <div className="relative p-6 pb-2">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-full transition-colors text-muted-foreground hover:bg-muted"
                    >
                        <FiX className="text-xl" />
                    </button>
                    <h3 className="text-lg font-bold">Document Settings</h3>
                    <p className="text-sm mt-1 text-muted-foreground">
                        Update download and upload limits
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                            Monthly Upload Limit
                        </label>
                        <input
                            type="number"
                            name="monthly_upload_limit"
                            required
                            min="0"
                            value={formData.monthly_upload_limit}
                            onChange={handleChange}
                            className={fieldClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                            Monthly Download Limit
                        </label>
                        <input
                            type="number"
                            name="monthly_download_limit"
                            required
                            min="0"
                            value={formData.monthly_download_limit}
                            onChange={handleChange}
                            className={fieldClass}
                        />
                    </div>

                    {error && (
                        <div className="mt-2 p-3 rounded-lg border text-sm flex items-center gap-2 bg-danger/10 border-danger/30 text-danger">
                            <FiX className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={isSubmitting}>
                            <FiSave />
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
