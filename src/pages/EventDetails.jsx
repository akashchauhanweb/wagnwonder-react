import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import AddPetModal from "../assets/components/AddPetModal";

export default function EventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const carouselRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState(null);
    const [ticketCount, setTicketCount] = useState(1);
    const [selectedPets, setSelectedPets] = useState([]);
    const [petList, setPetList] = useState([]);
    const [loadingPets, setLoadingPets] = useState(false);
    const [formData, setFormData] = useState({});
    const [showAddPetModal, setShowAddPetModal] = useState(false);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState("");
    const [descExpanded, setDescExpanded] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        const sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            // Save the intended destination and redirect to login
            localStorage.setItem("redirect_after_login", `/events/${eventId}`);
            navigate("/login");
            return;
        }
        fetchEventDetails();
    }, [eventId, navigate]);

    useEffect(() => {
        if (carouselRef.current && window.bootstrap && event?.images?.length > 1) {
            const carousel = new window.bootstrap.Carousel(carouselRef.current, {
                interval: 4000,
                ride: 'carousel',
                touch: true
            });
            return () => carousel.dispose();
        }
    }, [event]);

    useEffect(() => {
        if (event?.requires_pet) {
            loadPets();
        }
    }, [event]);

    // Reset selected pets when ticket count changes
    useEffect(() => {
        setSelectedPets([]);
    }, [ticketCount]);

    const fetchEventDetails = async () => {
        setLoading(true);
        try {
            const response = await callServicesApi({
                action: "GET_EVENT_INFO",
                session_id: localStorage.getItem("session_id"),
                event_id: parseInt(eventId)
            });
            if (response?.success) {
                setEvent(response.event);
                // Auto-select first available pricing tier
                const validTiers = getValidPricingTiers(response.event.pricing);
                const today = new Date().toISOString().split('T')[0];
                const availableTier = validTiers.find(tier => !tier.valid_from || tier.valid_from <= today);
                if (availableTier) {
                    setSelectedTier(availableTier);
                }
            }
        } catch (err) {
            console.error("Error fetching event:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadPets = async () => {
        setLoadingPets(true);
        try {
            const res = await callServicesApi({
                action: "FETCH_PET_LIST",
                session_id: localStorage.getItem("session_id"),
            });
            const list = res.pet_list ?? res.data ?? [];
            const petArray = Array.isArray(list) ? list : [];
            setPetList(petArray);
            // Store in localStorage for use in booking confirmation email
            localStorage.setItem("pets", JSON.stringify(petArray));
        } catch (err) {
            console.error("Error fetching pets:", err);
        }
        setLoadingPets(false);
    };

    const getValidPricingTiers = (pricing) => {
        if (!pricing) return [];
        const today = new Date().toISOString().split('T')[0];
        
        return pricing.filter(tier => {
            // Only filter out expired tiers
            if (tier.valid_until && tier.valid_until < today) return false;
            // Check if tier is sold out
            if (tier.max_tickets && tier.sold >= tier.max_tickets) return false;
            return true;
        });
    };

    const isTierAvailable = (tier) => {
        const today = new Date().toISOString().split('T')[0];
        if (tier.valid_from && tier.valid_from > today) return false;
        return true;
    };

    const formatShortDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short"
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
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

    const isBookingOpen = () => {
        if (!event || event.status !== "upcoming") return false;
        const today = new Date().toISOString().split('T')[0];
        return today <= event.booking_stop_date;
    };

    const getAvailableTickets = () => {
        if (!event?.total_capacity) return null;
        return event.total_capacity - (event.booked_tickets || 0);
    };

    const getTierAvailability = (tier) => {
        if (!tier.max_tickets) return null;
        return tier.max_tickets - (tier.sold || 0);
    };

    const handlePetSelect = (petId) => {
        setSelectedPets(prev => {
            if (prev.includes(petId)) {
                return prev.filter(id => id !== petId);
            }
            if (prev.length < ticketCount) {
                return [...prev, petId];
            }
            // Replace oldest selection
            const [, ...rest] = prev;
            return [...rest, petId];
        });
    };

    const handleFormChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const calculateTotal = () => {
        if (!selectedTier) return 0;
        return selectedTier.price * ticketCount;
    };

    const validateBooking = () => {
        if (!selectedTier) {
            setError("Please select a ticket type.");
            return false;
        }

        // Check capacity
        const available = getAvailableTickets();
        if (available !== null && ticketCount > available) {
            setError(`Only ${available} tickets available.`);
            return false;
        }

        // Check tier availability
        const tierAvailable = getTierAvailability(selectedTier);
        if (tierAvailable !== null && ticketCount > tierAvailable) {
            setError(`Only ${tierAvailable} tickets available for ${selectedTier.label}.`);
            return false;
        }

        // Check pet selection
        if (event.requires_pet && selectedPets.length !== ticketCount) {
            setError(`Please select ${ticketCount} pet(s) for your tickets.`);
            return false;
        }

        // Validate required form fields
        if (event.form_fields) {
            for (const field of event.form_fields) {
                if (field.is_required && !formData[field.field_name]) {
                    setError(`Please fill in ${field.field_name}.`);
                    return false;
                }
            }
        }

        setError("");
        return true;
    };

    const handleBooking = async () => {
        const sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            localStorage.setItem("pending_event_booking", JSON.stringify({
                eventId,
                selectedTier,
                ticketCount,
                formData
            }));
            return navigate("/login");
        }

        if (!validateBooking()) return;

        setBooking(true);
        try {
            // For now, navigate to a booking review or directly process
            // This will integrate with Cashfree similar to boarding
            navigate("/event-booking-review", {
                state: {
                    event,
                    selectedTier,
                    ticketCount,
                    selectedPets,
                    formData,
                    total: calculateTotal()
                }
            });
        // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="event-details-page">
                <div className="event-details-loading">
                    <div className="spinner-border" role="status"></div>
                    <p>Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-page">
                <div className="event-details-empty">
                    <i className="bi bi-calendar-x"></i>
                    <h3>Event not found</h3>
                    <button onClick={() => navigate("/events")}>
                        <i className="bi bi-arrow-left"></i> Back to Events
                    </button>
                </div>
            </div>
        );
    }

    const validTiers = getValidPricingTiers(event.pricing);
    const bookingOpen = isBookingOpen();
    const availableTickets = getAvailableTickets();
    const images = event.images || [];

    return (
        <div className="event-details-page">
            {/* Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <button className="page-header-back-btn" onClick={() => navigate("/events")}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h1>Event Details</h1>
                </div>
            </div>

            <div className="event-details-container">
                {/* Image Carousel */}
                {images.length > 0 && (
                    <div className="event-details-carousel">
                        <div
                            ref={carouselRef}
                            id={`event-carousel-${eventId}`}
                            className="carousel slide"
                        >
                            {images.length > 1 && (
                                <div className="carousel-indicators">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            data-bs-target={`#event-carousel-${eventId}`}
                                            data-bs-slide-to={idx}
                                            className={idx === 0 ? "active" : ""}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="carousel-inner">
                                {images.map((img, idx) => (
                                    <div key={idx} className={`carousel-item${idx === 0 ? " active" : ""}`}>
                                        <img src={img.image_url} alt={img.alt_text || event.title} />
                                    </div>
                                ))}
                            </div>
                            {images.length > 1 && (
                                <>
                                    <button className="carousel-control-prev" type="button" data-bs-target={`#event-carousel-${eventId}`} data-bs-slide="prev">
                                        <span className="carousel-control-prev-icon"></span>
                                    </button>
                                    <button className="carousel-control-next" type="button" data-bs-target={`#event-carousel-${eventId}`} data-bs-slide="next">
                                        <span className="carousel-control-next-icon"></span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Event Info */}
                <div className="event-details-info">
                    <div className="event-details-title-row">
                        <h2>{event.title}</h2>
                        {!bookingOpen && event.status === "upcoming" && (
                            <span className="event-details-badge closed">Booking Closed</span>
                        )}
                        {event.status === "past" && (
                            <span className="event-details-badge past">Past Event</span>
                        )}
                    </div>

                    <div className="event-details-meta">
                        <div className="event-meta-item">
                            <i className="bi bi-calendar-event"></i>
                            <span>{formatDate(event.event_date)}</span>
                        </div>
                        <div className="event-meta-item">
                            <i className="bi bi-clock"></i>
                            <span>{formatTime(event.event_time)}</span>
                        </div>
                        <div className="event-meta-item">
                            <i className="bi bi-geo-alt"></i>
                            <span>{event.venue}, {event.city}, {event.state}</span>
                        </div>
                        {event.requires_pet === 1 && (
                            <div className="event-meta-item highlight">
                                <i className="bi bi-heart"></i>
                                <span>Bring your pet!</span>
                            </div>
                        )}
                    </div>

                    {event.description && (
                        <div className="event-details-description">
                            <h4>About this event</h4>
                            <p className={descExpanded ? "expanded" : "collapsed"}>
                                {event.description}
                            </p>
                            {event.description.length > 200 && (
                                <button 
                                    className="desc-read-more-btn"
                                    onClick={() => setDescExpanded(!descExpanded)}
                                >
                                    {descExpanded ? "Show less" : "Read more"}
                                    <i className={`bi bi-chevron-${descExpanded ? "up" : "down"}`}></i>
                                </button>
                            )}
                        </div>
                    )}

                    {availableTickets !== null && (
                        <div className="event-details-capacity">
                            <i className="bi bi-ticket-perforated"></i>
                            <span>
                                {availableTickets > 0 
                                    ? `${availableTickets} tickets remaining` 
                                    : "Sold Out"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Booking Section */}
                {bookingOpen && availableTickets !== 0 && (
                    <div className="event-booking-section">
                        <h3>Book Tickets</h3>

                        {/* Pricing Tiers */}
                        <div className="event-pricing-tiers">
                            <label>Select Ticket Type</label>
                            <div className="pricing-tier-options">
                                {validTiers.map((tier) => {
                                    const tierAvailable = getTierAvailability(tier);
                                    const isAvailable = isTierAvailable(tier);
                                    return (
                                        <button
                                            key={tier.id}
                                            className={`pricing-tier-btn ${selectedTier?.id === tier.id ? "selected" : ""} ${!isAvailable ? "upcoming" : ""}`}
                                            onClick={() => isAvailable && setSelectedTier(tier)}
                                            disabled={!isAvailable}
                                        >
                                            <span className="tier-name">{tier.label}</span>
                                            <span className="tier-price">₹{tier.price}</span>
                                            {!isAvailable ? (
                                                <span className="tier-upcoming">From {formatShortDate(tier.valid_from)}</span>
                                            ) : tierAvailable !== null ? (
                                                <span className="tier-available">{tierAvailable} left</span>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Ticket Count */}
                        <div className="event-ticket-count">
                            <label>Number of Tickets</label>
                            <div className="ticket-counter">
                                <button
                                    onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                                    disabled={ticketCount <= 1}
                                >
                                    <i className="bi bi-dash"></i>
                                </button>
                                <span>{ticketCount}</span>
                                <button
                                    onClick={() => setTicketCount(ticketCount + 1)}
                                    disabled={availableTickets !== null && ticketCount >= availableTickets}
                                >
                                    <i className="bi bi-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Pet Selection */}
                        {event.requires_pet === 1 && (
                            <div className="event-pet-selection">
                                <label>Select Your {ticketCount === 1 ? "Pet" : "Pets"} ({selectedPets.length}/{ticketCount})</label>
                                {loadingPets ? (
                                    <div className="pet-loading">
                                        <div className="spinner-border spinner-border-sm"></div>
                                    </div>
                                ) : petList.length === 0 ? (
                                    <div className="no-pets">
                                        <p>You haven't added any pets yet.</p>
                                        <button onClick={() => setShowAddPetModal(true)}>
                                            <i className="bi bi-plus"></i> Add Pet
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pet-options">
                                        {petList.map((pet) => (
                                            <button
                                                key={pet.id}
                                                className={`pet-option-btn ${selectedPets.includes(pet.id) ? "selected" : ""}`}
                                                onClick={() => handlePetSelect(pet.id)}
                                            >
                                                <i className={`bi ${selectedPets.includes(pet.id) ? "bi-check-circle-fill" : "bi-circle"}`}></i>
                                                <span>{pet.name}</span>
                                                <small>{pet.breed}</small>
                                            </button>
                                        ))}
                                        <button className="pet-add-btn" onClick={() => setShowAddPetModal(true)}>
                                            <i className="bi bi-plus"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Custom Form Fields */}
                        {event.form_fields?.length > 0 && (
                            <div className="event-form-fields">
                                <label>Additional Information</label>
                                {event.form_fields.map((field) => (
                                    <div key={field.id} className="form-field-item">
                                        <label>
                                            {field.field_name}
                                            {field.is_required === 1 && <span className="required">*</span>}
                                        </label>
                                        {field.field_type === "select" ? (
                                            <select
                                                value={formData[field.field_name] || ""}
                                                onChange={(e) => handleFormChange(field.field_name, e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {(typeof field.field_options === 'string' 
                                                    ? JSON.parse(field.field_options) 
                                                    : field.field_options || []
                                                ).map((opt, idx) => (
                                                    <option key={idx} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : field.field_type === "checkbox" ? (
                                            <label className="checkbox-field">
                                                <input
                                                    type="checkbox"
                                                    checked={formData[field.field_name] || false}
                                                    onChange={(e) => handleFormChange(field.field_name, e.target.checked)}
                                                />
                                                <span>Yes</span>
                                            </label>
                                        ) : (
                                            <input
                                                type={field.field_type}
                                                value={formData[field.field_name] || ""}
                                                onChange={(e) => handleFormChange(field.field_name, e.target.value)}
                                                placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="event-booking-error">
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        {/* Total & Book Button */}
                        <div className="event-booking-footer">
                            <div className="event-total">
                                <span>Total</span>
                                <span className="total-amount">₹{calculateTotal()}</span>
                            </div>
                            <button
                                className="event-book-btn"
                                onClick={handleBooking}
                                disabled={booking}
                            >
                                {booking ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Book Now
                                        <i className="bi bi-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Closed/Past Event Message */}
                {(!bookingOpen || availableTickets === 0) && (
                    <div className="event-booking-closed">
                        <i className="bi bi-calendar-x"></i>
                        <h4>
                            {availableTickets === 0 
                                ? "This event is sold out" 
                                : event.status === "past" 
                                    ? "This event has ended" 
                                    : "Booking has closed for this event"}
                        </h4>
                        <button onClick={() => navigate("/events")}>
                            Browse Other Events
                        </button>
                    </div>
                )}
            </div>

            {/* Add Pet Modal */}
            {showAddPetModal && (
                <AddPetModal
                    limit={ticketCount - selectedPets.length}
                    onClose={() => setShowAddPetModal(false)}
                    onSaved={() => {
                        setShowAddPetModal(false);
                        loadPets();
                    }}
                />
            )}
        </div>
    );
}