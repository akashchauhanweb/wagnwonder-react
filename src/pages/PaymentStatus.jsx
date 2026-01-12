import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function PaymentStatus() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading"); // "loading" | "paid" | "failed"
    const [message, setMessage] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;
    const retryTimeoutRef = useRef(null);

    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId") || params.get("order_id");
    const bookingType = params.get("type"); // "event" or undefined (kennel)

    const handleRetry = () => {
        // Check for event booking first
        const savedEvent = localStorage.getItem("pending_event_booking");
        if (savedEvent && bookingType === "event") {
            const booking = JSON.parse(savedEvent);
            navigate("/event-booking-review", {
                state: {
                    ...booking,
                    errorMessage: "Your payment failed. Please try again."
                }
            });
            return;
        }

        // Fall back to kennel booking
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

    const verifyPayment = async (currentRetry) => {
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

                // Check if this is an event booking
                const savedEventBooking = localStorage.getItem("pending_event_booking");
                if (savedEventBooking && bookingType === "event") {
                    try {
                        const saved = JSON.parse(savedEventBooking);
                        const user = JSON.parse(localStorage.getItem("user_data") || "{}");

                        const eventBookingPayload = {
                            action: "CREATE_EVENT_BOOKING_ENTRY",
                            session_id: localStorage.getItem("session_id"),
                            user_id: user.id,
                            event_id: saved.event.id,
                            pricing_id: saved.selectedTier.id,
                            ticket_count: saved.ticketCount,
                            total_price: saved.total,
                            form_data: saved.formData || {},
                            pets: saved.selectedPets || [],
                            order_id: orderId,
                            cf_order_id: data.cf_order_id,
                            mode: "online"
                        };

                        await callServicesApi(eventBookingPayload);
                        localStorage.removeItem("pending_event_booking");
                    } catch (e) {
                        console.error("Failed to create event booking entry:", e);
                    }
                } else {
                    // Kennel booking
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

                        await callServicesApi(bookingPayload);
                        localStorage.removeItem("pending_booking");
                        localStorage.removeItem("bookings");
                    } catch (e) {
                        console.error("Failed to create booking entry:", e);
                    }
                }
            } else if (data.status === "PENDING") {
                if (currentRetry < maxRetries) {
                    setRetryCount(currentRetry + 1);
                    retryTimeoutRef.current = setTimeout(() => {
                        verifyPayment(currentRetry + 1);
                    }, 10000);
                } else {
                    setStatus("failed");
                    setMessage("Payment verification timed out. If amount was deducted, it will be refunded within 5-7 business days.");
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
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        verifyPayment(0);

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
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
                            
                            {retryCount > 0 && (
                                <div className="payment-status-retry-info">
                                    <span>Attempt {retryCount + 1} of {maxRetries + 1}</span>
                                </div>
                            )}

                            <div className="payment-status-steps">
                                <div className={`payment-status-step ${retryCount >= 0 ? 'active' : ''}`}>
                                    <i className="bi bi-credit-card"></i>
                                    <span>Payment Received</span>
                                </div>
                                <div className="payment-status-step-line"></div>
                                <div className={`payment-status-step ${retryCount >= 0 ? 'active' : ''}`}>
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
                                onClick={() => navigate(bookingType === "event" ? "/account/event-bookings" : "/account/creche-bookings")}
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