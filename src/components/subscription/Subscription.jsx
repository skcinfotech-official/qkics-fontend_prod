import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaCheckCircle, FaCrown, FaArrowRight } from "react-icons/fa";
import { MdDiamond } from "react-icons/md";

import axiosSecure from "../utils/axiosSecure";
import { redirectToGateway } from "../utils/paymentApi";
import { useAlert } from "../../context/AlertContext";
import { Breadcrumb } from "../ui";

export default function Subscription() {
    const navigate = useNavigate();
    const { data: user } = useSelector((state) => state.user);
    const { showAlert } = useAlert();

    const [plans, setPlans] = useState([]);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(null); // stores uuid of plan being subscribed to

    useEffect(() => {
        const loadInit = async () => {
            setLoading(true);
            await Promise.all([fetchPlans(), fetchActiveSubscription()]);
            setLoading(false);
        };
        loadInit();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axiosSecure.get("/v1/subscriptions/plans/");
            setPlans(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) {
            console.error("Failed to load plans", err);
        }
    };

    const fetchActiveSubscription = async () => {
        if (!user) return;
        try {
            const res = await axiosSecure.get("/v1/subscriptions/me/");
            const subData = res.data;
            if (subData && subData.is_active) {
                const now = new Date();
                const start = new Date(subData.start_date);
                const end = new Date(subData.end_date);
                if (now >= start && now <= end) {
                    setActiveSubscription(subData);
                }
            }
        } catch (err) {
            console.error("Failed to load active subscription", err);
        }
    };

    const handleSubscribe = async (plan) => {
        if (!user) {
            showAlert("Please login to subscribe", "error");
            return;
        }

        try {
            setSubscribing(plan.uuid);
            const res = await axiosSecure.post("/v1/subscriptions/subscribe/", {
                plan_uuid: plan.uuid
            });

            // Hosted checkout (PayU): leave the SPA; return to /payment/result.
            if (res.data?.flow === "redirect_post") {
                redirectToGateway(res.data.checkout);
                return;
            }

            showAlert(`Successfully subscribed to ${plan.name} plan!`, "success");

            // Navigate to profile or refresh page to show active status
            setTimeout(() => {
                navigate("/profile");
            }, 1000);

        } catch (err) {
            console.error("❌ Subscription failed:", err);
            const errMsg = err.response?.data?.message || err.response?.data?.message || "Failed to subscribe. Please try again.";
            showAlert(errMsg, "error");
        } finally {
            setSubscribing(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"></div>
                    <span className="text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground">Loading Plans...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* HEADER */}
                <Breadcrumb items={[{ label: "Subscription" }]} />
                <div className="text-center mb-10 animate-fadeIn">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                        Upgrade your <span className="text-primary">Impact</span>
                    </h1>
                    <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                        Unlock exclusive access to expert intelligence, premium resources, and advanced networking tools.
                    </p>
                </div>

                {/* ACTIVE SUBSCRIPTION */}
                {activeSubscription && (
                    <div className="mb-12 max-w-2xl mx-auto p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 animate-scaleIn relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.06] group-hover:opacity-10 transition-opacity text-emerald-500">
                            <MdDiamond size={120} />
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shrink-0">
                                <FaCrown size={30} />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h3 className="text-lg font-bold tracking-tight">Active Subscription</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-2xs font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                                </div>
                                <p className="text-sm font-bold text-muted-foreground">
                                    Plan: <span className="text-foreground">{activeSubscription.plan_name || "Premium Plan"}</span>
                                </p>
                                <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                                    Expires: {new Date(activeSubscription.end_date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRICING GRID */}
                {plans.length === 0 ? (
                    <div className="text-center py-20 rounded-2xl border border-dashed border-border">
                        <MdDiamond className="mx-auto text-5xl mb-4 text-muted-foreground/30" />
                        <h3 className="font-bold text-xl text-foreground">No Plans Available</h3>
                        <p className="text-sm text-muted-foreground mt-2">Please check back later for new subscription offers.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, index) => {
                            const isRecommended = index === 1; // Assuming middle plan is recommended for visual balance
                            const isActivePlan = activeSubscription?.plan_uuid === plan.uuid;
                            const highlight = isRecommended || isActivePlan;

                            return (
                                <div
                                    key={plan.uuid}
                                    className={`relative group flex flex-col p-6 w-full max-w-[300px] rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/5
                                         ${isActivePlan
                                            ? "border-primary ring-2 ring-primary"
                                            : isRecommended
                                                ? "border-primary/40"
                                                : "border-border hover:border-primary/30"}
                                      `}
                                >
                                    {highlight && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-2xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/30 z-10">
                                            {isActivePlan ? "Current Plan" : "Most Popular"}
                                        </div>
                                    )}

                                    {/* CARD HEADER */}
                                    <div className="mb-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-xl transition-transform duration-300 group-hover:scale-110
                                             ${highlight ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}
                                           `}>
                                            <FaCrown />
                                        </div>
                                        <h3 className="text-lg font-bold uppercase tracking-tight mb-1">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold">₹{plan.price}</span>
                                            <span className="text-xs font-medium text-muted-foreground">/ {plan.duration_days} days</span>
                                        </div>
                                    </div>

                                    {/* FEATURES LIST (Placeholder if no features in API) */}
                                    <div className="flex-1 mb-6">
                                        <div className="w-full h-px bg-border mb-4" />
                                        <ul className="space-y-3">
                                            {['Premium Support', 'Unlimited Access', 'Expert Consultation', 'Verified Badge'].map((feature, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <FaCheckCircle className="text-primary flex-shrink-0" size={14} />
                                                    <span className="text-xs font-bold text-muted-foreground">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* ACTION BUTTON */}
                                    <button
                                        onClick={() => handleSubscribe(plan)}
                                        disabled={subscribing !== null || isActivePlan}
                                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all disabled:cursor-not-allowed
                                             ${isActivePlan
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-100"
                                                : isRecommended
                                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] disabled:opacity-50"
                                                    : "bg-foreground text-background hover:opacity-90 disabled:opacity-50"
                                            }
                                         `}
                                    >
                                        {subscribing === plan.uuid ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                <span>Subscribing...</span>
                                            </div>
                                        ) : isActivePlan ? (
                                            <div className="flex items-center gap-2">
                                                <FaCheckCircle size={12} />
                                                <span>Active</span>
                                            </div>
                                        ) : (
                                            <>Get Started <FaArrowRight size={12} /></>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
