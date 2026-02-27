import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import { getTokenFromApi } from "../assets/js/getToken";


export default function Events() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [allEventsCache, setAllEventsCache] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("upcoming");

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEvents();
    }, [activeFilter]);

    const fetchEvents = async () => {
        // If cache exists, just filter from it
        if (allEventsCache) {
            const filtered = activeFilter === "all"
                ? allEventsCache
                : allEventsCache.filter(evt => evt.status === activeFilter);
            setEvents(filtered);
            return;
        }

        setLoading(true);
        try {
            let payload = {
                action: "GET_EVENTS",
                status: "all"
            };

            const token = await getTokenFromApi(payload);
            if (token) {
                payload.token = token;
            }

            const response = await callServicesApi(payload);
            if (response?.success) {
                const allEvents = response.events || [];
                setAllEventsCache(allEvents);
                const filtered = activeFilter === "all"
                    ? allEvents
                    : allEvents.filter(evt => evt.status === activeFilter);
                setEvents(filtered);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const getLowestPrice = (pricing) => {
        if (!pricing || pricing.length === 0) return null;
        const today = new Date().toISOString().split('T')[0];
        
        // Filter valid pricing tiers
        const validPricing = pricing.filter(tier => {
            if (tier.valid_from && tier.valid_from > today) return false;
            if (tier.valid_until && tier.valid_until < today) return false;
            return true;
        });
        
        if (validPricing.length === 0) return pricing[0]?.price;
        return Math.min(...validPricing.map(t => t.price));
    };

    const isBookingOpen = (event) => {
        if (event.status !== "upcoming") return false;
        const today = new Date().toISOString().split('T')[0];
        return today <= event.booking_stop_date;
    };

    const getAvailableTickets = (event) => {
        if (!event.total_capacity) return null;
        return event.total_capacity - (event.booked_tickets || 0);
    };

    return (
        <div className="events-page">
            {/* Hero Section */}
            <div className="events-hero">
                <div className="events-hero-content">
                    <h1>Pet Events</h1>
                    <p>Discover exciting events for you and your furry friends</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="events-container">
                <div className="events-filter-tabs">
                    <button
                        className={activeFilter === "upcoming" ? "active" : ""}
                        onClick={() => setActiveFilter("upcoming")}
                    >
                        <i className="bi bi-calendar-check"></i>
                        Upcoming
                    </button>
                    <button
                        className={activeFilter === "past" ? "active" : ""}
                        onClick={() => setActiveFilter("past")}
                    >
                        <i className="bi bi-calendar-x"></i>
                        Past Events
                    </button>
                </div>

                {/* Events List */}
                {loading ? (
                    <div className="events-loading">
                        <div className="spinner-border" role="status"></div>
                        <p>Loading events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="events-empty">
                        <i className="bi bi-calendar-heart"></i>
                        <h3>No {activeFilter} events</h3>
                        <p>
                            {activeFilter === "upcoming" 
                                ? "Check back soon for exciting pet events!" 
                                : "No past events to show."}
                        </p>
                    </div>
                ) : (
                    <div className="events-list">
                        {events.map((event) => {
                            const lowestPrice = getLowestPrice(event.pricing);
                            const availableTickets = getAvailableTickets(event);
                            const bookingOpen = isBookingOpen(event);
                            
                            return (
                                <div 
                                    key={event.id} 
                                    className="event-list-card"
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    {/* Image */}
                                    <div className="event-list-image">
                                        {event.images?.[0] ? (
                                            <img src={event.images[0].image_url} alt={event.title} />
                                        ) : (
                                            <div className="event-list-no-image">
                                                <i className="bi bi-calendar-event"></i>
                                            </div>
                                        )}
                                        {event.status === "upcoming" && !bookingOpen && (
                                            <span className="event-list-badge closed">Booking Closed</span>
                                        )}
                                        {event.status === "past" && (
                                            <span className="event-list-badge past">Past Event</span>
                                        )}
                                        {availableTickets !== null && availableTickets <= 10 && availableTickets > 0 && bookingOpen && (
                                            <span className="event-list-badge limited">Only {availableTickets} left!</span>
                                        )}
                                        {availableTickets === 0 && (
                                            <span className="event-list-badge soldout">Sold Out</span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="event-list-content">
                                        <div className="event-list-date">
                                            <span className="event-list-day">
                                                {new Date(event.event_date).getDate()}
                                            </span>
                                            <span className="event-list-month">
                                                {new Date(event.event_date).toLocaleDateString("en-IN", { month: "short" })}
                                            </span>
                                        </div>
                                        
                                        <div className="event-list-details">
                                            <h3>{event.title}</h3>
                                            <div className="event-list-meta">
                                                <span>
                                                    <i className="bi bi-clock"></i>
                                                    {formatTime(event.event_time)}
                                                </span>
                                                <span>
                                                    <i className="bi bi-geo-alt"></i>
                                                    {event.city}
                                                </span>
                                                {event.requires_pet === 1 && (
                                                    <span className="event-pet-tag">
                                                        <i className="bi bi-heart"></i>
                                                        Pet Event
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="event-list-action">
                                            {lowestPrice && (
                                                <div className="event-list-price">
                                                    <span className="price-label">From</span>
                                                    <span className="price-value">₹{lowestPrice}</span>
                                                </div>
                                            )}
                                            <button className="event-list-btn">
                                                {bookingOpen ? "View Details" : "View"}
                                                <i className="bi bi-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}