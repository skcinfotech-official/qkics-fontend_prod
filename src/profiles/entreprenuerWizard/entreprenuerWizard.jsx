// src/profiles/entrepreneurWizard/EntrepreneurWizard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";

import Steps from "./EntrepreneurWizardSteps";

/**
 * EntrepreneurWizard
 * - Top-level state & API handling
 * - Banner / submit modal / step state
 * - Passes everything to Steps component
 */
export default function EntrepreneurWizard({ theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const { showAlert } = useAlert();

  /* ---------------------- STATE ---------------------- */
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const goTo = (s) => setStep(s);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  const [profileMeta, setProfileMeta] = useState(null);
  const [form, setForm] = useState({
    startup_name: "",
    one_liner: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    funding_stage: "",
  });

  /* NOTE SUBMIT MODAL */
  const [showSubmitNoteModal, setShowSubmitNoteModal] = useState(false);

  /* ---------------------- DERIVED FLAGS ---------------------- */
  const applicationStatus = profileMeta?.application_status || "draft";
  const isVerified = profileMeta?.verified_by_admin === true;

  // Same logic as Expert: pending profiles are editable but cannot be resubmitted
  const isEditable =
    applicationStatus === "draft" ||
    applicationStatus === "rejected" ||
    applicationStatus === "pending"; // pending editable

  const canSubmit = applicationStatus === "draft" || applicationStatus === "rejected";

  /* ---------------------- BANNER ---------------------- */
  const banner = (() => {
    if (!profileMeta) return null;
    const note = profileMeta.admin_review_note || "";

    if (applicationStatus === "approved" && isVerified) {
      return {
        tone: "success",
        text:
          "🎉 Your entrepreneur profile is approved! Logout and login again to activate entrepreneur features.",
      };
    }

    if (applicationStatus === "pending") {
      return {
        tone: "info",
        text:
          "⏳ Your application is under review. You can edit the profile, but you cannot resubmit until admin responds.",
      };
    }

    if (applicationStatus === "rejected") {
      return {
        tone: "error",
        text: `❌ Your application was rejected. ${note ? "Admin note: " + note : ""}`,
      };
    }

    return null;
  })();

  /* ---------------------- LOAD EXISTING PROFILE ---------------------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await axiosSecure.get("/v1/entrepreneurs/me/profile/");
        if (!mounted) return;
        const data = res.data;
        setProfileMeta(data);
        setForm({
          startup_name: data.startup_name || "",
          one_liner: data.one_liner || "",
          description: data.description || "",
          website: data.website || "",
          industry: data.industry || "",
          location: data.location || "",
          funding_stage: data.funding_stage || "",
        });
      } catch (err) {
        console.debug("No entrepreneur draft found or fetch error:", err?.response?.data || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, []);

  /* ---------------------- VALIDATION ---------------------- */
  const validate = () => {
    const errors = [];
    if (!form.startup_name?.trim()) errors.push("Startup name is required");
    if (!form.one_liner?.trim()) errors.push("One liner is required");
    if (!form.description?.trim()) errors.push("Description is required");
    if (!form.industry?.trim()) errors.push("Industry is required");
    if (!form.location?.trim()) errors.push("Location is required");
    if (!form.funding_stage?.trim()) errors.push("Funding stage is required");
    return errors;
  };

  /* ---------------------- SAVE DRAFT ---------------------- */
  const handleSaveDraft = async () => {
    if (!isEditable) {
      showAlert("You cannot edit this profile right now.", "error");
      return;
    }

    const errors = validate();
    if (errors.length) {
      showAlert(errors.join(". "), "error");
      return;
    }

    setSaving(true);
    try {
      let res;
      if (profileMeta?.id) {
        res = await axiosSecure.patch("/v1/entrepreneurs/me/profile/", form);
      } else {
        res = await axiosSecure.post("/v1/entrepreneurs/me/profile/", form);
      }

      setProfileMeta(res.data);
      showAlert("Draft saved successfully!", "success");
    } catch (err) {
      console.error("Save draft error:", err);
      showAlert("Failed to save draft.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------- SUBMIT FOR REVIEW ---------------------- */
  const handleSubmitForReview = async (note = "") => {
    if (!profileMeta?.id) {
      showAlert("Please save a draft before submitting.", "error");
      setShowSubmitNoteModal(false);
      return;
    }

    const errors = validate();
    if (errors.length) {
      showAlert(errors.join(". "), "error");
      setShowSubmitNoteModal(false);
      return;
    }

    setSubmitting(true);
    try {
      await axiosSecure.post("/v1/entrepreneurs/me/submit/", { note });

      setProfileMeta((p) => ({
        ...p,
        application_status: "pending",
        admin_review_note: note,
      }));

      showAlert("Application submitted!", "success");
      setShowSubmitNoteModal(false);
      setStep(3);
    } catch (err) {
      console.error("Submit failed:", err);
      showAlert("Submission failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------- START OVER ---------------------- */
  const handleStartOver = () => {
    setStep(1);
  };

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-[#f5f5f5]"} pb-16`}>
      <div className="max-w-5xl mx-auto px-4 pt-12">
        {/* HEADER */}
        <div className={`p-6 rounded-xl shadow mb-6 ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"}`}>
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold">Entrepreneur Setup Wizard</h1>
              <p className="text-sm opacity-70 mt-1">Build your startup profile, save, and submit for verification.</p>
            </div>

            <div className="ml-auto text-right">
              <div className="text-sm opacity-80">Step {step} of 3</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-md border">Back</button>
                <button onClick={handleStartOver} className="px-3 py-1 rounded-md border">Start Over</button>
              </div>
            </div>
          </div>
        </div>

        {/* BANNER */}
        {banner && !hideBanner && (
          <div className="mb-6 relative">
            <div
              className={`p-3 rounded-md pr-10 ${banner.tone === "info"
                ? "bg-blue-50 text-blue-800"
                : banner.tone === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
                }`}
            >
              {banner.text}
              <button
                onClick={() => setHideBanner(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* STEPS */}
        <Steps
          step={step}
          setStep={setStep}
          next={next}
          prev={prev}
          goTo={goTo}
          form={form}
          setForm={setForm}
          profileMeta={profileMeta}
          isEditable={isEditable}
          isVerified={isVerified}
          applicationStatus={applicationStatus}
          loading={loading}
          saving={saving}
          submitting={submitting}
          isDark={isDark}
          handleSaveDraft={handleSaveDraft}
          openSubmitModal={() => setShowSubmitNoteModal(true)}
          canSubmit={canSubmit}
        />

        {/* SUBMIT NOTE MODAL */}
        {showSubmitNoteModal && (
          <ModalOverlay isDark={isDark} onClose={() => setShowSubmitNoteModal(false)}>
            <SubmitNoteModal
              onClose={() => setShowSubmitNoteModal(false)}
              onSubmit={handleSubmitForReview}
              isDark={isDark}
            />
          </ModalOverlay>
        )}
      </div>
    </div>
  );
}

/* ---------------- Modal Components ---------------- */
function ModalOverlay({ children, isDark, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${isDark ? "bg-neutral-900 border border-white/10 text-white" : "bg-white text-black"}
          rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-2xl p-8 md:p-12 overflow-y-auto max-h-[90vh]`}
      >
        {children}
      </div>
    </div>
  );
}

function SubmitNoteModal({ onClose, onSubmit, isDark }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await onSubmit(note);
      onClose();
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Submit Application for Verification</h2>

      <div className="mb-4">
        <label className="text-2xs font-black uppercase tracking-[0.2em] opacity-40 mb-1 block">
          Admin Review Note (optional)
        </label>
        <textarea
          className={`w-full mt-2 px-3 py-2 rounded-xl border-2 outline-none transition-all font-medium resize-none ${isDark ? "bg-white/5 border-white/10 text-white focus:border-red-600" : "bg-neutral-50 border-black/10 text-black focus:border-red-600"
            }`}
          rows={4}
          placeholder="Write any important information for the admin..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={submit}
          disabled={sending}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20"
        >
          {sending ? "Submitting..." : "Submit Application"}
        </button>

        <button
          onClick={onClose}
          className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"
            }`}
        >
          Cancel
        </button>
      </div>
    </>
  );
}
