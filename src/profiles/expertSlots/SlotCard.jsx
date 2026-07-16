import { MdEdit, MdDelete, MdOutlineSchedule, MdGroups } from "react-icons/md";

export default function SlotCard({
  slot,
  onEdit,
  onDelete,
  onReschedule,
}) {
  const start = new Date(slot.start_datetime);
  const end = new Date(slot.end_datetime);

  const isBatch = slot.slot_mode === "BATCH";
  const seatsLeft = Number(slot.seats_left ?? 0);

  // Slot is available if at least one service (or a batch seat) is available
  const isAvailable = isBatch
    ? Boolean(slot.is_batch_available)
    : Boolean(slot.is_chat_available || slot.is_video_call_available);

  const sameDay = start.toLocaleDateString() === end.toLocaleDateString();

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      {/* HEADER */}
      <div className="mb-4">
        <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-muted-foreground">Date &amp; Time</span>
        <div className="flex items-center gap-2 text-base font-bold text-foreground">
          <MdOutlineSchedule className="text-primary" />
          <span>
            {start.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="pl-6 text-sm font-medium text-muted-foreground">
          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {" – "}
          {!sameDay && `${end.toLocaleDateString()} • `}
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      <div className="my-4 h-px w-full bg-border" />

      {/* INFO GRID */}
      <div className="mb-4 grid grid-cols-2 gap-x-2 gap-y-4">
        {isBatch ? (
          <>
            <div>
              <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-muted-foreground">Per User</span>
              <span className="text-base font-bold text-primary">₹{slot.batch_price}</span>
            </div>
            <div>
              <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-muted-foreground">Seats</span>
              <span className="text-base font-bold text-foreground">
                {seatsLeft}<span className="text-muted-foreground"> / {slot.capacity} left</span>
              </span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-muted-foreground">Chat Price</span>
              <span className={`text-base font-bold ${Number(slot.chat_price) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                {Number(slot.chat_price) > 0 ? `₹${slot.chat_price}` : "N/A"}
              </span>
            </div>
            <div>
              <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-muted-foreground">Video Price</span>
              <span className={`text-base font-bold ${Number(slot.video_call_price) > 0 ? "text-primary" : "text-muted-foreground"}`}>
                {Number(slot.video_call_price) > 0 ? `₹${slot.video_call_price}` : "N/A"}
              </span>
            </div>
          </>
        )}
        <div className="col-span-2">
          <span className="mb-1 block text-2xs font-bold uppercase tracking-wide text-muted-foreground">Duration</span>
          <span className="text-sm font-bold text-foreground">{slot.duration_minutes} mins</span>
        </div>
      </div>

      {/* STATUS BADGES */}
      <div className="mb-5 flex flex-wrap gap-2">
        {isBatch && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-2xs font-bold uppercase tracking-wide text-primary">
            <MdGroups size={13} /> Group
          </span>
        )}
        <span
          className={`rounded-full border px-3 py-1 text-2xs font-bold uppercase tracking-wide ${slot.status === "ACTIVE"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-border bg-muted text-muted-foreground"
            }`}
        >
          {slot.status}
        </span>

        <span
          className={`rounded-full border px-3 py-1 text-2xs font-bold uppercase tracking-wide ${isAvailable
            ? "border-primary/20 bg-primary-soft text-primary"
            : "border-border bg-muted text-muted-foreground"
            }`}
        >
          {isAvailable ? "Available" : "Booked"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="mt-auto flex gap-2">
        {isAvailable ? (
          <>
            <button
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-muted/70"
            >
              <MdEdit size={14} /> Edit
            </button>

            <button
              onClick={onDelete}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-danger transition-colors hover:bg-danger hover:text-white"
            >
              <MdDelete size={14} /> Delete
            </button>
          </>
        ) : (
          <button
            onClick={onReschedule}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-soft px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <MdOutlineSchedule size={14} /> Reschedule
          </button>
        )}
      </div>
    </div>
  );
}
