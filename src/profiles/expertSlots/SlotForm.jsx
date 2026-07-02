import { useEffect, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";
import { FiX } from "react-icons/fi";
import { Button } from "../../components/ui";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const fieldClass =
  "w-full rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60";

export default function SlotForm({
  initialData,
  onSave,
  onCancel,
}) {
  const isEdit = Boolean(initialData);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [duration, setDuration] = useState(0);
  const [chatPrice, setChatPrice] = useState("");
  const [videoCallPrice, setVideoCallPrice] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);

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

    setStart(toLocalString(initialData.start_datetime));
    setEnd(toLocalString(initialData.end_datetime));
    setDuration(initialData.duration_minutes || 0);
    setChatPrice(initialData.chat_price || "");
    setVideoCallPrice(initialData.video_call_price || "");
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

    if ((chatPrice === "" || chatPrice === null) && (videoCallPrice === "" || videoCallPrice === null)) {
      showAlert("At least one price (Chat or Video Call) must be set", "error");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      showAlert("End time must be after start time", "error");
      return;
    }

    const chatPriceVal = Number(chatPrice) || 0;
    const videoCallPriceVal = Number(videoCallPrice) || 0;

    const payload = {
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

    showConfirm({
      title: isEdit ? "Update Slot" : "Create Slot",
      message: (
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
      ),
      confirmText: isEdit ? "Update" : "Create",
      cancelText: "Cancel",
      onConfirm: () => {
        onSave(payload, initialData?.uuid);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="text-foreground">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-lg font-bold tracking-tight">
          {isEdit ? "Edit" : "Create"} <span className="text-primary">Slot</span>
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FiX size={20} />
        </button>
      </div>

      <div className="mb-6 grid gap-5 md:grid-cols-2">
        <div>
          <label className={labelClass}>Start Date &amp; Time</label>
          <input
            type="datetime-local"
            value={start}
            min={toLocalString(new Date())}
            onChange={(e) => setStart(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>End Date &amp; Time</label>
          <input
            type="datetime-local"
            value={end}
            min={start || toLocalString(new Date())}
            onChange={(e) => setEnd(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            disabled
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>Chat Price (₹)</label>
          <input
            type="number"
            min={0}
            value={chatPrice}
            onChange={(e) => setChatPrice(e.target.value)}
            className={fieldClass}
            placeholder="0.00"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Video Call Price (₹)</label>
          <input
            type="number"
            min={0}
            value={videoCallPrice}
            onChange={(e) => setVideoCallPrice(e.target.value)}
            className={fieldClass}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 transition-all hover:bg-muted">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="h-5 w-5 rounded accent-primary"
          />
          <span className="text-sm font-medium">Requires approval before booking confirmation</span>
        </label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" fullWidth>
          {isEdit ? "Update Slot" : "Create Slot"}
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
