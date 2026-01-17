import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function EventBookingReview() {
    const location = useLocation();
    const navigate = useNavigate();
    const { event, selectedTier, ticketCount, selectedPets, formData, total, errorMessage } = location.state || {};
    const [error, setError] = useState(errorMessage || "");
    const [isProcessing, setIsProcessing] = useState(false);
    const ENV_NAME = import.meta.env.VITE_IS_DEV === '1' ? 'sandbox' : 'production';

    useEffect(() => {
        window.scrollTo(0, 0);
        // Load Cashfree SDK
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // Validate required data
    if (!event || !selectedTier || !ticketCount || !total) {
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
                        <button onClick={() => navigate("/events")}>Browse Events</button>
                    </div>
                </div>
            </div>
        );
    }

    const handlePayNow = async () => {
        setIsProcessing(true);
        setError("");

        // Save pending booking for payment callback
        localStorage.setItem(
            "pending_event_booking",
            JSON.stringify({ 
                event, 
                selectedTier, 
                ticketCount, 
                selectedPets, 
                formData, 
                total 
            })
        );

        try {
            const customer_data = JSON.parse(localStorage.getItem("user_data"));
            const payload = {
                action: "CREATE_PAYMENT_SESSION",
                session_id: localStorage.getItem("session_id"),
                customer_id: customer_data.id.toString().padStart(3, '0'),
                customer_phone: customer_data.phone_number,
                order_amount: total
            };

            const data = await callServicesApi(payload);
            
            if (!data.payment_session_id) {
                console.error("Missing payment_session_id", data);
                setError("Failed to create payment session. Please try again.");
                setIsProcessing(false);
                return;
            }

            const cashfree = window.Cashfree({ mode: ENV_NAME });
            cashfree.checkout({
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_self",
                returnUrl: `${window.location.origin}/payment-status?order_id={order_id}&type=event`
            });
        } catch (err) {
            console.error("Error creating payment order:", err);
            setError("Something went wrong. Please try again.");
            setIsProcessing(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString('en-IN', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Get pet names from localStorage
    const getPetName = (petId) => {
        const pets = JSON.parse(localStorage.getItem("pets") || "[]");
        const pet = pets.find(p => p.id === petId);
        return pet?.name || `Pet #${petId}`;
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

                {/* Event Info Card */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-calendar-event-fill"></i>
                        <h3>Event</h3>
                    </div>
                    <div className="booking-review-kennel">
                        <h4>{event.title}</h4>
                        <p className="event-review-venue">
                            <i className="bi bi-geo-alt"></i>
                            {event.venue}, {event.city}
                        </p>
                    </div>
                </div>

                {/* Date & Time Card */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-clock-fill"></i>
                        <h3>Date & Time</h3>
                    </div>
                    <div className="booking-review-dates">
                        <div className="booking-review-date-item">
                            <span className="booking-review-date-label">Date</span>
                            <span className="booking-review-date-value">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="booking-review-date-divider">
                            <i className="bi bi-dot"></i>
                        </div>
                        <div className="booking-review-date-item">
                            <span className="booking-review-date-label">Time</span>
                            <span className="booking-review-date-value">{formatTime(event.event_time)}</span>
                        </div>
                    </div>
                </div>

                {/* Tickets Card */}
                <div className="booking-review-card">
                    <div className="booking-review-card-header">
                        <i className="bi bi-ticket-perforated-fill"></i>
                        <h3>Tickets</h3>
                    </div>
                    <div className="event-review-tickets">
                        <div className="event-review-ticket-row">
                            <div className="event-review-ticket-info">
                                <span className="ticket-type">{selectedTier.label}</span>
                                <span className="ticket-qty">× {ticketCount}</span>
                            </div>
                            <div className="event-review-ticket-price">
                                <span className="per-ticket">₹{selectedTier.price} each</span>
                                <span className="ticket-total">₹{total}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pets Card (if required) */}
                {selectedPets && selectedPets.length > 0 && (
                    <div className="booking-review-card">
                        <div className="booking-review-card-header">
                            <i className="bi bi-heart-fill"></i>
                            <h3>Your Pets</h3>
                        </div>
                        <div className="event-review-pets">
                            {selectedPets.map((petId, index) => (
                                <div key={petId} className="event-review-pet-item">
                                    <div className="event-review-pet-badge">
                                        <i className="bi bi-check-circle-fill"></i>
                                    </div>
                                    <span>Ticket {index + 1}: {getPetName(petId)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Data Card (if any) */}
                {formData && Object.keys(formData).length > 0 && (
                    <div className="booking-review-card">
                        <div className="booking-review-card-header">
                            <i className="bi bi-card-list"></i>
                            <h3>Additional Information</h3>
                        </div>
                        <div className="event-review-form-data">
                            {Object.entries(formData).map(([key, value]) => (
                                <div key={key} className="event-review-form-item">
                                    <span className="form-label">{key}</span>
                                    <span className="form-value">
                                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Total Card */}
                <div className="booking-review-total-card">
                    <div className="booking-review-total-row">
                        <span>{selectedTier.label} × {ticketCount}</span>
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