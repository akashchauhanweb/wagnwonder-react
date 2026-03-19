import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

export default function CrecheBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("user_data") || "{}");
            const payload = {
                action: "GET_BOOKINGS",
                session_id: localStorage.getItem("session_id"),
                user_id: user.id,
            };
            const res = await callServicesApi(payload);
            if (res.success) {
                setBookings(res.bookings);
                localStorage.setItem("bookings", JSON.stringify(res.bookings));
            } else {
                setError(res.message || "Failed to fetch bookings.");
            }
        } catch {
            setError("Error fetching bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cachedBookings = localStorage.getItem("bookings");
        if (cachedBookings) {
            setBookings(JSON.parse(cachedBookings));
            setLoading(false);
        } else {
            fetchBookings();
        }
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'booked': return 'status-booked';
            case 'checked_in': return 'status-checked-in';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    return (
        <div className="creche-bookings">
            <div className="bookings-header">
                <h2>Your Bookings</h2>
                {!loading && <span className="bookings-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>}
            </div>

            {loading ? (
                <div className="bookings-loading">
                    <div className="spinner-border" role="status" />
                </div>
            ) : error ? (
                <div className="bookings-error">
                    <i className="bi bi-exclamation-circle"></i>
                    <p>{error}</p>
                </div>
            ) : bookings.length === 0 ? (
                <div className="bookings-empty">
                    <div className="bookings-empty-icon">
                        <i className="bi bi-calendar-x"></i>
                    </div>
                    <h3>No bookings yet</h3>
                    <p>When you book a stay for your pet, it will appear here.</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking) => {
                        const isActive = booking.status === "booked" || booking.status === "checked_in";
                        const isCompleted = booking.status === "completed";
                        const isCancelled = booking.status === "cancelled";

                        return (
                            <div key={booking.booking_id} className={`booking-card ${isCancelled ? "booking-card-cancelled" : ""}`}>
                                {/* Top accent bar */}
                                <div className={`booking-card-accent ${isActive ? "accent-active" : isCompleted ? "accent-completed" : "accent-cancelled"}`}></div>

                                <div className="booking-card-inner">
                                    {/* Header: Kennel + Status + ID */}
                                    <div className="booking-card-header">
                                        <div className="booking-kennel">
                                            <div className="booking-kennel-icon">
                                                <i className="bi bi-house-heart-fill"></i>
                                            </div>
                                            <div>
                                                <span className="booking-kennel-name">{booking.kennel_name}</span>
                                                <span className="booking-id-inline">#{booking.booking_id}</span>
                                            </div>
                                        </div>
                                        <span className={`booking-status ${getStatusColor(booking.status)}`}>
                                            {booking.status === "checked_in" ? "Checked In" : booking.status}
                                        </span>
                                    </div>

                                    {/* Stay details grid */}
                                    <div className="booking-stay-grid">
                                        <div className="booking-stay-item">
                                            <i className="bi bi-box-arrow-in-right"></i>
                                            <div>
                                                <span className="stay-label">Check-in</span>
                                                <span className="stay-value">{formatDate(booking.check_in_date)}</span>
                                            </div>
                                        </div>
                                        <div className="booking-stay-item">
                                            <i className="bi bi-box-arrow-right"></i>
                                            <div>
                                                <span className="stay-label">Check-out</span>
                                                <span className="stay-value">{formatDate(booking.check_out_date)}</span>
                                            </div>
                                        </div>
                                        <div className="booking-stay-item">
                                            <i className="bi bi-moon-fill"></i>
                                            <div>
                                                <span className="stay-label">Duration</span>
                                                <span className="stay-value">{booking.days} night{booking.days !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pets */}
                                    <div className="booking-pets-section">
                                        {booking.pets.map((pet) => (
                                            <div key={pet.pet_id} className="booking-pet-chip">
                                                <div className="pet-chip-avatar">
                                                    {pet.pet_photo ? (
                                                        <img src={pet.pet_photo} alt={pet.pet_name} />
                                                    ) : (
                                                        <i className="bi bi-heart-pulse-fill"></i>
                                                    )}
                                                </div>
                                                <div className="pet-chip-info">
                                                    <span className="pet-chip-name">{pet.pet_name}</span>
                                                    <span className="pet-chip-breed">{pet.pet_breed}</span>
                                                </div>
                                                <span className="pet-chip-price">₹{pet.total_price}</span>
                                            </div>
                                        ))}

                                        {/* Consolidated extension line */}
                                        {booking.extensions?.length > 0 && (() => {
                                            const totalExtraDays = booking.extensions.reduce((sum, ext) => sum + ext.extra_days, 0);
                                            const totalAmount = booking.extensions.reduce((sum, ext) => sum + parseFloat(ext.amount), 0);
                                            const paidCount = booking.extensions.filter(ext => ext.payment_status === "paid").length;
                                            const totalCount = booking.extensions.length;

                                            let paymentLabel, paymentColor;
                                            if (paidCount === totalCount) {
                                                paymentLabel = "Paid";
                                                paymentColor = "#059669";
                                            } else if (paidCount > 0) {
                                                paymentLabel = "Partially Paid";
                                                paymentColor = "#d97706";
                                            } else {
                                                paymentLabel = "Not Paid";
                                                paymentColor = "#dc2626";
                                            }

                                            return (
                                                <div className="booking-extension-chip">
                                                    <div className="extension-chip-icon">
                                                        <i className="bi bi-calendar-plus"></i>
                                                    </div>
                                                    <div className="pet-chip-info">
                                                        <span className="pet-chip-name">Extension (+{totalExtraDays} night{totalExtraDays !== 1 ? 's' : ''})</span>
                                                        <span className="pet-chip-breed" style={{ color: paymentColor }}>{paymentLabel}</span>
                                                    </div>
                                                    <span className="pet-chip-price">₹{totalAmount.toFixed(2)}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Footer: Total */}
                                    <div className="booking-footer">
                                        <div className="booking-mode">
                                            <i className={`bi ${booking.mode === "online" ? "bi-globe" : "bi-shop"}`}></i>
                                            {booking.mode === "online" ? "Online" : "Offline"}
                                        </div>
                                        <div className="booking-total">
                                            <span>Total</span>
                                            <span className="total-amount">₹{booking.total_price}</span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    {!isCompleted && !isCancelled && (
                                        <div className="booking-actions">
                                            {booking.kennel_lat && booking.kennel_lng && (
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${booking.kennel_lat},${booking.kennel_lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="booking-action-btn"
                                                >
                                                    <i className="bi bi-geo-alt"></i>
                                                    Get Directions
                                                </a>
                                            )}
                                            {booking.owner_phone && (
                                                <a
                                                    href={`tel:${booking.owner_phone}`}
                                                    className="booking-action-btn"
                                                >
                                                    <i className="bi bi-telephone"></i>
                                                    Call Kennel
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}