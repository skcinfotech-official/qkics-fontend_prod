// src/profiles/entrepreneur/entrepreneurDetails.jsx

import { useState, useEffect } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";

import { useSelector } from "react-redux";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60";

export default function EntrepreneurDetails({
  entreData,
  setEntreData,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const { showAlert } = useAlert();

  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState({ ...entreData });

  useEffect(() => {
    if (entreData) {
      setLocal({ ...entreData });
    }
  }, [entreData]);

  const fundingOptions = [
    ["pre_seed", "Pre-Seed"],
    ["seed", "Seed"],
    ["series_a", "Series A"],
    ["series_b", "Series B+"],
    ["bootstrapped", "Bootstrapped"],
  ];

  const handleSave = async () => {
    try {
      const payload = {
        startup_name: local.startup_name,
        one_liner: local.one_liner,
        website: local.website,
        description: local.description,
        industry: local.industry,
        location: local.location,
        funding_stage: local.funding_stage,
      };

      const res = await axiosSecure.patch("/v1/entrepreneurs/me/profile/", payload);

      setEntreData(res.data);
      setLocal(res.data);
      setEditMode(false);

      showAlert("Entrepreneur profile updated!", "success");
    } catch (err) {
      console.error(err?.response?.data || err);
      showAlert("Failed to update!", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Startup <span className="text-primary">Details</span>
        </h2>

        {!readOnly && (
          <div className="flex gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                title="Edit details"
              >
                <FiEdit size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setLocal({ ...entreData });
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all hover:bg-danger hover:text-white"
                  title="Cancel"
                >
                  <FiX size={17} />
                </button>
                <button
                  onClick={handleSave}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary-hover"
                  title="Save changes"
                >
                  <FiCheck size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-4">

        <div className="md:col-span-2">
          <label className={labelClass}>Startup Name</label>
          <input
            value={local.startup_name || ""}
            onChange={(v) => setLocal({ ...local, startup_name: v.target.value })}
            disabled={!editMode}
            className={fieldClass}
            placeholder="Startup Name"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>One Liner</label>
          <input
            value={local.one_liner || ""}
            onChange={(v) => setLocal({ ...local, one_liner: v.target.value })}
            disabled={!editMode}
            className={fieldClass}
            placeholder="What do you do?"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            rows={4}
            value={local.description || ""}
            onChange={(v) => setLocal({ ...local, description: v.target.value })}
            disabled={!editMode}
            className={`${fieldClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Industry</label>
          <input
            value={local.industry || ""}
            onChange={(v) => setLocal({ ...local, industry: v.target.value })}
            disabled={!editMode}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            value={local.location || ""}
            onChange={(v) => setLocal({ ...local, location: v.target.value })}
            disabled={!editMode}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Funding Stage</label>
          <select
            disabled={!editMode}
            value={local.funding_stage || ""}
            onChange={(e) => setLocal({ ...local, funding_stage: e.target.value })}
            className={fieldClass}
          >
            {fundingOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Website</label>
          <input
            value={local.website || ""}
            onChange={(v) => setLocal({ ...local, website: v.target.value })}
            disabled={!editMode}
            className={fieldClass}
          />
        </div>

      </div>
    </div>
  );
}
