import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function BookingReview() {
    const location = useLocation();
    const navigate = useNavigate();
    const { kennel, checkin, checkout, breakdown, total, days, room_type_id, errorMessage } = location.state || {};
    const [error, _] = useState(errorMessage || "");
    const [isProcessing, setIsProcessing] = useState(false);
    const IS_DEV = import.meta.env.VITE_IS_DEV === '1' ? 1 : 0;
    const ENV_NAME = import.meta.env.VITE_IS_DEV === '1' ? 'sandbox' : 'production';

    // Wallet state — read from localStorage, no API call
    const [walletBalance] = useState(() => parseFloat(localStorage.getItem("woof_balance") || "0"));
    const [useWallet, setUseWallet] = useState(false);

    const walletDeduction = useWallet ? Math.min(walletBalance, total) : 0;
    const onlineAmount = total - walletDeduction;
    const paymentMode = walletDeduction >= total ? "wallet" : walletDeduction > 0 ? "partial" : "online";

    useEffect(() => {
        window.scrollTo(0, 0);
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    if (!kennel || !checkin || !checkout || !breakdown || !total || !days || !room_type_id) {
        console.warn("Missing one of:", { kennel, checkin, checkout, breakdown, total, days, room_type_id });
        return (
            <div className="booking-review-page">
                <div className="page-header">
                    <div className="page-header-content">
                        <button className="page-header-back-btn" onClick={() => navigate(-1)}>
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1>Booking Review</h1>
                    </div>
                </div>
                <div className="booking-review-container">
                    <div className="booking-review-empty">
                        <i className="bi bi-exclamation-circle"></i>
                        <p>Missing booking information.</p>
                        <button onClick={() => navigate(-1)}>Go Back</button>
                    </div>
                </div>
            </div>
        );
    }

    const handlePayNow = async () => {
        setIsProcessing(true);
        localStorage.setItem(
            "pending_booking",
            JSON.stringify({ kennel, checkin, checkout, breakdown, total, days, room_type_id, walletDeduction, paymentMode })
        );
        try {
            let customer_data = JSON.parse(localStorage.getItem("user_data"));

            // Full wallet payment — no Cashfree needed
            if (paymentMode === "wallet") {
                const bookingPayload = {
                    action: "CREATE_BOOKING_ENTRY",
                    session_id: localStorage.getItem("session_id"),
                    user_id: customer_data.id,
                    kennel_id: kennel.kennel_id,
                    room_type_id: room_type_id,
                    check_in_date: checkin,
                    check_out_date: checkout,
                    days: days,
                    total_price: total,
                    wallet_amount: walletDeduction,
                    mode: "wallet",
                    order_id: `WALLET_${Date.now()}`,
                    cf_order_id: null,
                    pets: breakdown.map((p) => ({
                        pet_id: p.id,
                        price_per_day: p.perDay,
                        days: p.days,
                        total_price: p.total,
                    })),
                };

                const res = await callServicesApi(bookingPayload);
                if (res?.success) {
                    localStorage.removeItem("pending_booking");
                    navigate("/payment-status?wallet_success=1");
                } else {
                    console.error("Wallet booking failed:", res);
                    setIsProcessing(false);
                }
                return;
            }

            // Online or partial — go through Cashfree for the online amount
            let payload = {
                action: "CREATE_PAYMENT_SESSION",
                session_id: localStorage.getItem("session_id"),
                customer_id: customer_data.id.toString().padStart(3, '0'),
                customer_phone: customer_data.phone_number,
                order_amount: onlineAmount
            }
            const data = await callServicesApi(payload);
            if (!data.payment_session_id) {
                console.error("Missing payment_session_id", data);
                setIsProcessing(false);
                return;
            }
            const cashfree = window.Cashfree({ mode: ENV_NAME });
            cashfree.checkout({
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_self",
                returnUrl: `${window.location.origin}/payment-status?order_id={order_id}`
            });
        } catch (err) {
            console.error("Error creating payment order:", err);
            setIsProcessing(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="booking-review-page">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <button className="page-header-back-btn" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h1>Booking Review</h1>
                </div>
            </div>

            <div className="booking-review-container">
                {error && (
                    <div className="booking-review-error">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {error}
                    </div>
                )}

                {/* Kennel Info Card */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-house-heart-fill"></i>
                        <h3>Kennel</h3>
                    </div>
                    <div className="booking-review-kennel">
                        <h4>{kennel.kennel_name}</h4>
                    </div>
                </div>

                {/* Dates Card */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-calendar-check-fill"></i>
                        <h3>Stay Details</h3>
                    </div>
                    <div className="booking-review-dates">
                        <div className="booking-review-date-item">
                            <span className="booking-review-date-label">Check-in</span>
                            <span className="booking-review-date-value">{formatDate(checkin)}</span>
                        </div>
                        <div className="booking-review-date-divider">
                            <i className="bi bi-arrow-right"></i>
                        </div>
                        <div className="booking-review-date-item">
                            <span className="booking-review-date-label">Check-out</span>
                            <span className="booking-review-date-value">{formatDate(checkout)}</span>
                        </div>
                    </div>
                    <div className="booking-review-duration">
                        <i className="bi bi-moon-stars-fill"></i>
                        <span>{days} {days === 1 ? 'night' : 'nights'}</span>
                    </div>
                </div>

                {/* Pets Card */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-heart-fill"></i>
                        <h3>Your Pets</h3>
                    </div>
                    <div className="booking-review-pets">
                        {breakdown.map((p) => (
                            <div key={p.id} className="booking-review-pet-item">
                                <div className="booking-review-pet-info">
                                    <div className="booking-review-pet-avatar">
                                        <i className="bi bi-github"></i>
                                    </div>
                                    <div className="booking-review-pet-details">
                                        <h5>{p.name}</h5>
                                        <div className="booking-review-pet-meta">
                                            <span className="booking-review-pet-breed">{p.breed}</span>
                                            <span className="booking-review-pet-weight">{p.weight}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="booking-review-pet-pricing">
                                    <span className="booking-review-pet-rate">₹{p.perDay}/day</span>
                                    <span className="booking-review-pet-total">₹{p.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wallet Section */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-wallet2"></i>
                        <h3>Woof Wallet</h3>
                    </div>
                    <div style={{ padding: "4px 0" }}>
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 16px", borderRadius: "10px",
                            background: useWallet ? "#fef2f2" : "#f8fafc",
                            border: useWallet ? "1.5px solid #D84A39" : "1px solid #e2e8f0",
                            cursor: "pointer", transition: "all 0.2s"
                        }}
                            onClick={() => setUseWallet(!useWallet)}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    width: "20px", height: "20px", borderRadius: "4px",
                                    border: useWallet ? "none" : "2px solid #cbd5e1",
                                    background: useWallet ? "#D84A39" : "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.2s", flexShrink: 0
                                }}>
                                    {useWallet && <i className="bi bi-check" style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}></i>}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>
                                        Pay with Woofs
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "1px" }}>
                                        Balance: {Math.floor(walletBalance).toLocaleString("en-IN")} Woofs
                                    </div>
                                </div>
                            </div>
                            {useWallet && (
                                <div style={{ fontWeight: 700, color: "#D84A39", fontSize: "0.95rem" }}>
                                    −{walletDeduction.toLocaleString("en-IN")} Woofs
                                </div>
                            )}
                        </div>
                        {useWallet && onlineAmount > 0 && (
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "8px", paddingLeft: "4px" }}>
                                <i className="bi bi-info-circle me-1"></i>
                                Remaining ₹{onlineAmount.toLocaleString("en-IN")} will be charged via online payment.
                            </div>
                        )}
                    </div>
                </div>

                {/* Total Card */}
                <div className="booking-review-total-card">
                    <div className="booking-review-total-row">
                        <span>Subtotal ({breakdown.length} {breakdown.length === 1 ? 'pet' : 'pets'} × {days} {days === 1 ? 'night' : 'nights'})</span>
                        <span>₹{total}</span>
                    </div>
                    {useWallet && walletDeduction > 0 && (
                        <div className="booking-review-total-row" style={{ color: "#059669" }}>
                            <span><i className="bi bi-wallet2 me-1"></i>Woof Wallet</span>
                            <span>−₹{walletDeduction.toLocaleString("en-IN")}</span>
                        </div>
                    )}
                    <div className="booking-review-total-row total">
                        <span>{paymentMode === "wallet" ? "Pay with Woofs" : "Pay Online"}</span>
                        <span>{paymentMode === "wallet" ? `${walletDeduction} Woofs` : `₹${onlineAmount.toLocaleString("en-IN")}`}</span>
                    </div>
                    <button 
                        className="booking-review-pay-btn" 
                        onClick={handlePayNow}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" />
                                Processing...
                            </>
                        ) : paymentMode === "wallet" ? (
                            <>
                                <i className="bi bi-wallet2"></i>
                                Pay {walletDeduction} Woofs
                            </>
                        ) : (
                            <>
                                <i className="bi bi-shield-lock-fill"></i>
                                Pay ₹{onlineAmount.toLocaleString("en-IN")}
                            </>
                        )}
                    </button>
                    <p className="booking-review-secure">
                        <i className="bi bi-lock-fill"></i>
                        {paymentMode === "wallet" ? "Paid instantly from your Woof Wallet" : "Secured by Cashfree Payments"}
                    </p>
                </div>
            </div>
        </div>
    );
}