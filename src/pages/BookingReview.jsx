import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function BookingReview() {
    const location = useLocation();
    const navigate = useNavigate();
    const { kennel, checkin, checkout, breakdown, total, days, room_type_id, errorMessage } = location.state || {};
    const [error, _] = useState(errorMessage || "");
    const [isProcessing, setIsProcessing] = useState(false);

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
                <div className="search-results-header">
                    <div className="search-results-header-content">
                        <button className="search-back-btn" onClick={() => navigate(-1)}>
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
            JSON.stringify({ kennel, checkin, checkout, breakdown, total, days, room_type_id })
        );
        try {
            let customer_data = JSON.parse(localStorage.getItem("user_data"));
            let payload = {
                action: "CREATE_PAYMENT_SESSION",
                session_id: localStorage.getItem("session_id"),
                customer_id: customer_data.id.toString().padStart(3, '0'),
                customer_phone: customer_data.phone_number,
                order_amount: total
            }
            const data = await callServicesApi(payload);
            if (!data.payment_session_id) {
                console.error("Missing payment_session_id", data);
                setIsProcessing(false);
                return;
            }
            const cashfree = window.Cashfree({ mode: "sandbox" });
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
            <div className="search-results-header">
                <div className="search-results-header-content">
                    <button className="search-back-btn" onClick={() => navigate(-1)}>
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

                {/* Total Card */}
                <div className="booking-review-total-card">
                    <div className="booking-review-total-row">
                        <span>Subtotal ({breakdown.length} {breakdown.length === 1 ? 'pet' : 'pets'} × {days} {days === 1 ? 'night' : 'nights'})</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="booking-review-total-row total">
                        <span>Total Amount</span>
                        <span>₹{total}</span>
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
                        ) : (
                            <>
                                <i className="bi bi-shield-lock-fill"></i>
                                Pay ₹{total}
                            </>
                        )}
                    </button>
                    <p className="booking-review-secure">
                        <i className="bi bi-lock-fill"></i>
                        Secured by Cashfree Payments
                    </p>
                </div>
            </div>
        </div>
    );
}