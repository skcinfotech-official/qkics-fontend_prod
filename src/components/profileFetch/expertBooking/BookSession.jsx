import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

import axiosSecure from "../../utils/axiosSecure";
import { initiatePayment, redirectToGateway } from "../../utils/paymentApi";

import { useDispatch } from "react-redux";
import {
  createBooking,
  resetBookingState,
} from "../../../redux/slices/bookingSlice";

import { useAlert } from "../../../context/AlertContext";
import { useConfirm } from "../../../context/ConfirmContext";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiMessageSquare,
  FiVideo,
  FiUsers,
} from "react-icons/fi";

import {
  PageHeader,
  Button,
  FullPageLoader,
  EmptyState,
} from "../../ui";
import { cn } from "../../ui/cn";

export default function BookSession() {
  const { expertUuid } = useParams();

  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [bookingType, setBookingType] = useState("CHAT"); // "CHAT" or "VIDEO_CALL"

  /* ---------------- FETCH SLOTS ---------------- */
  useEffect(() => {
    fetchSlots();
  }, [expertUuid]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axiosSecure.get(
        `/v1/bookings/experts/${expertUuid}/slots/`
      );

      const availableSlots = (res.data || []).filter((slot) =>
        Boolean(
          slot.is_chat_available ||
            slot.is_video_call_available ||
            slot.is_batch_available
        )
      );

      setSlots(availableSlots);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-select booking type when slot changes
  useEffect(() => {
    if (!selectedSlot) return;

    if (selectedSlot.slot_mode === "BATCH") {
      setBookingType("VIDEO_CALL"); // batch is group video only
    } else if (Number(selectedSlot.chat_price) > 0 && selectedSlot.is_chat_available) {
      setBookingType("CHAT");
    } else if (
      Number(selectedSlot.video_call_price) > 0 &&
      selectedSlot.is_video_call_available
    ) {
      setBookingType("VIDEO_CALL");
    }
  }, [selectedSlot]);

  const isBatch = selectedSlot?.slot_mode === "BATCH";

  /* ---------------- PAYMENT FLOW ---------------- */
  const currentPrice = selectedSlot
    ? isBatch
      ? selectedSlot.batch_price
      : bookingType === "CHAT"
        ? selectedSlot.chat_price
        : selectedSlot.video_call_price
    : 0;

  const handleProceedToPay = () => {
    if (!selectedSlot || paymentProcessing) return;

    const sessionLabel = isBatch
      ? "Group Video Call"
      : bookingType === "CHAT"
        ? "Chat"
        : "Video Call";

    showConfirm({
      title: "Confirm Payment",
      message: `You will be charged ₹${currentPrice} for this ${sessionLabel} session. Continue?`,
      confirmText: "Pay Now",
      cancelText: "Cancel",

      onConfirm: async () => {
        setPaymentProcessing(true);
        const wasBatch = isBatch;

        try {
          /* 1️⃣ CREATE BOOKING */
          const booking = await dispatch(
            createBooking({ slotUuid: selectedSlot.uuid, bookingType })
          ).unwrap();

          /* 2️⃣ START PAYMENT (gateway-agnostic) */
          const pay = await initiatePayment({
            purpose: "BOOKING",
            booking_id: booking.uuid,
          });

          /* 2b️⃣ Hosted checkout (PayU): leave the SPA and come back to
             /payment/result. Do NOT clear UI — the browser is navigating. */
          if (pay.flow === "redirect_post") {
            redirectToGateway(pay.checkout);
            return;
          }

          /* 2c️⃣ Instant gateway (fake): already confirmed. */
          setPaymentProcessing(false);
          showAlert("Payment successful! Booking confirmed.", "success");

          setSelectedSlot(null);
          setAgreed(false);
          dispatch(resetBookingState());

          if (wasBatch) {
            // Batch slot may still have seats — refresh to update seats left.
            fetchSlots();
          } else {
            // One-to-one slot is now fully booked — remove it.
            setSlots((prev) => prev.filter((s) => s.uuid !== booking.slot_uuid));
          }
        } catch (err) {
          console.error("Payment failed:", err);
          setPaymentProcessing(false);
          showAlert("Payment failed. Please try again.", "error");
        }
      },
    });
  };

  /* ---------------- HELPERS ---------------- */
  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const groupedSlots = useMemo(() => {
    const groups = {};
    slots.forEach((slot) => {
      const { date } = formatDateTime(slot.start_datetime);
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
    });
    return groups;
  }, [slots]);

  /* ---------------- STATE: LOADING ---------------- */
  if (loading) {
    return <FullPageLoader label="Loading Slots…" />;
  }

  /* ---------------- STATE: ERROR ---------------- */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="p-8 text-center rounded-2xl bg-red-500/10 border border-red-500/20 text-danger">
          <p className="font-bold uppercase tracking-widest mb-4">{error}</p>
          <Button variant="danger" size="sm" onClick={fetchSlots}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const hasSlots = Object.keys(groupedSlots).length > 0;

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:pb-12">
        <PageHeader
          breadcrumb={[
            { label: "Experts", to: "/experts" },
            { label: "Book Session" },
          ]}
          title={
            <>
              Select <span className="text-primary">Session</span>
            </>
          }
          description="Choose a suitable time slot and consultation type for your session."
          align="end"
        />

        <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn">
          {/* LEFT — SLOT LIST */}
          <div className="flex-1 min-w-0">
            {!hasSlots ? (
              <div className="rounded-2xl border border-dashed border-border bg-card">
                <EmptyState
                  icon={<FiCalendar />}
                  title="No Slots Available"
                  description="This expert currently has no available time slots. Please check back later."
                />
              </div>
            ) : (
              <div className="space-y-9">
                {Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
                  <div key={dateLabel} className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <FiCalendar className="text-primary" size={16} />
                      <h3 className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
                        {dateLabel}
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {daySlots.map((slot) => {
                        const isSelected = selectedSlot?.uuid === slot.uuid;
                        const { time: startTime } = formatDateTime(
                          slot.start_datetime
                        );
                        const { time: endTime } = formatDateTime(
                          slot.end_datetime
                        );

                        return (
                          <button
                            key={slot.uuid}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "relative text-left p-5 rounded-2xl border transition-all",
                              "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none",
                              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              isSelected
                                ? "border-primary bg-primary-soft shadow-lg shadow-primary/10"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            {isSelected && (
                              <span className="absolute top-4 right-4 text-primary animate-fadeIn">
                                <FiCheckCircle size={20} />
                              </span>
                            )}

                            <div className="text-2xl font-bold tracking-tight">
                              {startTime}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-2xs font-black uppercase tracking-widest">
                              <span className="inline-flex items-center gap-1.5 bg-primary-soft text-primary px-2.5 py-1 rounded-full">
                                <FiClock size={11} />
                                {slot.duration_minutes} Min
                              </span>
                              {slot.slot_mode === "BATCH" && (
                                <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                                  <FiUsers size={11} />
                                  Group
                                </span>
                              )}
                              <span className="text-muted-foreground">
                                To {endTime}
                              </span>
                            </div>

                            <div
                              className={cn(
                                "mt-4 pt-4 border-t space-y-1.5 transition-colors",
                                isSelected ? "border-primary/20" : "border-border"
                              )}
                            >
                              {slot.slot_mode === "BATCH" ? (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
                                      Per User
                                    </span>
                                    <span className={cn("text-base font-black", isSelected && "text-primary")}>
                                      ₹{slot.batch_price}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
                                      Seats Left
                                    </span>
                                    <span className="text-2xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                      {slot.seats_left} / {slot.capacity}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {Number(slot.chat_price) > 0 && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
                                        Chat
                                      </span>
                                      <span
                                        className={cn(
                                          "text-base font-black",
                                          isSelected && "text-primary"
                                        )}
                                      >
                                        ₹{slot.chat_price}
                                      </span>
                                    </div>
                                  )}
                                  {Number(slot.video_call_price) > 0 && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
                                        Video Call
                                      </span>
                                      <span
                                        className={cn(
                                          "text-base font-black",
                                          isSelected && "text-primary"
                                        )}
                                      >
                                        ₹{slot.video_call_price}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — BOOKING SUMMARY */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-24 bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold tracking-tight mb-6">
                Booking <span className="text-primary">Summary</span>
              </h2>

              {!selectedSlot ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FiCheckCircle size={44} className="mb-5 opacity-30" />
                  <p className="text-2xs text-center font-black uppercase tracking-widest leading-loose">
                    Select a slot from the
                    <br />
                    calendar to continue
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  {/* Consultation type — segmented control (or group badge for batch) */}
                  {isBatch ? (
                    <div>
                      <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                        Session Type
                      </p>
                      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary-soft/60 px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                          <FiUsers size={15} /> Group Video Call
                        </span>
                        <span className="text-2xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          {selectedSlot.seats_left} / {selectedSlot.capacity} seats
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                        Consultation Type
                      </p>
                      <div className="inline-flex w-full gap-1 rounded-2xl border border-border bg-muted/50 p-1.5">
                        {Number(selectedSlot.chat_price) > 0 && (
                          <TypeToggle
                            active={bookingType === "CHAT"}
                            disabled={!selectedSlot.is_chat_available}
                            onClick={() => setBookingType("CHAT")}
                            icon={<FiMessageSquare size={13} />}
                            label={
                              selectedSlot.is_chat_available
                                ? "Chat"
                                : "Chat (Booked)"
                            }
                          />
                        )}
                        {Number(selectedSlot.video_call_price) > 0 && (
                          <TypeToggle
                            active={bookingType === "VIDEO_CALL"}
                            disabled={!selectedSlot.is_video_call_available}
                            onClick={() => setBookingType("VIDEO_CALL")}
                            icon={<FiVideo size={13} />}
                            label={
                              selectedSlot.is_video_call_available
                                ? "Video"
                                : "Video (Booked)"
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected time */}
                  <div className="rounded-2xl bg-muted/50 p-5">
                    <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                      Selected Time
                    </p>
                    <p className="font-bold text-base leading-snug">
                      {formatDateTime(selectedSlot.start_datetime).date}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(selectedSlot.start_datetime).time} —{" "}
                      {formatDateTime(selectedSlot.end_datetime).time}
                    </p>
                  </div>

                  {/* Line items */}
                  <div className="space-y-3 px-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-bold text-primary">
                        {selectedSlot.duration_minutes} Minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{isBatch ? "Fee (per user)" : "Session Fee"}</span>
                      <span className="font-bold">₹{currentPrice}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-5 border-t border-dashed border-border px-1">
                    <div className="flex justify-between items-end">
                      <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
                        Total
                      </span>
                      <span className="text-3xl font-black text-primary tracking-tighter">
                        ₹{currentPrice}
                      </span>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer group px-1">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-primary rounded"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="text-2xs font-bold uppercase tracking-widest leading-loose text-muted-foreground group-hover:text-foreground transition-colors">
                      I agree to the{" "}
                      <span className="text-primary hover:underline">
                        terms &amp; conditions
                      </span>{" "}
                      and the cancellation policy
                    </span>
                  </label>

                  {/* CTA */}
                  <Button
                    fullWidth
                    size="lg"
                    loading={paymentProcessing}
                    disabled={paymentProcessing || !agreed}
                    onClick={handleProceedToPay}
                    className="uppercase tracking-widest text-xs"
                  >
                    {paymentProcessing ? "Processing" : "Confirm & Pay"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- SUB-COMPONENT: consultation-type toggle ---------------- */
function TypeToggle({ active, disabled, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all",
        "text-2xs font-black uppercase tracking-widest",
        disabled && "opacity-40 cursor-not-allowed grayscale",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
