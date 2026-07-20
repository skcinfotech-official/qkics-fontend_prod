import { useState } from "react";
import { FaCreditCard } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { AdminModal, Button } from "../../components/ui";
import { FIELD_CLASS, LABEL_CLASS } from "./adminUi";

export default function SubscriptionFormModal({ plan, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: plan?.name || "",
    price: plan?.price || "",
    duration_days: plan?.duration_days || "",
    premium_doc_limit_per_month: plan?.premium_doc_limit_per_month || "",
    free_consultation_count: plan?.free_consultation_count || "",
    free_chat_per_month: plan?.free_chat_per_month || "",
    is_active: plan?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      if (plan) {
        await axiosSecure.put(`/v1/subscriptions/admin/plans/${plan.uuid}/`, form);
      } else {
        await axiosSecure.post("/v1/subscriptions/admin/plans/", form);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: "name", label: "Plan Name" },
    { name: "price", label: "Price (₹)" },
    { name: "duration_days", label: "Duration (Days)" },
    { name: "premium_doc_limit_per_month", label: "Premium Documents / Month" },
    { name: "free_consultation_count", label: "Free Consultations" },
    { name: "free_chat_per_month", label: "Free Chats / Month" },
  ];

  return (
    <AdminModal
      open
      onClose={onClose}
      icon={<FaCreditCard />}
      title={plan ? "Edit Subscription Plan" : "Create Subscription Plan"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.name}>
            <label className={LABEL_CLASS}>{f.label}</label>
            <input name={f.name} value={form[f.name]} onChange={handleChange} className={FIELD_CLASS} />
          </div>
        ))}
        <label className="flex items-center gap-2 pt-1 cursor-pointer">
          <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="accent-primary h-4 w-4" />
          <span className="text-sm font-medium text-foreground">Active</span>
        </label>
      </div>
    </AdminModal>
  );
}
