import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdOutlineSchedule, MdPerson, MdOutlinePayments, MdChatBubbleOutline, MdOutlineTimer, MdVideocam } from "react-icons/md";

import axiosSecure from "../utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { Button } from "../ui";

export default function MyBookings() {
  const { data: user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("expert");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  /* ---------------- FETCH BOOKINGS ---------------- */
  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      let combinedData = [];

      if (activeTab === "expert") {
        if (user.user_type === "expert") {
          const [resExp, resCli] = await Promise.all([
            axiosSecure.get("/v1/bookings/?as_expert=true"),
            axiosSecure.get("/v1/bookings/")
          ]);
          const conducting = (Array.isArray(resExp.data) ? resExp.data : (resExp.data?.results || [])).map(b => ({ ...b, _role: "conducting" }));
          const attending = (Array.isArray(resCli.data) ? resCli.data : (resCli.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
          combinedData = [...conducting, ...attending];
        } else {
          const res = await axiosSecure.get("/v1/bookings/");
          combinedData = (Array.isArray(res.data) ? res.data : (res.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
        }
      } else {
        if (user.user_type === "investor") {
          const [resInv, resCli] = await Promise.all([
            axiosSecure.get("/v1/bookings/investor-bookings/list/?as_investor=true"),
            axiosSecure.get("/v1/bookings/investor-bookings/list/")
          ]);
          const conducting = (Array.isArray(resInv.data) ? resInv.data : (resInv.data?.results || [])).map(b => ({ ...b, _role: "conducting" }));
          const attending = (Array.isArray(resCli.data) ? resCli.data : (resCli.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
          combinedData = [...conducting, ...attending];
        } else {
          const res = await axiosSecure.get("/v1/bookings/investor-bookings/list/");
          combinedData = (Array.isArray(res.data) ? res.data : (res.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
        }
      }

      const uniqueMap = new Map();
      combinedData.forEach(item => {
        if (!uniqueMap.has(item.uuid)) {
          uniqueMap.set(item.uuid, item);
        }
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));
      setBookings(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
      showAlert("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATUS CONFIG ---------------- */
  const getStatusConfig = (booking) => {
    const status = (booking.cancelled_at ? "CANCELLED" :
      booking.declined_at ? "DECLINED" :
        booking.completed_at ? "COMPLETED" :
          booking.confirmed_at ? "CONFIRMED" :
            booking.paid_at ? "PAID" : booking.status).toUpperCase();

    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return { label: status, color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "PAID":
        return { label: status, color: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400" };
      case "PENDING":
        return { label: status, color: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "CANCELLED":
      case "DECLINED":
        return { label: status, color: "border-danger/20 bg-danger/10 text-danger" };
      default:
        return { label: status, color: "border-border bg-muted text-muted-foreground" };
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <span className="text-2xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-10 text-center">
          <p className="mb-5 text-sm font-bold text-danger">{error}</p>
          <Button onClick={fetchBookings}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              My <span className="text-primary">Bookings</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Track and manage your scheduled consultation sessions.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-2xs font-bold uppercase tracking-wide text-muted-foreground">
              {bookings.length} session{bookings.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border no-scrollbar">
          {[
            { key: "expert", label: "Expert Sessions" },
            { key: "investor", label: "Investor Sessions" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-all ${activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <MdOutlineSchedule size={30} />
            </div>
            <h3 className="text-base font-bold text-foreground">No bookings yet</h3>
            <p className="text-sm text-muted-foreground">Book a session to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking) => {
              const status = getStatusConfig(booking);
              const startDate = new Date(booking.start_datetime);
              const endDate = new Date(booking.end_datetime);
              const durationMins = booking.duration_minutes || Math.floor((endDate - startDate) / 60000);
              const isVideo = booking.session_type === "VIDEO_CALL";

              let otherPersonName = "";
              if (activeTab === "expert") {
                otherPersonName = booking._role === "conducting" ? booking.user_name : booking.expert_name;
              } else {
                otherPersonName = booking._role === "conducting" ? booking.user_name : booking.investor_name;
              }

              const canJoin = booking.chat_room_id || booking.call_room_id || ['CONFIRMED', 'PAID', 'COMPLETED'].includes(status.label);

              return (
                <div
                  key={booking.uuid}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                >
                  {/* HEADER */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <MdPerson size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-bold text-foreground">{otherPersonName}</h4>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className={`rounded-full border px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wide ${status.color}`}>
                          {status.label}
                        </span>
                        {booking._role === "attending" && (
                          <span className="rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wide text-primary">
                            My Booking
                          </span>
                        )}
                        {booking._role === "conducting" && (
                          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wide text-muted-foreground">
                            My Session
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SCHEDULE */}
                  <div className="mb-4 rounded-xl bg-muted/40 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <MdOutlineSchedule size={18} className="mt-0.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' — '}
                            {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">
                        {isVideo ? <MdVideocam size={13} className="text-primary" /> : <MdChatBubbleOutline size={13} className="text-primary" />}
                        {isVideo ? "Video" : "Chat"}
                      </div>
                    </div>
                  </div>

                  {/* META */}
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">Duration</p>
                      <div className="flex items-center gap-1.5">
                        <MdOutlineTimer className="text-primary" size={15} />
                        <span className="text-sm font-bold text-foreground">{durationMins}m</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-2xs font-bold uppercase tracking-wide text-muted-foreground">Fee</p>
                      <div className="flex items-center justify-end gap-1.5">
                        <MdOutlinePayments className="text-primary" size={15} />
                        <span className="text-sm font-bold text-foreground">{booking.price !== undefined ? `₹${booking.price}` : "Free"}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION */}
                  {canJoin && (
                    <div className="mt-auto">
                      {now >= startDate ? (
                        isVideo ? (
                          <Button
                            fullWidth
                            onClick={() => booking.call_room_id ? navigate(`/video-call/${booking.call_room_id}`) : showAlert("Video room not ready yet", "info")}
                          >
                            <MdVideocam size={18} /> Start Video Call
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            onClick={() => navigate(booking.chat_room_id ? `/chat/${booking.chat_room_id}` : '/chat')}
                          >
                            <MdChatBubbleOutline size={18} /> {booking.session_type === "CHAT" ? "Start Chat" : "Open Chat"}
                          </Button>
                        )
                      ) : (
                        <Button fullWidth variant="secondary" disabled>
                          <MdOutlineSchedule size={18} />
                          Starts at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
