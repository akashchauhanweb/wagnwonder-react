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
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="bookings-loading">
                <div className="spinner-border" role="status" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bookings-error">
                <i className="bi bi-exclamation-circle"></i>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="creche-bookings">
            <div className="bookings-header">
                <h2>Your Bookings</h2>
                <span className="bookings-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
            </div>

            {bookings.length === 0 ? (
                <div className="bookings-empty">
                    <div className="bookings-empty-icon">
                        <i className="bi bi-calendar-x"></i>
                    </div>
                    <h3>No bookings yet</h3>
                    <p>When you book a stay for your pet, it will appear here.</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking) => (
                        <div key={booking.booking_id} className="booking-card">
                            <div className="booking-card-header">
                                <div className="booking-kennel">
                                    <i className="bi bi-house-heart-fill"></i>
                                    <span>{booking.kennel_name}</span>
                                </div>
                                <span className={`booking-status ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="booking-details-card">
                                <div className="booking-id-row">
                                    <span className="booking-id-label">Booking ID:</span>
                                    <span className="booking-id-value">#{booking.booking_id}</span>
                                </div>
                                <div className="booking-pets-row">
                                    <span className="booking-pets-label">For:</span>
                                    {booking.pets.map((pet) => (
                                        <span key={pet.pet_id} className="booking-pet-tag">
                                            <i className="bi bi-paw"></i>
                                            {pet.pet_name}
                                        </span>
                                    ))}
                                </div>
                                <div className="booking-dates">
                                    <div className="booking-date">
                                        <span className="date-label">Check-in</span>
                                        <span className="date-value">{formatDate(booking.check_in_date)}</span>
                                    </div>
                                    <div className="booking-date-arrow">
                                        <i className="bi bi-arrow-right"></i>
                                    </div>
                                    <div className="booking-date">
                                        <span className="date-label">Check-out</span>
                                        <span className="date-value">{formatDate(booking.check_out_date)}</span>
                                    </div>
                                    <div className="booking-nights">
                                        <i className="bi bi-moon-fill"></i>
                                        {booking.days} night{booking.days !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>

                            <div className="booking-footer">
                                <div className="booking-total">
                                    <span>Total</span>
                                    <span className="total-amount">₹{booking.total_price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}