// src/profiles/entrepreneurWizard/EntrepreneurWizardSteps.jsx
import React from "react";

export default function Steps(props) {
  const {
    step,
    setStep,
    next,
    prev,
    goTo,
    form,
    setForm,
    profileMeta,
    isEditable,
    isVerified,
    applicationStatus,
    loading,
    saving,
    submitting,
    isDark,
    handleSaveDraft,
    openSubmitModal,
    canSubmit,
  } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Left Nav */}
      <div className={`${isDark ? "text-white" : "text-black"} md:col-span-1`}>
        <nav className="space-y-2 sticky top-28">
          <NavItem
            title="Startup Basics"
            stepNum={1}
            active={step === 1}
            onClick={() => goTo(1)}
            isDark={isDark}
          />
          <NavItem
            title="Business Details"
            stepNum={2}
            active={step === 2}
            onClick={() => goTo(2)}
            isDark={isDark}
          />
          <NavItem
            title="Review & Submit"
            stepNum={3}
            active={step === 3}
            onClick={() => goTo(3)}
            isDark={isDark}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:col-span-3">
        {step === 1 && (
          <Step1
            form={form}
            setForm={setForm}
            isEditable={isEditable}
            saving={saving}
            next={next}
            handleSaveDraft={handleSaveDraft}
            isDark={isDark}
          />
        )}

        {step === 2 && (
          <Step2
            form={form}
            setForm={setForm}
            isEditable={isEditable}
            saving={saving}
            prev={prev}
            next={next}
            handleSaveDraft={handleSaveDraft}
            isDark={isDark}
          />
        )}

        {step === 3 && (
          <Step3
            form={form}
            isEditable={isEditable}
            submitting={submitting}
            prev={prev}
            openSubmitModal={openSubmitModal}
            handleSaveDraft={handleSaveDraft}
            isDark={isDark}
            applicationStatus={applicationStatus}
            isVerified={isVerified}
            canSubmit={canSubmit}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------
   NAV ITEM
---------------------------------------------- */
function NavItem({ title, stepNum, active, onClick, isDark }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${active
          ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
          : `${isDark
            ? "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10"
            : "bg-neutral-50 border-neutral-100 text-neutral-500 hover:bg-neutral-100"
          }`
        }`}
    >
      <div className="font-bold text-sm uppercase tracking-wider">{title}</div>
      <div className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mt-1">
        Step {stepNum}
      </div>
    </button>
  );
}

/* ----------------------------------------------
   STEP 1 — STARTUP BASICS
---------------------------------------------- */
function Step1({ form, setForm, isEditable, saving, next, handleSaveDraft, isDark }) {
  return (
    <div className={`p-6 rounded-xl shadow mb-6 min-h-[70vh] ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <h2 className="text-xl font-semibold mb-4">Startup Basics</h2>

      <div className="space-y-6">
        <Input
          label="Startup Name"
          value={form.startup_name}
          onChange={(v) => setForm((p) => ({ ...p, startup_name: v }))}
          disabled={!isEditable}
          isDark={isDark}
        />
        <Input
          label="One Liner"
          value={form.one_liner}
          onChange={(v) => setForm((p) => ({ ...p, one_liner: v }))}
          disabled={!isEditable}
          isDark={isDark}
        />
        <Input
          label="Website"
          value={form.website}
          onChange={(v) => setForm((p) => ({ ...p, website: v }))}
          disabled={!isEditable}
          isDark={isDark}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(v) => setForm((p) => ({ ...p, description: v }))}
          disabled={!isEditable}
          isDark={isDark}
        />
      </div>

      {/* Buttons */}
      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
        <button
          onClick={handleSaveDraft}
          disabled={saving || !isEditable}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isEditable
              ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              : "bg-neutral-50 dark:bg-neutral-900 border border-white/5 text-neutral-500 cursor-not-allowed"
            }`}
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={next}
          className="px-8 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------
   STEP 2 — BUSINESS DETAILS
---------------------------------------------- */
function Step2({ form, setForm, isEditable, saving, prev, next, handleSaveDraft, isDark }) {
  return (
    <div className={`p-6 rounded-xl shadow mb-6 min-h-[70vh] ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <h2 className="text-xl font-semibold mb-4">Business Details</h2>

      <div className="space-y-6">
        <Input
          label="Industry"
          value={form.industry}
          onChange={(v) => setForm((p) => ({ ...p, industry: v }))}
          disabled={!isEditable}
          isDark={isDark}
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(v) => setForm((p) => ({ ...p, location: v }))}
          disabled={!isEditable}
          isDark={isDark}
        />

        <div>
          <label className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-2 block">
            Funding Stage
          </label>
          <select
            disabled={!isEditable}
            value={form.funding_stage}
            onChange={(e) => setForm((p) => ({ ...p, funding_stage: e.target.value }))}
            className={`w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium ${isDark
                ? isEditable
                  ? "border-red-600 text-white"
                  : "border-white/10 text-white/50"
                : isEditable
                  ? "border-red-600 text-black"
                  : "border-black/10 text-black/50"
              }`}
          >
            <option value="" className={isDark ? "bg-neutral-900" : "bg-white"}>
              Select Funding Stage
            </option>
            <option value="pre_seed" className={isDark ? "bg-neutral-900" : "bg-white"}>
              Pre-Seed
            </option>
            <option value="seed" className={isDark ? "bg-neutral-900" : "bg-white"}>
              Seed
            </option>
            <option value="series_a" className={isDark ? "bg-neutral-900" : "bg-white"}>
              Series A
            </option>
            <option value="series_b" className={isDark ? "bg-neutral-900" : "bg-white"}>
              Series B+
            </option>
            <option value="bootstrapped" className={isDark ? "bg-neutral-900" : "bg-white"}>
              Bootstrapped
            </option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
        <button
          onClick={prev}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"
            }`}
        >
          Back
        </button>

        <button
          onClick={handleSaveDraft}
          disabled={saving || !isEditable}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isEditable
              ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              : "bg-neutral-50 dark:bg-neutral-900 border border-white/5 text-neutral-500 cursor-not-allowed"
            }`}
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={next}
          className="px-8 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------
   STEP 3 — REVIEW & SUBMIT
