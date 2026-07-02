// src/profiles/expert/ExpertWizardSteps.jsx
import React from "react";

/**
 * Steps Component
 * Receives everything from ExpertWizard.jsx
 */

export default function Steps(props) {
  const {
    step,
    setStep,
    next,
    prev,
    goTo,

    profile,
    setProfile,
    profileMeta,
    isEditable,
    isVerified,
    applicationStatus,

    experiences,
    educations,
    certifications,
    honors,

    handleSaveProfile,
    setShowAddModal,
    setShowSubmitNoteModal,

    saving,
    submitting,

    isDark,
  } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      {/* LEFT SIDEBAR */}
      <div className={`${isDark ? "text-white" : "text-black"} md:col-span-1`}>
        <nav className="space-y-2 sticky top-28">
          <NavItem title="Basic Profile" stepNum={1} active={step === 1} onClick={() => goTo(1)} />
          <NavItem title="Credentials" stepNum={2} active={step === 2} onClick={() => goTo(2)} />
          <NavItem title="Review & Submit" stepNum={3} active={step === 3} onClick={() => goTo(3)} />
        </nav>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="md:col-span-3">
        {step === 1 && (
          <Step1
            profile={profile}
            setProfile={setProfile}
            isEditable={isEditable}
            isDark={isDark}
            saving={saving}
            next={next}
            handleSaveProfile={handleSaveProfile}
          />
        )}

        {step === 2 && (
          <Step2
            isDark={isDark}
            experiences={experiences}
            educations={educations}
            certifications={certifications}
            honors={honors}
            isEditable={isEditable}
            prev={prev}
            next={next}
            setShowAddModal={setShowAddModal}
          />
        )}

        {step === 3 && (
          <Step3
            profile={profile}
            experiences={experiences}
            educations={educations}
            certifications={certifications}
            honors={honors}
            isEditable={isEditable}
            isDark={isDark}
            saving={saving}
            submitting={submitting}
            prev={prev}
            handleSaveProfile={handleSaveProfile}
            setShowSubmitNoteModal={setShowSubmitNoteModal}
            applicationStatus={applicationStatus}
            isVerified={isVerified}
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
          : `${isDark ? "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10" : "bg-neutral-50 border-neutral-100 text-neutral-500 hover:bg-neutral-100"}`
        }`}
    >
      <div className="font-bold text-sm uppercase tracking-wider">{title}</div>
      <div className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mt-1">Step {stepNum}</div>
    </button>
  );
}

/* ----------------------------------------------
   STEP 1 — BASIC PROFILE
---------------------------------------------- */
function Step1({ profile, setProfile, isEditable, isDark, saving, next, handleSaveProfile }) {
  return (
    <div className={`p-6 rounded-xl shadow mb-6 min-h-[70vh] ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <h2 className="text-xl font-semibold mb-4">Basic Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name" value={profile.first_name} disabled={!isEditable} maxLength={20}
          onChange={(v) => setProfile((p) => ({ ...p, first_name: v }))} />

        <Input label="Last Name" value={profile.last_name} disabled={!isEditable} maxLength={20}
          onChange={(v) => setProfile((p) => ({ ...p, last_name: v }))} />

        <Input label="Headline" value={profile.headline} disabled={!isEditable} className="md:col-span-2"
          placeholder="e.g. PHD IN DEEP LEARNING"
          onChange={(v) => setProfile((p) => ({ ...p, headline: v }))} />

        <Input label="Primary Expertise" value={profile.primary_expertise} disabled={!isEditable} className="md:col-span-2"
          placeholder="e.g. Deep Learning"
          onChange={(v) => setProfile((p) => ({ ...p, primary_expertise: v }))} />

        <Input label="Other Expertise" value={profile.other_expertise} disabled={!isEditable} className="md:col-span-2"
          onChange={(v) => setProfile((p) => ({ ...p, other_expertise: v }))} />

        {/* Availability */}
        <div className="md:col-span-2">
          <label className="text-sm opacity-80 block mb-1">Availability</label>
          <label className={`px-3 py-1 rounded-md border ${profile.is_available ? "bg-green-50" : ""}`}>
            <input
              type="checkbox"
              checked={profile.is_available}
              disabled={!isEditable}
              onChange={(e) => setProfile((p) => ({ ...p, is_available: e.target.checked }))}
            />{" "}
            <span className="ml-2 text-sm">Available for hire</span>
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
        <button
          onClick={handleSaveProfile}
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
   STEP 2 — CREDENTIALS (SCROLL FIXED)
---------------------------------------------- */
function Step2({
  isDark,
  experiences,
  educations,
  certifications,
  honors,
  isEditable,
  saving,
  handleSaveProfile,
  prev,
  next,
  setShowAddModal,
}) {
  return (
    <div
      className={`p-6 rounded-xl shadow mb-6 min-h-[75vh] ${isDark ? "bg-neutral-900" : "bg-white"
        }`}
    >
      <h2 className="text-xl font-semibold mb-4">Credentials</h2>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CredentialCard
          title="Experience"
          items={experiences}
          onAdd={() => isEditable && setShowAddModal("experience")}
          renderItem={(it) => (
            <div>
              <div className="font-semibold">
                {it.job_title} @ {it.company}
              </div>
              <div className="text-sm opacity-70">
                {it.start_date} — {it.end_date || "Present"}
              </div>
            </div>
          )}
        />

        <CredentialCard
          title="Education"
          items={educations}
          onAdd={() => isEditable && setShowAddModal("education")}
          renderItem={(it) => (
            <div>
              <div className="font-semibold">
                {it.school} — {it.degree}
              </div>
              <div className="text-sm opacity-70">
                {it.start_year} — {it.end_year}
              </div>
            </div>
          )}
        />

        <CredentialCard
          title="Certifications"
          items={certifications}
          onAdd={() => isEditable && setShowAddModal("cert")}
          renderItem={(it) => (
            <div>
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm opacity-70">
                {it.issuing_organization} • {it.issue_date}
              </div>
            </div>
          )}
        />

        <CredentialCard
          title="Honors & Awards"
          items={honors}
          onAdd={() => isEditable && setShowAddModal("honor")}
          renderItem={(it) => (
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-sm opacity-70">
                {it.issuer} • {it.issue_date}
              </div>
            </div>
          )}
        />
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
          onClick={handleSaveProfile}
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
          Review Application
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------
   STEP 3 — REVIEW & SUBMIT
---------------------------------------------- */
function Step3({
  profile,
  experiences,
  educations,
  certifications,
  honors,
  isEditable,
  isDark,
  saving,
  submitting,
  prev,
  handleSaveProfile,
  setShowSubmitNoteModal,
  applicationStatus,
  isVerified,
}) {
  /* Submit button logic — OPTION A */
  const submitDisabled =
    submitting || applicationStatus === "pending" || applicationStatus === "approved";

  return (
    <div className={`p-6 rounded-xl shadow mb-6 min-h-[70vh] ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>

      {isVerified && <div className="mb-2 text-green-500 font-semibold">✓ Verified Expert</div>}

      <div className="space-y-4">
        <ReviewRow label="Name" value={`${profile.first_name} ${profile.last_name}`} />
        <ReviewRow label="Headline" value={profile.headline} />
        <ReviewRow label="Primary Expertise" value={profile.primary_expertise} />

        <ReviewList label="Experience" items={experiences} emptyText="No experiences added" />
        <ReviewList label="Education" items={educations} emptyText="No education added" />
        <ReviewList label="Certifications" items={certifications} emptyText="No certifications added" />
        <ReviewList label="Honors & Awards" items={honors} emptyText="No honors added" />
      </div>

      {/* Bottom Buttons */}
      <div className="mt-8 flex items-center gap-4 border-t border-white/5 pt-6">
        <button
          onClick={prev}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"
            }`}
        >
          Back
        </button>

        {/* Save Draft */}
        <button
          onClick={handleSaveProfile}
          disabled={saving || !isEditable}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isEditable
              ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
              : "bg-neutral-50 dark:bg-neutral-900 border border-white/5 text-neutral-500 cursor-not-allowed"
            }`}
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>

        {/* Submit for Review */}
        <button
          onClick={() => setShowSubmitNoteModal(true)}
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
function Input({ label, value, onChange, type = "text", placeholder = "", disabled = false, isDark, maxLength, className }) {
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
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(!disabled)}
        maxLength={maxLength}
      />
    </div>
  );
}

function CredentialCard({ title, items, onAdd, renderItem, isDark }) {
  return (
    <div className={`p-6 rounded-3xl border transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-neutral-50 border-neutral-100"}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest opacity-60">{title}</h3>
        <button
          onClick={onAdd}
          className={`px-4 py-1.5 rounded-xl text-2xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white" : "bg-red-600 text-white hover:bg-red-700"
            }`}
        >
          Add New
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm opacity-70">No {title.toLowerCase()} added.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className={`p-4 rounded-2xl border transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5"}`}>
              {renderItem(it)}
            </div>
          ))}
        </div>
      )}
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

function ReviewList({ label, items, emptyText }) {
  return (
    <div>
      <div className="w-full text-sm opacity-70 mb-2">{label}</div>
      {items.length === 0 ? (
        <div className="text-sm opacity-70">{emptyText}</div>
      ) : (
        <ul className="list-disc pl-6">
          {items.map((it) => (
            <li key={it.id} className="text-sm">
              {Object.values(it).slice(0, 2).join(" • ")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
