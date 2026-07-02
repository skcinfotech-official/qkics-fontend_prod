// src/profiles/basicDetails/userDetails.jsx

import { useSelector } from "react-redux";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60";

export default function UserDetails({
  editMode,
  setEditMode,
  editData,
  setEditData,
  handleSave,
}) {
  const { data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const user = activeProfile?.profile?.user || activeProfile?.profile || {};
  const isOwnProfile =
    loggedUser?.username === (user.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;
  const reduxUser = loggedUser;

  const resetEdit = () =>
    setEditData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: reduxUser?.phone || user.phone || "",
    });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Personal <span className="text-primary">Information</span>
        </h2>

        {!readOnly && (
          <div className="flex gap-2">
            {!editMode ? (
              <button
                onClick={() => {
                  resetEdit();
                  setEditMode(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                title="Edit details"
              >
                <FiEdit size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    resetEdit();
                    setEditMode(false);
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

      {/* FORM GRID */}
      <div className="grid grid-cols-1 gap-4">

        <div>
          <label className={labelClass}>First Name</label>
          <input
            value={editMode ? editData.first_name : user.first_name || ""}
            disabled={readOnly || !editMode}
            onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
            className={fieldClass}
            maxLength={20}
          />
        </div>

        <div>
          <label className={labelClass}>Last Name</label>
          <input
            value={editMode ? editData.last_name : user.last_name || ""}
            disabled={readOnly || !editMode}
            onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
            className={fieldClass}
            maxLength={20}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Email Address</label>
          <input
            value={
              isOwnProfile
                ? user.email || reduxUser?.email || ""
                : user.email || "Private"
            }
            disabled
            className={fieldClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Phone Number</label>
          <input
            value={
              editMode
                ? editData.phone || ""
                : isOwnProfile
                  ? user.phone || reduxUser?.phone || ""
                  : user.phone || "Not Shared"
            }
            disabled={!editMode}
            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            className={fieldClass}
            placeholder={editMode ? "Enter phone number" : ""}
          />
        </div>

      </div>
    </div>
  );
}
