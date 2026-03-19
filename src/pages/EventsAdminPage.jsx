import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import { getEventBookingEmailHtml } from "../assets/js/eventBookingEmail";
import AddPetModal from "../assets/components/AddPetModal";
import AddUserModal from "../assets/components/AddUserModal";

const EventsAdminPage = () => {
    // const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const session_id = localStorage.getItem("session_id");

    const [activeTab, setActiveTab] = useState("events");
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [eventsCached, setEventsCached] = useState(false);
    const [searchEvent, setSearchEvent] = useState("");
    const [statusFilter, setStatusFilter] = useState("upcoming");
    const [, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventInfo, setEventInfo] = useState(null);

    // Registrations
    // const [registrations, setRegistrations] = useState([]);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [registrationsCached, setRegistrationsCached] = useState(false);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [registrationsSearch, setRegistrationsSearch] = useState("");
    const [registrationsEventFilter, setRegistrationsEventFilter] = useState("all");

    // Manual entry
    const [manualEventInfo, setManualEventInfo] = useState(null);
    const [manualUser, setManualUser] = useState(null);
    const [manualUserQuery, setManualUserQuery] = useState("");
    const [lookingUpUser, setLookingUpUser] = useState(false);
    const [userLookupDone, setUserLookupDone] = useState(false);
    const [userNotFound, setUserNotFound] = useState(false);
    const [manualTier, setManualTier] = useState(null);
    const [manualTicketCount, setManualTicketCount] = useState(1);
    const [manualFormData, setManualFormData] = useState({});
    const [manualPets, setManualPets] = useState([]);
    const [manualSelectedPets, setManualSelectedPets] = useState([]);
    const [loadingManualPets, setLoadingManualPets] = useState(false);
    const [loadingManualEvent, setLoadingManualEvent] = useState(false);
    const [manualSubmitting, setManualSubmitting] = useState(false);
    const [showAddPetModal, setShowAddPetModal] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        fetchManagedEvents();
    }, []);

    useEffect(() => {
        if (successMsg || errorMsg) {
            const timer = setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, errorMsg]);

    const fetchManagedEvents = async (forceRefresh = false) => {
        if (eventsCached && !forceRefresh) return;
        setLoadingEvents(true);
        try {
            const response = await callServicesApi({
                action: "GET_MANAGED_EVENTS",
                session_id,
                user_id: userData.id
            });
            if (response?.success) {
                setEvents(response.events || []);
                setEventsCached(true);
            }
        } catch (err) {
            console.error("Error fetching managed events:", err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const fetchAllRegistrations = async (forceRefresh = false) => {
        if (registrationsCached && !forceRefresh) return;
        setLoadingRegistrations(true);
        try {
            const allRegs = [];
            for (const evt of events) {
                const response = await callServicesApi({
                    action: "GET_EVENT_REGISTRATIONS",
                    session_id,
                    event_id: evt.id
                });
                if (response?.success && response.registrations?.length > 0) {
                    const regsWithEvent = response.registrations.map(reg => ({
                        ...reg,
                        event_id: evt.id,
                        event_title: evt.title
                    }));
                    allRegs.push(...regsWithEvent);
                }
            }
            setAllRegistrations(allRegs);
            setRegistrationsCached(true);
        } catch (err) {
            console.error("Error fetching registrations:", err);
        } finally {
            setLoadingRegistrations(false);
        }
    };

    const handleEventClick = (evt) => {
        setSelectedEvent(evt);
        setEventInfo(null);
        setShowEventModal(true);
        fetchEventInfo(evt.id);
    };

    const filteredEvents = events.filter(evt => {
        if (statusFilter !== "all" && evt.status !== statusFilter) return false;
        if (searchEvent.trim()) {
            const s = searchEvent.toLowerCase();
            return (
                evt.title?.toLowerCase().includes(s) ||
                evt.venue?.toLowerCase().includes(s) ||
                evt.city?.toLowerCase().includes(s)
            );
        }
        return true;
    });

    const fetchEventInfo = async (eventId) => {
        try {
            const response = await callServicesApi({
                action: "GET_EVENT_INFO",
                session_id,
                event_id: eventId
            });
            if (response?.success) {
                setEventInfo(response.event);
            }
        } catch (err) {
            console.error("Error fetching event info:", err);
        }
    };

    const filteredRegistrations = allRegistrations.filter(reg => {
        // Event filter
        if (registrationsEventFilter !== "all" && reg.event_id !== parseInt(registrationsEventFilter)) {
            return false;
        }
        // Search filter
        if (registrationsSearch.trim()) {
            const s = registrationsSearch.toLowerCase();
            return (
                reg.first_name?.toLowerCase().includes(s) ||
                reg.last_name?.toLowerCase().includes(s) ||
                reg.email?.toLowerCase().includes(s) ||
                reg.phone_number?.includes(s) ||
                reg.event_title?.toLowerCase().includes(s)
            );
        }
        return true;
    });

    // Manual entry handlers
    const handleManualEventSelect = async (eventId) => {
        if (!eventId) { setManualEventInfo(null); setManualTier(null); return; }
        setLoadingManualEvent(true);
        try {
            const response = await callServicesApi({
                action: "GET_EVENT_INFO",
                session_id,
                event_id: parseInt(eventId)
            });
            if (response?.success) {
                setManualEventInfo(response.event);
                if (response.event.pricing?.length > 0) {
                    setManualTier(response.event.pricing[0]);
                }
                setManualFormData({});
            }
        } catch (err) {
            console.error("Error fetching event info:", err);
        } finally {
            setLoadingManualEvent(false);
        }
    };

    const handleUserLookup = async () => {
        if (!manualUserQuery.trim()) return;
        setLookingUpUser(true);
        setUserNotFound(false);
        setManualUser(null);
        setUserLookupDone(false);
        try {
            const response = await callServicesApi({
                action: "LOOKUP_USER",
                session_id,
                query: manualUserQuery.trim()
            });
            if (response?.success && response.user) {
                setManualUser(response.user);
                setUserLookupDone(true);
                if (manualEventInfo?.requires_pet) {
                    fetchManualPets(response.user.id);
                }
            } else {
                setUserNotFound(true);
                setUserLookupDone(true);
            }
        } catch {
            setUserNotFound(true);
            setUserLookupDone(true);
        } finally {
            setLookingUpUser(false);
        }
    };

    const fetchManualPets = async (userId) => {
        setLoadingManualPets(true);
        setManualPets([]);
        setManualSelectedPets([]);
        try {
            const response = await callServicesApi({
                action: "GET_ALL_PETS",
                session_id
            });
            if (response?.success) {
                setManualPets((response.data || []).filter(p => p.owner_id === userId));
            }
        } catch (err) {
            console.error("Error fetching pets:", err);
        } finally {
            setLoadingManualPets(false);
        }
    };

    const handleManualPetSelect = (petId) => {
        if (manualSelectedPets.includes(petId)) {
            setManualSelectedPets(manualSelectedPets.filter(id => id !== petId));
        } else if (manualSelectedPets.length < manualTicketCount) {
            setManualSelectedPets([...manualSelectedPets, petId]);
        }
    };

    useEffect(() => {
        if (activeTab === "registrations" && events.length > 0) {
            fetchAllRegistrations();
        }
    }, [activeTab, events]);

    useEffect(() => {
        setManualSelectedPets([]);
    }, [manualTicketCount]);

    const formatDateForEmail = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatTimeForEmail = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
    };

    const handleManualSubmit = async () => {
        if (!manualEventInfo || !manualUser || !manualTier) {
            setErrorMsg("Please select event, user, and ticket type.");
            return;
        }
        if (manualEventInfo.requires_pet && manualSelectedPets.length !== manualTicketCount) {
            setErrorMsg(`Please select ${manualTicketCount} pet(s).`);
            return;
        }
        if (manualEventInfo.form_fields?.length > 0) {
            for (const field of manualEventInfo.form_fields) {
                if (field.is_required && !manualFormData[field.field_name]) {
                    setErrorMsg(`Please fill in: ${field.field_name}`);
                    return;
                }
            }
        }

        setManualSubmitting(true);
        try {
            const orderId = `MANUAL_${Date.now()}`;
            const response = await callServicesApi({
                action: "BOOK_EVENT",
                session_id,
                event_id: manualEventInfo.id,
                user_id: manualUser.id,
                pricing_id: manualTier.id,
                ticket_count: manualTicketCount,
                form_data: manualFormData,
                pets: manualSelectedPets,
                order_id: orderId,
                cf_order_id: null,
                mode: "offline"
            });

            if (response?.success) {
                try {
                    const selectedPetDetails = manualSelectedPets.map(petId => {
                        const pet = manualPets.find(p => p.id === petId);
                        return pet ? { name: pet.name, breed: pet.breed } : { name: `Pet #${petId}`, breed: '-' };
                    });
                    const emailHtml = getEventBookingEmailHtml({
                        userName: manualUser.first_name || "Guest",
                        eventTitle: manualEventInfo.title,
                        eventDate: formatDateForEmail(manualEventInfo.event_date),
                        eventTime: formatTimeForEmail(manualEventInfo.event_time),
                        venue: manualEventInfo.venue,
                        city: manualEventInfo.city,
                        ticketType: manualTier.label,
                        ticketCount: manualTicketCount,
                        totalPrice: (manualTier.price || 0) * manualTicketCount,
                        orderId: orderId,
                        transactionId: "MANUAL",
                        pets: selectedPetDetails
                    });
                    await callServicesApi({
                        action: "SEND_EMAIL",
                        session_id,
                        email: manualUser.email,
                        subject: `Booking Confirmed: ${manualEventInfo.title} - Wag N Wonder`,
                        html: emailHtml
                    });
                } catch (emailErr) {
                    console.error("Failed to send email:", emailErr);
                }

                setSuccessMsg(`Booking created! ID: ${response.booking_id}`);
                setManualEventInfo(null);
                setManualUser(null);
                setManualUserQuery("");
                setUserLookupDone(false);
                setUserNotFound(false);
                setManualTier(null);
                setManualTicketCount(1);
                setManualFormData({});
                setManualPets([]);
                setManualSelectedPets([]);
            } else {
                setErrorMsg(response?.message || "Failed to create booking.");
            }
        } catch {
            setErrorMsg("Error creating booking.");
        } finally {
            setManualSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
    };

    // Auth guard
    if (!userData || !userData.permissions?.includes("events")) {
        localStorage.clear();
        window.location.href = "/login";
        return null;
    }

    return (
        <div className="manage-events-page">
            {/* Header */}
            <div className="manage-events-header">
                <h2>Events Admin</h2>
            </div>

            {/* Submenu Tabs */}
            <div className="manage-events-submenu">
                <button
                    className={`submenu-item ${activeTab === "events" ? "active" : ""}`}
                    onClick={() => { setActiveTab("events"); setSelectedEvent(null); }}
                >
                    <i className="bi bi-calendar-event"></i>
                    My Events
                </button>
                <button
                    className={`submenu-item ${activeTab === "registrations" ? "active" : ""}`}
                    onClick={() => setActiveTab("registrations")}
                >
                    <i className="bi bi-people"></i>
                    Registrations
                </button>
                <button
                    className={`submenu-item ${activeTab === "manual" ? "active" : ""}`}
                    onClick={() => setActiveTab("manual")}
                >
                    <i className="bi bi-pencil-square"></i>
                    Manual Entry
                </button>
            </div>

            {/* Messages */}
            {successMsg && (
                <div className="manage-events-alert success">
                    <i className="bi bi-check-circle"></i> {successMsg}
                    <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}
            {errorMsg && (
                <div className="manage-events-alert error">
                    <i className="bi bi-exclamation-circle"></i> {errorMsg}
                    <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* My Events Tab */}
            {activeTab === "events" && (
                <>
                    <div className="events-filters">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchEvent}
                                onChange={(e) => setSearchEvent(e.target.value)}
                            />
                        </div>
                        <div className="status-filter">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                                <option value="all">All Events</option>
                            </select>
                        </div>
                        <button
                            className="earnings-refresh-btn"
                            onClick={() => fetchManagedEvents(true)}
                            disabled={loadingEvents}
                            style={{ marginLeft: "auto", minWidth: "unset" }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loadingEvents ? 'spinning' : ''}`}></i>
                        </button>
                    </div>
                    {loadingEvents ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-calendar-x"></i>
                            <p>No events found</p>
                        </div>
                    ) : (
                        <div className="events-grid">
                            {filteredEvents.map(evt => (
                                <div key={evt.id} className="event-admin-card" onClick={() => handleEventClick(evt)}>
                                    <div className="event-admin-card-image">
                                        {evt.image ? (
                                            <img src={evt.image} alt={evt.title} />
                                        ) : (
                                            <div className="event-admin-card-no-image">
                                                <i className="bi bi-calendar-event"></i>
                                            </div>
                                        )}
                                        <span className={`event-admin-card-status ${evt.status}`}>
                                            {evt.status}
                                        </span>
                                    </div>
                                    <div className="event-admin-card-body">
                                        <h4>{evt.title}</h4>
                                        <p><i className="bi bi-calendar me-1"></i>{formatDate(evt.event_date)}</p>
                                        <p><i className="bi bi-geo-alt me-1"></i>{evt.venue}, {evt.city}</p>
                                        <div className="event-admin-card-stats">
                                            <span><i className="bi bi-ticket me-1"></i>{evt.booked_tickets} booked</span>
                                            {evt.total_capacity && <span>/ {evt.total_capacity}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Registrations Tab */}
            {activeTab === "registrations" && (
                <>
                    <div className="events-filters">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={registrationsSearch}
                                onChange={(e) => setRegistrationsSearch(e.target.value)}
                            />
                        </div>
                        <div className="status-filter">
                            <select
                                value={registrationsEventFilter}
                                onChange={(e) => setRegistrationsEventFilter(e.target.value)}
                            >
                                <option value="all">All Events</option>
                                {events.map(evt => (
                                    <option key={evt.id} value={evt.id}>{evt.title}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="earnings-refresh-btn"
                            onClick={() => fetchAllRegistrations(true)}
                            disabled={loadingRegistrations}
                            style={{ marginLeft: "auto", minWidth: "unset" }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loadingRegistrations ? 'spinning' : ''}`}></i>
                        </button>
                    </div>

                    {loadingRegistrations ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-people"></i>
                            <p>No registrations found</p>
                        </div>
                    ) : (
                        <div className="registrations-table-wrapper">
                            <table className="registrations-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Ticket</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                        <th>Mode</th>
                                        <th>Pets</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRegistrations.map(reg => (
                                        <tr key={reg.id}>
                                            <td>{reg.event_title}</td>
                                            <td>{reg.first_name} {reg.last_name}</td>
                                            <td>{reg.email}</td>
                                            <td>{reg.phone_number}</td>
                                            <td>{reg.ticket_type}</td>
                                            <td>{reg.ticket_count}</td>
                                            <td>₹{reg.total_price}</td>
                                            <td><span className={`mode-badge ${reg.mode}`}>{reg.mode}</span></td>
                                            <td>{reg.pets?.map(p => p.name).join(", ") || "-"}</td>
                                            <td><span className={`status-badge ${reg.status}`}>{reg.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Manual Entry Tab */}
            {activeTab === "manual" && (
                <div className="manual-entry-section">
                    <div className="manual-entry-form">
                        {/* Step 1: Select Event */}
                        <div className="manual-entry-step">
                            <div className="step-header">
                                <span className="step-number">1</span>
                                <h4>Select Event</h4>
                            </div>
                            <div className="step-content">
                                <select
                                    value={manualEventInfo?.id || ""}
                                    onChange={(e) => handleManualEventSelect(e.target.value)}
                                    className="manual-entry-select"
                                    disabled={loadingManualEvent}
                                >
                                    <option value="">Choose an event...</option>
                                    {events.map(evt => (
                                        <option key={evt.id} value={evt.id}>
                                            {evt.title} - {formatDate(evt.event_date)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Step 2: Find User */}
                        {manualEventInfo && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">2</span>
                                    <h4>Find User</h4>
                                </div>
                                <div className="step-content">
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <input
                                            type="text"
                                            value={manualUserQuery}
                                            onChange={(e) => {
                                                setManualUserQuery(e.target.value);
                                                if (userLookupDone) {
                                                    setUserLookupDone(false);
                                                    setUserNotFound(false);
                                                    setManualUser(null);
                                                    setManualSelectedPets([]);
                                                }
                                            }}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleUserLookup(); }}
                                            placeholder="Enter email or phone number"
                                            className="manual-entry-select"
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            onClick={handleUserLookup}
                                            disabled={lookingUpUser || !manualUserQuery.trim()}
                                            style={{
                                                padding: "10px 20px", borderRadius: "10px", border: "1px solid #1e293b",
                                                background: "#1e293b", color: "white", fontSize: "0.85rem",
                                                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                                display: "flex", alignItems: "center", gap: "6px"
                                            }}
                                        >
                                            {lookingUpUser ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <><i className="bi bi-search"></i> Search</>
                                            )}
                                        </button>
                                    </div>

                                    {userLookupDone && manualUser && (
                                        <div style={{
                                            marginTop: "12px", padding: "14px 16px", borderRadius: "10px",
                                            background: "#f0fdf4", border: "1px solid #bbf7d0",
                                            display: "flex", alignItems: "center", justifyContent: "space-between"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{
                                                    width: "36px", height: "36px", borderRadius: "8px",
                                                    background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontWeight: 700, fontSize: "0.8rem", color: "#059669"
                                                }}>
                                                    {manualUser.first_name?.charAt(0)}{manualUser.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>
                                                        {manualUser.first_name} {manualUser.last_name}
                                                    </div>
                                                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                                        {manualUser.email} · {manualUser.phone_number}
                                                    </div>
                                                </div>
                                            </div>
                                            <i className="bi bi-check-circle-fill" style={{ color: "#059669", fontSize: "1.2rem" }}></i>
                                        </div>
                                    )}

                                    {userLookupDone && userNotFound && (
                                        <div style={{
                                            marginTop: "12px", padding: "14px 16px", borderRadius: "10px",
                                            background: "#fffbeb", border: "1px solid #fde68a"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    No user found. Would you like to register a new user?
                                                </div>
                                                <button
                                                    onClick={() => setShowAddUserModal(true)}
                                                    style={{
                                                        padding: "6px 14px", borderRadius: "8px", border: "1px solid #1e293b",
                                                        background: "#1e293b", color: "white", fontSize: "0.8rem",
                                                        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                                                        display: "flex", alignItems: "center", gap: "4px"
                                                    }}
                                                >
                                                    <i className="bi bi-person-plus"></i> Add User
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Select Ticket Type */}
                        {manualTier && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">3</span>
                                    <h4>Select Ticket Type</h4>
                                </div>
                                <div className="step-content">
                                    <div className="manual-entry-tiers">
                                        {manualEventInfo.pricing.map(tier => (
                                            <button
                                                key={tier.id}
                                                className={`tier-btn ${manualTier?.id === tier.id ? 'selected' : ''}`}
                                                onClick={() => setManualTier(tier)}
                                            >
                                                <span className="tier-label">{tier.label}</span>
                                                <span className="tier-price">₹{tier.price}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Ticket Count */}
                        {manualTier && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">4</span>
                                    <h4>Number of Tickets</h4>
                                </div>
                                <div className="step-content">
                                    <div className="manual-entry-counter">
                                        <button
                                            onClick={() => setManualTicketCount(Math.max(1, manualTicketCount - 1))}
                                            disabled={manualTicketCount <= 1}
                                        >
                                            <i className="bi bi-dash"></i>
                                        </button>
                                        <span>{manualTicketCount}</span>
                                        <button
                                            onClick={() => setManualTicketCount(manualTicketCount + 1)}
                                        >
                                            <i className="bi bi-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Pets */}
                        {manualTier && manualEventInfo?.requires_pet === 1 && manualUser && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">5</span>
                                    <h4>Select Pets ({manualSelectedPets.length}/{manualTicketCount})</h4>
                                </div>
                                <div className="step-content">
                                    {loadingManualPets ? (
                                        <div className="manual-entry-loading">
                                            <div className="spinner-border spinner-border-sm"></div>
                                        </div>
                                    ) : manualPets.length === 0 ? (
                                        <div className="manual-entry-no-pets">
                                            <p>No pets found for this user.</p>
                                            <button onClick={() => setShowAddPetModal(true)}>
                                                <i className="bi bi-plus"></i> Add Pet
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="manual-entry-pets">
                                            {manualPets.map(pet => (
                                                <button
                                                    key={pet.id}
                                                    className={`pet-select-btn ${manualSelectedPets.includes(pet.id) ? 'selected' : ''}`}
                                                    onClick={() => handleManualPetSelect(pet.id)}
                                                    disabled={!manualSelectedPets.includes(pet.id) && manualSelectedPets.length >= manualTicketCount}
                                                >
                                                    <i className={`bi ${manualSelectedPets.includes(pet.id) ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                                    <div className="pet-info">
                                                        <span className="pet-name">{pet.name}</span>
                                                        <span className="pet-breed">{pet.breed}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            <button className="pet-add-btn" onClick={() => setShowAddPetModal(true)}>
                                                <i className="bi bi-plus"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 6: Custom Form Fields */}
                        {manualTier && manualEventInfo?.form_fields?.length > 0 && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">{manualEventInfo.requires_pet === 1 ? '6' : '5'}</span>
                                    <h4>Additional Information</h4>
                                </div>
                                <div className="step-content">
                                    <div className="manual-entry-fields">
                                        {manualEventInfo.form_fields.map(field => (
                                            <div key={field.id} className="manual-field">
                                                <label>
                                                    {field.field_name}
                                                    {field.is_required === 1 && <span className="required">*</span>}
                                                </label>
                                                {field.field_type === "select" ? (
                                                    <select
                                                        value={manualFormData[field.field_name] || ""}
                                                        onChange={(e) => setManualFormData({ ...manualFormData, [field.field_name]: e.target.value })}
                                                    >
                                                        <option value="">Select...</option>
                                                        {(typeof field.field_options === 'string' ? JSON.parse(field.field_options) : field.field_options || []).map((opt, idx) => (
                                                            <option key={idx} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.field_type || "text"}
                                                        value={manualFormData[field.field_name] || ""}
                                                        onChange={(e) => setManualFormData({ ...manualFormData, [field.field_name]: e.target.value })}
                                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary & Submit */}
                        {manualTier && (
                            <div className="manual-entry-summary">
                                <div className="summary-details">
                                    <div className="summary-row">
                                        <span>Event</span>
                                        <span>{manualEventInfo?.title}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>User</span>
                                        <span>{manualUser?.first_name} {manualUser?.last_name}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Ticket Type</span>
                                        <span>{manualTier?.label}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Quantity</span>
                                        <span>{manualTicketCount}</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Total</span>
                                        <span>₹{(manualTier?.price || 0) * manualTicketCount}</span>
                                    </div>
                                </div>
                                <button
                                    className="manual-entry-submit"
                                    onClick={handleManualSubmit}
                                    disabled={manualSubmitting}
                                >
                                    {manualSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm"></span>
                                            Creating Booking...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle"></i>
                                            Create Booking
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Event Info Modal */}
            {showEventModal && (
                <div className="event-modal-overlay" onClick={() => { setShowEventModal(false); setEventInfo(null); }}>
                    <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="event-modal-header">
                            <h3>Event Details</h3>
                            <button onClick={() => { setShowEventModal(false); setEventInfo(null); }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="event-modal-body">
                            {eventInfo ? (
                                <>
                                    {/* Images */}
                                    {eventInfo.images?.length > 0 && (
                                        <div className="modal-event-images">
                                            {eventInfo.images.map((img, idx) => (
                                                <img key={idx} src={img.image_url} alt={img.alt_text} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Basic Info */}
                                    <div className="modal-section">
                                        <h4>{eventInfo.title}</h4>
                                        <span className={`status-badge ${eventInfo.status}`}>{eventInfo.status}</span>
                                        {eventInfo.description && <p className="description">{eventInfo.description}</p>}
                                    </div>

                                    {/* Date & Location */}
                                    <div className="modal-section info-grid">
                                        <div className="info-item">
                                            <i className="bi bi-calendar"></i>
                                            <span>{formatDate(eventInfo.event_date)}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-clock"></i>
                                            <span>{formatTime(eventInfo.event_time)}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-geo-alt"></i>
                                            <span>{eventInfo.venue}, {eventInfo.city}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-ticket"></i>
                                            <span>
                                                {eventInfo.booked_tickets} booked
                                                {eventInfo.total_capacity && ` / ${eventInfo.total_capacity}`}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-calendar-x"></i>
                                            <span>Booking closes: {formatDate(eventInfo.booking_stop_date)}</span>
                                        </div>
                                        <div className="info-item">
                                            <i className="bi bi-heart"></i>
                                            <span>Pet required: {eventInfo.requires_pet ? "Yes" : "No"}</span>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    {eventInfo.pricing?.length > 0 && (
                                        <div className="modal-section">
                                            <h5>Pricing Tiers</h5>
                                            <div className="pricing-list">
                                                {eventInfo.pricing.map((tier) => (
                                                    <div key={tier.id} className="pricing-item">
                                                        <span className="tier-label">{tier.label}</span>
                                                        <span className="tier-price">₹{tier.price}</span>
                                                        <span className="tier-sold">{tier.sold || 0} sold</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Form Fields */}
                                    {eventInfo.form_fields?.length > 0 && (
                                        <div className="modal-section">
                                            <h5>Custom Form Fields</h5>
                                            <div className="form-fields-list">
                                                {eventInfo.form_fields.map((field) => (
                                                    <div key={field.id} className="field-item">
                                                        <span>{field.field_name}</span>
                                                        <span className="field-type">{field.field_type}</span>
                                                        {field.is_required ? <span className="required-badge">Required</span> : null}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button - View Registrations only */}
                                    <div className="modal-actions">
                                        <button
                                            className="btn-view-registrations"
                                            onClick={() => {
                                                setShowEventModal(false);
                                                setEventInfo(null);
                                                setRegistrationsEventFilter(String(eventInfo.id));
                                                setRegistrationsSearch("");
                                                setActiveTab("registrations");
                                                fetchAllRegistrations(true);
                                            }}
                                        >
                                            <i className="bi bi-people"></i>
                                            View Registrations ({eventInfo.booked_tickets || 0})
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="modal-loading">
                                    <div className="spinner-border" role="status"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <AddUserModal
                    session_id={session_id}
                    onClose={() => setShowAddUserModal(false)}
                    onUserCreated={async (userId) => {
                        setSuccessMsg("User created successfully.");
                        setShowAddUserModal(false);
                        if (userId) {
                            setLookingUpUser(true);
                            const response = await callServicesApi({
                                action: "LOOKUP_USER",
                                session_id,
                                user_id: userId
                            });
                            if (response?.success && response.user) {
                                setManualUser(response.user);
                                setManualUserQuery(response.user.email);
                                setUserLookupDone(true);
                                setUserNotFound(false);
                                if (manualEventInfo?.requires_pet) {
                                    fetchManualPets(userId);
                                }
                            }
                            setLookingUpUser(false);
                        }
                    }}
                />
            )}

            {/* Add Pet Modal */}
            {showAddPetModal && manualUser && (
                <AddPetModal
                    onClose={() => setShowAddPetModal(false)}
                    onSaved={() => {
                        setShowAddPetModal(false);
                        if (manualUser) fetchManualPets(manualUser.id);
                    }}
                    userId={manualUser.id}
                />
            )}
        </div>
    );
};

export default EventsAdminPage;