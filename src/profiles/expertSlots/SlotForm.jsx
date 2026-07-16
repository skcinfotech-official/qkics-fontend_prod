import { useEffect, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";
import { FiX, FiUser, FiUsers, FiClock } from "react-icons/fi";
import { Button } from "../../components/ui";
import { cn } from "../../components/ui/cn";

const MAX_BATCH_CAPACITY = 10;

const labelClass =
  "mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:bg-card focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export default function SlotForm({
  initialData,
  onSave,
  onCancel,
}) {
  const isEdit = Boolean(initialData);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [slotMode, setSlotMode] = useState("ONE_TO_ONE"); // ONE_TO_ONE | BATCH
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [duration, setDuration] = useState(0);
  const [chatPrice, setChatPrice] = useState("");
  const [videoCallPrice, setVideoCallPrice] = useState("");
  const [capacity, setCapacity] = useState(2);
  const [batchPrice, setBatchPrice] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);

  const isBatch = slotMode === "BATCH";

  // Helper: Convert Date or ISO string to local YYYY-MM-DDTHH:mm
  const toLocalString = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  /* ----------------------------
      PREFILL (EDIT MODE)
  ----------------------------- */
  useEffect(() => {
    if (!initialData) return;

    setSlotMode(initialData.slot_mode || "ONE_TO_ONE");
    setStart(toLocalString(initialData.start_datetime));
    setEnd(toLocalString(initialData.end_datetime));
    setDuration(initialData.duration_minutes || 0);
    setChatPrice(initialData.chat_price || "");
    setVideoCallPrice(initialData.video_call_price || "");
    setCapacity(initialData.capacity && initialData.capacity >= 2 ? initialData.capacity : 2);
    setBatchPrice(initialData.batch_price && Number(initialData.batch_price) > 0 ? initialData.batch_price : "");
    setRequiresApproval(initialData.requires_approval);
  }, [initialData]);

  // Recalculate duration when times change
  useEffect(() => {
    if (!start || !end) {
      setDuration(0);
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (endDate > startDate) {
        const diffMinutes = (endDate - startDate) / (1000 * 60);
        setDuration(Math.round(diffMinutes));
      } else {
        setDuration(0);
      }
    }
  }, [start, end]);

  /* ----------------------------
      SUBMIT
  ----------------------------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!start || !end) {
      showAlert("Start and end times are required", "error");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      showAlert("End time must be after start time", "error");
      return;
    }

    let payload;
    let confirmBody;

    if (isBatch) {
      const capacityVal = Number(capacity) || 0;
      const batchPriceVal = Number(batchPrice) || 0;

      if (capacityVal < 2 || capacityVal > MAX_BATCH_CAPACITY) {
        showAlert(`Group capacity must be between 2 and ${MAX_BATCH_CAPACITY}`, "error");
        return;
      }
      if (batchPriceVal <= 0) {
        showAlert("Per-user price must be greater than 0", "error");
        return;
      }

      payload = {
        slot_mode: "BATCH",
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        duration_minutes: Number(duration),
        capacity: capacityVal,
        batch_price: batchPriceVal,
      };

      confirmBody = (
        <div className="space-y-2">
          <p>Please confirm the group session details:</p>
          <div className="space-y-1 rounded-xl bg-muted p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-bold text-primary">Group Video Call</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Participants:</span>
              <span className="font-bold text-foreground">{capacityVal} users</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price (per user):</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{batchPriceVal}</span>
            </div>
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Up to {capacityVal} users can book this slot. Each pays ₹{batchPriceVal}. Approval is not required.
          </p>
        </div>
      );
    } else {
      if ((chatPrice === "" || chatPrice === null) && (videoCallPrice === "" || videoCallPrice === null)) {
        showAlert("At least one price (Chat or Video Call) must be set", "error");
        return;
      }

      const chatPriceVal = Number(chatPrice) || 0;
      const videoCallPriceVal = Number(videoCallPrice) || 0;

      payload = {
        slot_mode: "ONE_TO_ONE",
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        duration_minutes: Number(duration),
        chat_price: chatPriceVal,
        video_call_price: videoCallPriceVal,
        requires_approval: requiresApproval,
        is_chat_available: chatPriceVal > 0,
        is_video_call_available: videoCallPriceVal > 0,
      };

      const chatMsg = chatPriceVal > 0 ? `₹${chatPriceVal}` : "Not Available";
      const videoMsg = videoCallPriceVal > 0 ? `₹${videoCallPriceVal}` : "Not Available";

      confirmBody = (
        <div className="space-y-2">
          <p>Please confirm the slot details:</p>
          <div className="space-y-1 rounded-xl bg-muted p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chat Consultation:</span>
              <span className={`font-bold ${chatPriceVal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-danger"}`}>{chatMsg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Video Call:</span>
              <span className={`font-bold ${videoCallPriceVal > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-danger"}`}>{videoMsg}</span>
            </div>
          </div>
          {(chatPriceVal === 0 || videoCallPriceVal === 0) && (
            <p className="mt-2 text-xs font-medium text-danger">
              Note: Features with "Not Available" cannot be booked by users for this slot.
            </p>
          )}
        </div>
      );
    }

    showConfirm({
      title: isEdit ? "Update Slot" : "Create Slot",
      message: confirmBody,
      confirmText: isEdit ? "Update" : "Create",
      cancelText: "Cancel",
      onConfirm: () => {
        onSave(payload, initialData?.uuid);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="text-foreground">
      {/* HEADER */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight">
            {isEdit ? "Edit" : "Create"} <span className="text-primary">Slot</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isEdit ? "Update this availability window." : "Set a new availability window."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="-mr-1 -mt-1 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {/* SESSION MODE */}
        <div>
          <label className={labelClass}>Session Type</label>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-muted/40 p-1">
            <ModeButton
              active={!isBatch}
              disabled={isEdit}
              onClick={() => setSlotMode("ONE_TO_ONE")}
              icon={<FiUser size={14} />}
              title="One-to-One"
              subtitle="Chat / Video"
            />
            <ModeButton
              active={isBatch}
              disabled={isEdit}
              onClick={() => setSlotMode("BATCH")}
              icon={<FiUsers size={14} />}
              title="Group Video"
              subtitle="Multiple users"
            />
          </div>
          {isEdit && (
            <p className="mt-1 text-2xs font-medium text-muted-foreground">
              Session type can't be changed after creation.
            </p>
          )}
        </div>

        {/* SCHEDULE */}
        <div>
          <label className={labelClass}>Schedule</label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Start</span>
              <input
                type="datetime-local"
                value={start}
                min={toLocalString(new Date())}
                onChange={(e) => setStart(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">End</span>
              <input
                type="datetime-local"
                value={end}
                min={start || toLocalString(new Date())}
                onChange={(e) => setEnd(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          {duration > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
              <FiClock size={13} />
              {duration} min session
            </div>
          )}
        </div>

        {/* PRICING */}
        <div>
          <label className={labelClass}>{isBatch ? "Group Pricing" : "Pricing"}</label>
          <div className="grid grid-cols-2 gap-2.5">
            {isBatch ? (
              <>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Max Participants (2–{MAX_BATCH_CAPACITY})
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={MAX_BATCH_CAPACITY}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className={fieldClass}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">Price / User (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={batchPrice}
                    onChange={(e) => setBatchPrice(e.target.value)}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">Chat (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={chatPrice}
                    onChange={(e) => setChatPrice(e.target.value)}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">Video Call (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={videoCallPrice}
                    onChange={(e) => setVideoCallPrice(e.target.value)}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
          </div>
          {!isBatch && (
            <p className="mt-1.5 text-2xs text-muted-foreground">
              Set at least one. Leave a field at 0 to disable that option.
            </p>
          )}
        </div>

        {/* BATCH INFO / APPROVAL */}
        {isBatch ? (
          <div className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/50 p-3">
            <FiUsers className="mt-0.5 shrink-0 text-primary" size={16} />
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              Up to <span className="font-bold text-primary">{Number(capacity) || 0}</span> users can book this one slot,
              each paying the per-user price. Everyone joins the same call — no approval needed.
            </p>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-3 transition-all hover:bg-muted">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded accent-primary"
            />
            <span className="text-sm font-medium">Require my approval before a booking is confirmed</span>
          </label>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex gap-2.5">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" size="sm" className="flex-[2]">
          {isEdit ? "Update Slot" : "Create Slot"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- SUB-COMPONENT: session-mode toggle ---------------- */
function ModeButton({ active, disabled, onClick, icon, title, subtitle }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all",
        disabled && !active && "cursor-not-allowed opacity-40",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-tight">{title}</span>
        <span className={cn("block text-2xs font-medium leading-tight", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}
