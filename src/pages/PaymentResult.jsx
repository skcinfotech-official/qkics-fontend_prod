import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import { pollPaymentStatus } from "../components/utils/paymentApi";
import { Button } from "../components/ui";

/**
 * Landing page the hosted-checkout gateway (PayU) redirects the browser back
 * to. Reads ?status & ?payment, then polls the payment for the final state
 * (the gateway callback confirms server-side asynchronously).
 */
export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const paymentUuid = params.get("payment");
  const initialStatus = params.get("status"); // "success" | "failed"

  const [loading, setLoading] = useState(Boolean(paymentUuid));
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!paymentUuid) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await pollPaymentStatus(paymentUuid);
        if (alive) setPayment(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [paymentUuid]);

  const isSuccess = payment
    ? payment.status === "SUCCESS"
    : initialStatus === "success";
  const isBooking = payment?.purpose === "BOOKING";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <span className="text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground">
          Confirming payment…
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            isSuccess ? "bg-emerald-500/10 text-emerald-500" : "bg-danger/10 text-danger"
          }`}
        >
          {isSuccess ? <FaCheckCircle size={34} /> : <FaTimesCircle size={34} />}
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {isSuccess ? "Payment Successful" : "Payment Failed"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSuccess
            ? isBooking
              ? "Your booking is confirmed."
              : "Your subscription is now active."
            : "Your payment could not be completed. You have not been charged."}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          {isSuccess ? (
            isBooking ? (
              <Button onClick={() => navigate("/my-bookings")}>Go to My Bookings</Button>
            ) : (
              <Button onClick={() => navigate("/subscription")}>View My Plan</Button>
            )
          ) : (
            <Button onClick={() => navigate(-1)}>Try Again</Button>
          )}
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
