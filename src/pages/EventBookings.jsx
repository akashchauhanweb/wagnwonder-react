import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function EventBookings() {
    // const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("upcoming");

    useEffect(() => {
        const cachedEventBookings = localStorage.getItem("event_bookings");
        if (cachedEventBookings) {
            setBookings(JSON.parse(cachedEventBookings));
            setLoading(false);
        } else {
            fetchBookings();
        }
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem("user_data"));
            const response = await callServicesApi({
                action: "GET_USER_EVENT_BOOKINGS",
                session_id: localStorage.getItem("session_id"),
                user_id: userData?.id
            });
            
            if (response?.success) {
                setBookings(response.bookings || []);
                localStorage.setItem("event_bookings", JSON.stringify(response.bookings || []));
            }
        } catch (err) {
            console.error("Error fetching event bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
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

    const isUpcoming = (eventDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(eventDate) >= today;
    };

    const filteredBookings = bookings.filter(booking => {
        if (activeFilter === "upcoming") {
            return isUpcoming(booking.event_date);
        } else {
            return !isUpcoming(booking.event_date);
        }
    });

    const getStatusBadge = (booking) => {
        if (booking.status === "cancelled") {
            return { label: "Cancelled", class: "cancelled" };
        }
        if (!isUpcoming(booking.event_date)) {
            return { label: "Completed", class: "completed" };
        }
        return { label: "Confirmed", class: "confirmed" };
    };

    return (
        <div className="event-bookings-page">
            <div className="event-bookings-header">
                <h2>Event Tickets</h2>
                <p>Your booked event tickets</p>
            </div>

            {/* Filter Tabs */}
            <div className="event-bookings-filters">
                <button
                    className={activeFilter === "upcoming" ? "active" : ""}
                    onClick={() => setActiveFilter("upcoming")}
                >
                    Upcoming
                </button>
                <button
                    className={activeFilter === "past" ? "active" : ""}
                    onClick={() => setActiveFilter("past")}
                >
                    Past
                </button>
            </div>

            {loading ? (
                <div className="event-bookings-loading">
                    <div className="spinner-border" role="status" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="event-bookings-empty">
                    <div className="event-bookings-empty-icon">
                        <i className="bi bi-ticket-perforated"></i>
                    </div>
                    <h3>No {activeFilter} tickets</h3>
                    <p>
                        {activeFilter === "upcoming" 
                            ? "When you book an event, it will appear here." 
                            : "You don't have any past event tickets."}
                    </p>
                </div>
            ) : (
                <div className="event-bookings-list">
                    {filteredBookings.map((booking) => {
                        const statusInfo = getStatusBadge(booking);
                        return (
                            <div key={booking.id} className="event-booking-card">
                                {/* Event Image */}
                                <div className="event-booking-image">
                                    {booking.event_image ? (
                                        <img src={booking.event_image} alt={booking.event_title} />
                                    ) : (
                                        <div className="event-booking-no-image">
                                            <i className="bi bi-calendar-event"></i>
                                        </div>
                                    )}
                                    <span className={`event-booking-status ${statusInfo.class}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {/* Booking Details */}
                                <div className="event-booking-details">
                                    <h4>{booking.event_title}</h4>
                                    
                                    <div className="event-booking-meta">
                                        <div className="meta-item">
                                            <i className="bi bi-calendar"></i>
                                            <span>{formatDate(booking.event_date)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <i className="bi bi-clock"></i>
                                            <span>{formatTime(booking.event_time)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <i className="bi bi-geo-alt"></i>
                                            <span>{booking.venue}, {booking.city}</span>
                                        </div>
                                    </div>

                                    <div className="event-booking-tickets">
                                        <div className="ticket-info">
                                            <span className="ticket-type">{booking.ticket_type}</span>
                                            <span className="ticket-count">× {booking.ticket_count}</span>
                                        </div>
                                        <div className="ticket-price">₹{booking.total_price}</div>
                                    </div>

                                    {booking.pets && booking.pets.length > 0 && (
                                        <div className="event-booking-pets">
                                            <i className="bi bi-heart-fill"></i>
                                            <span>
                                                {booking.pets.map(p => p.pet_name).join(", ")}
                                            </span>
                                        </div>
                                    )}

                                    <div className="event-booking-footer">
                                        <span className="booking-id">
                                            Booking ID: {booking.order_id || `EVT${booking.id}`}
                                        </span>
                                        <span className="booking-date">
                                            Booked on {formatDate(booking.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}