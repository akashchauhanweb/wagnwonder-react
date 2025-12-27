import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function PaymentStatus() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading"); // "loading" | "paid" | "failed"
    const [message, setMessage] = useState("");
    const [transactionId, setTransactionId] = useState("");

    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId") || params.get("order_id");

    const handleRetry = () => {
        const saved = localStorage.getItem("pending_booking");
        if (saved) {
            const booking = JSON.parse(saved);
            navigate("/booking-review", {
                state: {
                    ...booking,
                    errorMessage: "Your payment failed. Please try again."
                }
            });
        } else {
            navigate("/");
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        async function verifyPayment() {
            try {
                let payload = {
                    action: "VERIFY_PAYMENT",
                    session_id: localStorage.getItem("session_id"),
                    order_id: orderId
                }
                const data = await callServicesApi(payload);
                if (data.status === "PAID") {
                    setStatus("paid");
                    setMessage(data.message || "Your booking has been confirmed!");
                    setTransactionId(data.cf_order_id);

                    try {
                        const saved = JSON.parse(localStorage.getItem("pending_booking") || "{}");
                        const user = JSON.parse(localStorage.getItem("user_data") || "{}");

                        const bookingPayload = {
                            user_id: user.id,
                            action: "CREATE_BOOKING_ENTRY",
                            session_id: localStorage.getItem("session_id"),
                            kennel_id: saved.kennel.kennel_id,
                            room_type_id: saved.room_type_id,
                            check_in_date: saved.checkin,
                            check_out_date: saved.checkout,
                            days: saved.days,
                            total_price: saved.total,
                            mode: "online",
                            order_id: orderId,
                            cf_order_id: data.cf_order_id,
                            pets: saved.breakdown.map((p) => ({
                                pet_id: p.id,
                                price_per_day: p.perDay,
                                days: p.days,
                                total_price: p.total,
                            })),
                        };

                        const res = await callServicesApi(bookingPayload);
                        console.log(res);
                        localStorage.removeItem("pending_booking");
                    } catch (e) {
                        console.error("Failed to create booking entry:", e);
                    }
                } else {
                    setStatus("failed");
                    setMessage(data.message || "Payment could not be completed.");
                }
            } catch (e) {
                setStatus("failed");
                console.log(e);
                setMessage("Error verifying payment. Please contact support.");
            }
        }
        verifyPayment();
    }, [orderId]);

    return (
        <div className="payment-status-page">
            <div className="payment-status-container">
                {status === "loading" && (
                    <div className="payment-status-card">
                        <div className="payment-status-loading">
                            <div className="payment-status-spinner">
                                <div className="spinner-border" role="status" />
                            </div>
                            <h2>Verifying Payment</h2>
                            <p>Please wait while we confirm your payment...</p>
                            <div className="payment-status-steps">
                                <div className="payment-status-step active">
                                    <i className="bi bi-credit-card"></i>
                                    <span>Payment Received</span>
                                </div>
                                <div className="payment-status-step-line"></div>
                                <div className="payment-status-step">
                                    <i className="bi bi-shield-check"></i>
                                    <span>Verifying</span>
                                </div>
                                <div className="payment-status-step-line"></div>
                                <div className="payment-status-step">
                                    <i className="bi bi-check-circle"></i>
                                    <span>Confirmed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {status === "paid" && (
                    <div className="payment-status-card success">
                        <div className="payment-status-icon success">
                            <i className="bi bi-check-lg"></i>
                        </div>
                        <h2>Payment Successful!</h2>
                        <p>{message}</p>
                        
                        <div className="payment-status-details">
                            <div className="payment-status-detail-item">
                                <span className="label">Transaction ID</span>
                                <span className="value">{transactionId}</span>
                            </div>
                            <div className="payment-status-detail-item">
                                <span className="label">Order ID</span>
                                <span className="value">{orderId}</span>
                            </div>
                        </div>

                        <div className="payment-status-actions">
                            <button 
                                className="payment-status-btn primary"
                                onClick={() => navigate("/account/creche-bookings")}
                            >
                                <i className="bi bi-calendar-check"></i>
                                View My Bookings
                            </button>
                            <button 
                                className="payment-status-btn secondary"
                                onClick={() => navigate("/")}
                            >
                                <i className="bi bi-house"></i>
                                Back to Home
                            </button>
                        </div>

                        <div className="payment-status-confirmation">
                            <i className="bi bi-envelope-check"></i>
                            <span>A confirmation email has been sent to your registered email.</span>
                        </div>
                    </div>
                )}

                {status === "failed" && (
                    <div className="payment-status-card failed">
                        <div className="payment-status-icon failed">
                            <i className="bi bi-x-lg"></i>
                        </div>
                        <h2>Payment Failed</h2>
                        <p>{message}</p>

                        {orderId && (
                            <div className="payment-status-details">
                                <div className="payment-status-detail-item">
                                    <span className="label">Order ID</span>
                                    <span className="value">{orderId}</span>
                                </div>
                            </div>
                        )}

                        <div className="payment-status-actions">
                            <button 
                                className="payment-status-btn primary"
                                onClick={handleRetry}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                                Try Again
                            </button>
                            <button 
                                className="payment-status-btn secondary"
                                onClick={() => navigate("/")}
                            >
                                <i className="bi bi-house"></i>
                                Back to Home
                            </button>
                        </div>

                        <div className="payment-status-help">
                            <p>Need help? Contact our support team</p>
                            <a href="mailto:customersupport@wagnwonder.co">
                                <i className="bi bi-envelope"></i>
                                customersupport@wagnwonder.co
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}