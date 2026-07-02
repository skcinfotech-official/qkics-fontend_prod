import { useSelector } from "react-redux";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60";

export default function ExpertDetails({
  expertData,
  setExpertData,
  editExp,
  setEditExp,
  handleSaveExpert,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Expert <span className="text-primary">Profile</span>
        </h2>

        {!readOnly && (
          <div className="flex gap-2">
            {!editExp ? (
              <button
                onClick={() => setEditExp(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                title="Edit details"
              >
                <FiEdit size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditExp(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all hover:bg-danger hover:text-white"
                  title="Cancel"
                >
                  <FiX size={17} />
                </button>
                <button
                  onClick={handleSaveExpert}
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

      {/* FORM GRID */}
      <div className="grid grid-cols-1 gap-5">

        <div>
          <label className={labelClass}>Professional Headline</label>
          <input
            value={expertData.headline || ""}
            disabled={!editExp}
            placeholder="e.g. Senior Investment Consultant"
            onChange={(e) => setExpertData({ ...expertData, headline: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Primary Expertise</label>
            <input
              value={expertData.primary_expertise || ""}
              disabled={!editExp}
              placeholder="e.g. Finance"
              onChange={(e) => setExpertData({ ...expertData, primary_expertise: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Hourly Rate (₹)</label>
            <input
              type="number"
              value={expertData.hourly_rate || ""}
              disabled={!editExp}
              placeholder="e.g. 1500"
              onChange={(e) => setExpertData({ ...expertData, hourly_rate: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Other Expertise</label>
          <input
            value={expertData.other_expertise || ""}
            disabled={!editExp}
            placeholder="e.g. Marketing, Strategy"
            onChange={(e) => setExpertData({ ...expertData, other_expertise: e.target.value })}
            className={fieldClass}
          />
          <p className="mt-1.5 text-2xs text-muted-foreground">Separate skills with commas.</p>
        </div>

      </div>
    </div>
  );
}
