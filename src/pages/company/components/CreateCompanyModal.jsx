import { FaBuilding } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import useModalEscape from "../../../components/hooks/useModalEscape";
import { Button } from "../../../components/ui";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

export default function CreateCompanyModal({
  closeModal,
  formData,
  handleInputChange,
  handleFileChange,
  handleSubmit,
  logoPreview,
  coverPreview,
  loading,
}) {
  useModalEscape(closeModal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FiX size={20} />
        </button>

        <div className="mb-5 pr-10">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Create Company Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Set up your company details to connect with others.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Uploads */}
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Logo Upload */}
            <div className="flex-1">
              <label className={labelClass}>Company Logo</label>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                  ) : (
                    <FaBuilding size={20} className="text-muted-foreground" />
                  )}
                </div>
                <label className="cursor-pointer rounded-lg bg-primary-soft px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
                </label>
              </div>
            </div>

            {/* Cover Upload */}
            <div className="flex-1">
              <label className={labelClass}>Cover Image</label>
              <div className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">Add Cover</span>
                )}
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-2xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Upload Cover
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "cover")} />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className={fieldClass} placeholder="Enter company name" />
            </div>
            <div>
              <label className={labelClass}>Industry *</label>
              <input type="text" name="industry" required value={formData.industry} onChange={handleInputChange} className={fieldClass} placeholder="e.g. Technology" />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} className={fieldClass} placeholder="City, Country" />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input type="url" name="website" value={formData.website} onChange={handleInputChange} className={fieldClass} placeholder="https://example.com" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea name="description" required rows="3" value={formData.description} onChange={handleInputChange} className={`${fieldClass} resize-none`} placeholder="Tell us about your company..." />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Profile</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
