import { useState, useEffect, useRef } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { FaSearch, FaCheck } from "react-icons/fa";
import { FiEdit, FiCheck as FiCheckIcon, FiX } from "react-icons/fi";
import useClickOutside from "../../components/hooks/useClickOutside";

import { useSelector } from "react-redux";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60";

export default function InvestorDetails({
  investorData,
  setInvestorData,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const { showAlert } = useAlert();

  const normalize = (data) => ({
    ...data,
    focus_industries: data?.focus_industries || [],
    preferred_stages: data?.preferred_stages || [],
  });

  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState(normalize(investorData));

  const [allIndustries, setAllIndustries] = useState([]);
  const [allStages, setAllStages] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [indRes, stageRes] = await Promise.all([
          axiosSecure.get("/v1/investors/industries/"),
          axiosSecure.get("/v1/investors/stages/")
        ]);
        setAllIndustries(indRes.data || []);
        setAllStages(stageRes.data || []);
      } catch (error) {
        console.error("Failed to fetch industries/stages", error);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (investorData) {
      setLocal(normalize(investorData));
    }
  }, [investorData]);

  const toggleItem = (list, item) =>
    list.find((i) => i.id === item.id)
      ? list.filter((i) => i.id !== item.id)
      : [...list, item];

  const investorTypes = [
    ["angel", "Angel Investor"],
    ["vc", "VC Firm"],
    ["family_office", "Family Office"],
    ["corporate", "Corporate VC"],
  ];

  const handleSave = async () => {
    try {
      const payload = {
        display_name: local.display_name,
        one_liner: local.one_liner,
        investment_thesis: local.investment_thesis,
        check_size_min: local.check_size_min,
        check_size_max: local.check_size_max,
        location: local.location,
        website_url: local.website_url,
        linkedin_url: local.linkedin_url,
        twitter_url: local.twitter_url,
        investor_type: local.investor_type,
        focus_industries: local.focus_industries.map((i) => i.id),
        preferred_stages: local.preferred_stages.map((s) => s.id),
      };

      const res = await axiosSecure.patch("/v1/investors/me/profile/", payload);

      setInvestorData(res.data);
      setLocal(normalize(res.data));
      setEditMode(false);

      showAlert("Investor profile updated!", "success");
    } catch (err) {
      console.error(err?.response?.data || err);
      showAlert("Failed to update investor profile", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Investor <span className="text-primary">Profile</span>
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
                    setLocal(normalize(investorData));
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
                  <FiCheckIcon size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 gap-4">

        <div className="md:col-span-2">
          <label className={labelClass}>Display Name</label>
          <input
            value={local.display_name || ""}
            disabled={!editMode}
            onChange={(e) => setLocal({ ...local, display_name: e.target.value })}
            className={fieldClass}
            placeholder="e.g. Acme Ventures"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>One Liner</label>
          <input
            value={local.one_liner || ""}
            disabled={!editMode}
            onChange={(e) => setLocal({ ...local, one_liner: e.target.value })}
            className={fieldClass}
            placeholder="Brief description..."
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Investment Thesis</label>
          <textarea
            rows={3}
            value={local.investment_thesis || ""}
            disabled={!editMode}
            onChange={(e) => setLocal({ ...local, investment_thesis: e.target.value })}
            className={`${fieldClass} resize-none`}
            placeholder="Detailed thesis..."
          />
        </div>

        {/* INDUSTRIES & STAGES */}
        <div className="space-y-5 md:col-span-2">
          <MultiSelect
            label="Focus Industries"
            items={allIndustries}
            selected={local.focus_industries}
            editMode={editMode}
            onToggle={(item) =>
              setLocal({
                ...local,
                focus_industries: toggleItem(local.focus_industries, item),
              })
            }
          />

          <MultiSelect
            label="Preferred Stages"
            items={allStages}
            selected={local.preferred_stages}
            editMode={editMode}
            onToggle={(item) =>
              setLocal({
                ...local,
                preferred_stages: toggleItem(local.preferred_stages, item),
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-5 md:col-span-2">
          <div>
            <label className={labelClass}>Min Check ($)</label>
            <input
              type="number"
              value={local.check_size_min || ""}
              onChange={(e) => setLocal({ ...local, check_size_min: e.target.value })}
              disabled={!editMode}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max Check ($)</label>
            <input
              type="number"
              value={local.check_size_max || ""}
              onChange={(e) => setLocal({ ...local, check_size_max: e.target.value })}
              disabled={!editMode}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            value={local.location || ""}
            onChange={(e) => setLocal({ ...local, location: e.target.value })}
            disabled={!editMode}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Investor Type</label>
          <select
            disabled={!editMode}
            value={local.investor_type || ""}
            onChange={(e) => setLocal({ ...local, investor_type: e.target.value })}
            className={fieldClass}
          >
            {investorTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Website</label>
            <input value={local.website_url || ""} onChange={(e) => setLocal({ ...local, website_url: e.target.value })} disabled={!editMode} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input value={local.linkedin_url || ""} onChange={(e) => setLocal({ ...local, linkedin_url: e.target.value })} disabled={!editMode} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Twitter</label>
            <input value={local.twitter_url || ""} onChange={(e) => setLocal({ ...local, twitter_url: e.target.value })} disabled={!editMode} className={fieldClass} />
          </div>
        </div>

      </div>
    </div>
  );
}

function MultiSelect({ label, items, selected, editMode, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const filteredOptions = items.filter((opt) =>
    opt.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <label className={labelClass}>{label}</label>

      {!editMode ? (
        <div className="mt-1 flex flex-wrap gap-2">
          {selected.length ? (
            selected.map((i) => (
              <span
                key={i.id}
                className="rounded-full bg-primary-soft px-3 py-1 text-2xs font-bold uppercase tracking-wide text-primary"
              >
                {i.name}
              </span>
            ))
          ) : (
            <span className="text-xs italic text-muted-foreground">Not specified</span>
          )}
        </div>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="truncate pr-4 font-medium">
              {selected.length > 0
                ? selected.map((opt) => opt.name).join(", ")
                : `Select ${label}`}
            </span>
            <span className="shrink-0 text-muted-foreground">&#9662;</span>
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-1 flex max-h-60 w-full flex-col rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border p-2">
                <div className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5">
                  <FaSearch className="text-xs text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full border-none bg-transparent px-1 text-sm text-foreground focus:outline-none"
                    placeholder={`Search ${label}...`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="custom-scrollbar flex-1 overflow-y-auto p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = selected.some((s) => s.id === opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm font-medium transition-colors ${isSelected
                          ? "bg-primary-soft text-primary"
                          : "text-foreground hover:bg-muted"
                          }`}
                        onClick={() => onToggle(opt)}
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border ${isSelected ? "border-primary bg-primary" : "border-input"
                            }`}
                        >
                          {isSelected && <FaCheck className="text-2xs text-primary-foreground" />}
                        </div>
                        {opt.name}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No matching {label.toLowerCase()} found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



