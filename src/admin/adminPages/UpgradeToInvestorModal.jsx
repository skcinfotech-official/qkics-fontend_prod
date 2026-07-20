import { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { AdminModal, Button, LoadingSpinner } from "../../components/ui";
import {
  FIELD_CLASS, LABEL_CLASS, FormSection, SearchableMultiSelect,
} from "../adminComponents/adminUi";

const EMPTY = {
  display_name: "", one_liner: "", investment_thesis: "",
  focus_industries: [], preferred_stages: [],
  check_size_min: "", check_size_max: "", location: "",
  website_url: "", linkedin_url: "", twitter_url: "", investor_type: "angel",
};

export default function UpgradeToInvestorModal({ isOpen, onClose, onSuccess, user }) {
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [stages, setStages] = useState([]);
  const [formData, setFormData] = useState(EMPTY);

  useEffect(() => {
    if (isOpen && user) {
      fetchOptions();
      const defaultName = (user.first_name || user.last_name)
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : user.username;
      setFormData({ ...EMPTY, display_name: defaultName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const fetchOptions = async () => {
    try {
      setFetchingOptions(true);
      const [indRes, stageRes] = await Promise.all([
        axiosSecure.get("/v1/investors/industries/"),
        axiosSecure.get("/v1/investors/stages/"),
      ]);
      setIndustries(indRes.data || []);
      setStages(stageRes.data || []);
    } catch (error) {
      console.error(error);
      showAlert("Failed to load industries/stages.", "error");
    } finally {
      setFetchingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...formData,
        user_id: user.id,
        check_size_min: formData.check_size_min ? Number(formData.check_size_min) : null,
        check_size_max: formData.check_size_max ? Number(formData.check_size_max) : null,
      };
      await axiosSecure.post("/v1/investors/admin/create-profile/", payload);
      showAlert("User successfully upgraded to investor!", "success");
      onSuccess();
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Failed to upgrade user.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <AdminModal
      open
      onClose={onClose}
      title="Upgrade to Investor"
      subtitle={`Upgrading @${user.username}`}
      icon={<FaArrowUp />}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" form="upgrade-investor-form" loading={loading}>Upgrade User</Button>
        </>
      }
    >
      {fetchingOptions ? (
        <div className="py-20"><LoadingSpinner label="Loading resources…" /></div>
      ) : (
        <form id="upgrade-investor-form" onSubmit={handleSubmit} className="space-y-6">
          <FormSection title="Investor Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Display Name *</label>
                <input required name="display_name" value={formData.display_name} onChange={handleChange} className={FIELD_CLASS} placeholder="Angel Capital" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Investor Type</label>
                <select name="investor_type" value={formData.investor_type} onChange={handleChange} className={FIELD_CLASS}>
                  <option value="angel">Angel Investor</option>
                  <option value="vc">VC Firm</option>
                  <option value="fund">Investment Fund</option>
                  <option value="family_office">Family Office</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Location</label>
                <input name="location" value={formData.location} onChange={handleChange} className={FIELD_CLASS} placeholder="Singapore" />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>One Liner</label>
                <input name="one_liner" value={formData.one_liner} onChange={handleChange} className={FIELD_CLASS} placeholder="Investing in AI startups" />
              </div>
              <div className="md:col-span-2">
                <label className={LABEL_CLASS}>Investment Thesis</label>
                <textarea name="investment_thesis" value={formData.investment_thesis} onChange={handleChange} className={`${FIELD_CLASS} resize-none h-24`} placeholder="AI companies solving real-world problems…" />
              </div>
            </div>
          </FormSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableMultiSelect label="Focus Industries" options={industries} selectedIds={formData.focus_industries} onChange={(v) => setFormData((p) => ({ ...p, focus_industries: v }))} />
            <SearchableMultiSelect label="Preferred Stages" options={stages} selectedIds={formData.preferred_stages} onChange={(v) => setFormData((p) => ({ ...p, preferred_stages: v }))} />
          </div>

          <FormSection title="Check Size Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Check Size Min ($)</label>
                <input type="number" name="check_size_min" value={formData.check_size_min} onChange={handleChange} className={FIELD_CLASS} placeholder="50000" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Check Size Max ($)</label>
                <input type="number" name="check_size_max" value={formData.check_size_max} onChange={handleChange} className={FIELD_CLASS} placeholder="500000" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Links & Socials">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={LABEL_CLASS}>Website URL</label>
                <input type="url" name="website_url" value={formData.website_url} onChange={handleChange} className={FIELD_CLASS} placeholder="https://…" />
              </div>
              <div>
                <label className={LABEL_CLASS}>LinkedIn URL</label>
                <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} className={FIELD_CLASS} placeholder="https://linkedin.com/in/…" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Twitter URL</label>
                <input type="url" name="twitter_url" value={formData.twitter_url} onChange={handleChange} className={FIELD_CLASS} placeholder="https://twitter.com/…" />
              </div>
            </div>
          </FormSection>
        </form>
      )}
    </AdminModal>
  );
}