---------------------------------------------- */
function Step3({
  form,
  isEditable,
  submitting,
  prev,
  openSubmitModal,
  handleSaveDraft,
  isDark,
  applicationStatus,
  isVerified,
  canSubmit,
  saving,
}) {
  const submitDisabled =
    submitting || applicationStatus === "pending" || applicationStatus === "approved";

  return (
    <div className={`p-6 rounded-xl shadow mb-6 min-h-[70vh] ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>

      {isVerified && <div className="mb-4 text-green-500 font-semibold">✓ Verified Entrepreneur</div>}

      <div className="space-y-4">
        <ReviewRow label="Startup Name" value={form.startup_name} />
        <ReviewRow label="One Liner" value={form.one_liner} />
        <ReviewRow label="Website" value={form.website} />
        <ReviewRow label="Industry" value={form.industry} />
        <ReviewRow label="Location" value={form.location} />
        <ReviewRow label="Funding Stage" value={form.funding_stage} />
        <ReviewRow label="Description" value={form.description} />
      </div>

      {/* Buttons */}
      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
        <button
          onClick={prev}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"
            }`}
        >
          Back
        </button>

        <button
          onClick={handleSaveDraft}
          disabled={saving || !isEditable}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isEditable
              ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              : "bg-neutral-50 dark:bg-neutral-900 border border-white/5 text-neutral-500 cursor-not-allowed"
            }`}
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={openSubmitModal}
          disabled={submitDisabled}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${applicationStatus === "approved"
              ? "bg-green-600 text-white cursor-not-allowed"
              : applicationStatus === "pending"
                ? "bg-neutral-700 text-white/50 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-red-600/20"
            }`}
        >
          {applicationStatus === "approved"
            ? "Verified"
            : applicationStatus === "pending"
              ? "Pending Review"
              : submitting
                ? "Submitting..."
                : "Finalize & Submit"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------
   SMALL COMPONENTS
---------------------------------------------- */
function Input({ label, value, onChange, type = "text", placeholder = "", disabled = false, isDark }) {
  const inputClass = (enabled) =>
    `w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium ${isDark
      ? enabled
        ? "border-red-600 text-white placeholder-white/30"
        : "border-white/10 text-white/50"
      : enabled
        ? "border-red-600 text-black placeholder-black/30"
        : "border-black/10 text-black/50"
    }`;

  const labelClass = "text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-1 block";

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(!disabled)}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, disabled, isDark }) {
  const inputClass = (enabled) =>
    `w-full bg-transparent border-b-2 py-2 px-1 outline-none transition-all font-medium min-h-[100px] ${isDark
      ? enabled
        ? "border-red-600 text-white placeholder-white/30"
        : "border-white/10 text-white/50"
      : enabled
        ? "border-red-600 text-black placeholder-black/30"
        : "border-black/10 text-black/50"
    }`;

  const labelClass = "text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-1 block";

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        value={value}
        placeholder={""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(!disabled)}
      />
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-40 text-sm opacity-70">{label}</div>
      <div className="flex-1">{value || "-"}</div>
    </div>
  );
}

