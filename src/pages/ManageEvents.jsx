import React, { useState, useRef, useEffect } from "react";
import { imageCompressor } from "../assets/js/imageCompressor";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { callServicesApi } from "../assets/js/servicesApi";
import stateCityMap from "../assets/js/stateCityMap";

const ManageEvents = () => {
    const [activeTab, setActiveTab] = useState("list");
    const [eventsList, setEventsList] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [searchEvent, setSearchEvent] = useState("");
    const [statusFilter, setStatusFilter] = useState("upcoming");
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    // Modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventInfo, setEventInfo] = useState(null);
    const [showImageOrderModal, setShowImageOrderModal] = useState(false);
    const [pendingImages, setPendingImages] = useState([]);

    // All registrations tab
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [allRegistrationsCache, setAllRegistrationsCache] = useState({});
    const [loadingAllRegistrations, setLoadingAllRegistrations] = useState(false);
    const [registrationsEventFilter, setRegistrationsEventFilter] = useState("all");
    const [registrationsSearch, setRegistrationsSearch] = useState("");

    // Delete confirmation
    const [deletingEventId, setDeletingEventId] = useState(null);

    const session_id = localStorage.getItem("session_id");
    const fileInputRef = useRef(null);
    const stateCityMapJson = stateCityMap();

    // Form state
    const [eventForm, setEventForm] = useState({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        venue: "",
        city: "",
        state: "",
        total_capacity: "",
        requires_pet: false,
        booking_stop_date: "",
        images: [],
    });

    // Pricing tiers
    const [pricingTiers, setPricingTiers] = useState([
        { label: "", price: "", valid_from: "", valid_until: "", max_tickets: "" }
    ]);

    // Custom form fields
    const [formFields, setFormFields] = useState([]);

    const cityOptions = eventForm.state
        ? Object.keys(stateCityMapJson[eventForm.state] || {})
        : [];

    // Fetch events
    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await callServicesApi({
                action: "GET_EVENTS",
                session_id,
                status: statusFilter
            });
            if (response?.success) {
                setEventsList(response.events || []);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [statusFilter]);

    useEffect(() => {
        if (activeTab === "registrations") {
            // Clear cache if we want fresh data when switching to this tab
            // Or keep cache for performance - currently keeping cache
            fetchAllRegistrations();
        }
    }, [activeTab]);

    // Fetch single event details
    const fetchEventInfo = async (eventId) => {
        setEventInfo(null);
        setShowEventModal(true);
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

    // Fetch all registrations for all events
    const fetchAllRegistrations = async () => {
        if (Object.keys(allRegistrationsCache).length > 0) {
            // Use cached data
            return;
        }

        setLoadingAllRegistrations(true);
        try {
            // First, fetch all events (both upcoming and past)
            const eventsResponse = await callServicesApi({
                action: "GET_EVENTS",
                session_id,
                status: "all"
            });

            if (!eventsResponse?.success || !eventsResponse.events?.length) {
                setLoadingAllRegistrations(false);
                return;
            }

            const events = eventsResponse.events;
            const cache = {};
            const allRegs = [];

            // Fetch registrations for each event
            for (const event of events) {
                try {
                    const regResponse = await callServicesApi({
                        action: "GET_EVENT_REGISTRATIONS",
                        session_id,
                        event_id: event.id
                    });

                    if (regResponse?.success && regResponse.registrations?.length > 0) {
                        // Add event info to each registration
                        const regsWithEventInfo = regResponse.registrations.map(reg => ({
                            ...reg,
                            event_id: event.id,
                            event_title: event.title
                        }));

                        cache[event.id] = {
                            event: { id: event.id, title: event.title },
                            registrations: regsWithEventInfo,
                            stats: regResponse.stats,
                            ticket_breakdown: regResponse.ticket_breakdown
                        };

                        allRegs.push(...regsWithEventInfo);
                    }
                } catch (err) {
                    console.error(`Error fetching registrations for event ${event.id}:`, err);
                }
            }

            setAllRegistrationsCache(cache);
            setAllRegistrations(allRegs);
        } catch (err) {
            console.error("Error fetching all registrations:", err);
        } finally {
            setLoadingAllRegistrations(false);
        }
    };

    // Get filtered registrations based on selected event and search
    const getFilteredRegistrations = () => {
        let filtered = registrationsEventFilter === "all"
            ? allRegistrations
            : allRegistrationsCache[Number(registrationsEventFilter)]?.registrations || [];

        // Apply search filter
        if (registrationsSearch.trim()) {
            const search = registrationsSearch.toLowerCase();
            filtered = filtered.filter(reg =>
                reg.first_name?.toLowerCase().includes(search) ||
                reg.last_name?.toLowerCase().includes(search) ||
                reg.email?.toLowerCase().includes(search) ||
                reg.phone_number?.includes(search) ||
                reg.event_title?.toLowerCase().includes(search)
            );
        }

        return filtered;
    };

    // Get unique events from cached registrations for filter dropdown
    const getEventsForFilter = () => {
        return Object.values(allRegistrationsCache).map(item => ({
            id: String(item.event.id),
            title: item.event.title
        }));
    };

    // Parse form_data JSON string
    const parseFormData = (formDataStr) => {
        if (!formDataStr) return {};
        try {
            return JSON.parse(formDataStr);
        } catch {
            return {};
        }
    };

    // Get all unique form field keys from registrations
    const getFormFieldKeys = () => {
        const keys = new Set();
        const registrations = getFilteredRegistrations();
        registrations.forEach(reg => {
            const formData = parseFormData(reg.form_data);
            Object.keys(formData).forEach(key => keys.add(key));
        });
        return Array.from(keys);
    };

    // Download registrations as CSV
    const downloadCSV = () => {
        const registrations = getFilteredRegistrations();
        if (registrations.length === 0) return;

        const formFieldKeys = getFormFieldKeys();

        // Define headers
        const headers = [
            "Order ID",
            "CF Order ID",
            "Event",
            "User ID",
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "Ticket Type",
            "Ticket Price",
            "Qty",
            "Total Amount",
            "Mode",
            "Pet Name",
            "Pet Breed",
            "Pet Age",
            "Pet Weight",
            ...formFieldKeys,
            "Status",
            "Booked On"
        ];

        // Build rows
        const rows = registrations.map(reg => {
            const formData = parseFormData(reg.form_data);
            const pet = reg.pets?.[0] || null;

            return [
                reg.order_id || `#${reg.id}`,
                reg.cf_order_id || "",
                reg.event_title || "",
                reg.user_id || "",
                reg.first_name || "",
                reg.last_name || "",
                reg.email || "",
                reg.phone_number || "",
                reg.ticket_type || "",
                reg.ticket_price || "",
                reg.ticket_count || "",
                reg.total_price || "",
                reg.mode || "",
                pet?.name || "",
                pet?.breed || "",
                pet?.age ? `${pet.age} yr` : "",
                pet?.weight || "",
                ...formFieldKeys.map(key => formData[key] || ""),
                reg.status || "",
                formatDate(reg.created_at) || ""
            ];
        });

        // Convert to CSV string
        const escapeCSV = (value) => {
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `event_registrations_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Delete event
    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            return;
        }

        setDeletingEventId(eventId);
        try {
            const response = await callServicesApi({
                action: "DELETE_EVENT",
                session_id,
                event_id: eventId
            });

            if (response?.success) {
                setSuccessMsg(response.message);
                setShowEventModal(false);
                setEventInfo(null);
                fetchEvents();
            } else {
                setErrorMsg(response?.message || "Failed to delete event.");
            }
        } catch (err) {
            setErrorMsg("Error deleting event.");
            console.error(err);
        } finally {
            setDeletingEventId(null);
        }
    };

    // Image handling
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const imagesWithPreview = files.map((file, index) => ({
            file,
            preview: URL.createObjectURL(file),
            order: index
        }));

        setPendingImages(imagesWithPreview);
        setShowImageOrderModal(true);
    };

    const moveImage = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pendingImages.length) return;

        const updated = [...pendingImages];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);
        updated.forEach((img, idx) => img.order = idx);
        setPendingImages(updated);
    };

    const handleConfirmImageOrder = () => {
        const orderedFiles = pendingImages.map(img => img.file);
        setEventForm(prev => ({ ...prev, images: orderedFiles }));
        setShowImageOrderModal(false);
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    };

    const handleCancelImageOrder = () => {
        setShowImageOrderModal(false);
        setPendingImages([]);
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Pricing tier handlers
    const addPricingTier = () => {
        setPricingTiers([...pricingTiers, { label: "", price: "", valid_from: "", valid_until: "", max_tickets: "" }]);
    };

    const removePricingTier = (index) => {
        if (pricingTiers.length > 1) {
            setPricingTiers(pricingTiers.filter((_, i) => i !== index));
        }
    };

    const updatePricingTier = (index, field, value) => {
        const updated = [...pricingTiers];
        updated[index][field] = value;
        setPricingTiers(updated);
    };

    // Form field handlers
    const addFormField = () => {
        setFormFields([...formFields, { field_name: "", field_type: "text", options: "", is_required: false }]);
    };

    const removeFormField = (index) => {
        setFormFields(formFields.filter((_, i) => i !== index));
    };

    const updateFormField = (index, field, value) => {
        const updated = [...formFields];
        updated[index][field] = value;
        setFormFields(updated);
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
            // Upload images
            const imageUrls = [];
            if (eventForm.images.length > 0) {
                setUploadProgress({ current: 0, total: eventForm.images.length });

                for (let i = 0; i < eventForm.images.length; i++) {
                    const file = eventForm.images[i];
                    const compressedFile = await imageCompressor(file, 1);
                    const uploadedUrl = await uploadImageToS3(
                        compressedFile,
                        `events/${Date.now()}_${i}`,
                        session_id
                    );
                    if (uploadedUrl) {
                        imageUrls.push({ url: uploadedUrl, alt_text: eventForm.title });
                    }
                    setUploadProgress({ current: i + 1, total: eventForm.images.length });
                }
            }

            // Prepare pricing data
            const pricing = pricingTiers
                .filter(t => t.label && t.price)
                .map(t => ({
                    label: t.label,
                    price: parseFloat(t.price),
                    valid_from: t.valid_from || null,
                    valid_until: t.valid_until || null,
                    max_tickets: t.max_tickets ? parseInt(t.max_tickets) : null
                }));

            if (pricing.length === 0) {
                setErrorMsg("At least one pricing tier is required.");
                setSubmitting(false);
                return;
            }

            // Prepare form fields data
            const form_fields = formFields
                .filter(f => f.field_name)
                .map(f => ({
                    field_name: f.field_name,
                    field_type: f.field_type,
                    options: f.field_type === 'select' && f.options
                        ? f.options.split(',').map(o => o.trim())
                        : null,
                    is_required: f.is_required ? 1 : 0
                }));

            const payload = {
                action: "CREATE_EVENT",
                session_id,
                user_id: JSON.parse(localStorage.getItem("user_data"))?.id,
                title: eventForm.title,
                description: eventForm.description,
                event_date: eventForm.event_date,
                event_time: eventForm.event_time,
                venue: eventForm.venue,
                city: eventForm.city,
                state: eventForm.state,
                total_capacity: eventForm.total_capacity ? parseInt(eventForm.total_capacity) : null,
                requires_pet: eventForm.requires_pet ? 1 : 0,
                booking_stop_date: eventForm.booking_stop_date,
                images: imageUrls,
                pricing,
                form_fields
            };

            const response = await callServicesApi(payload);

            if (response?.success) {
                setSuccessMsg("Event created successfully!");
                resetForm();
                setActiveTab("list");
                fetchEvents();
            } else {
                setErrorMsg(response?.message || "Failed to create event.");
            }
        } catch (err) {
            setErrorMsg("An error occurred while creating the event.");
            console.error(err);
        } finally {
            setSubmitting(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const resetForm = () => {
        setEventForm({
            title: "",
            description: "",
            event_date: "",
            event_time: "",
            venue: "",
            city: "",
            state: "",
            total_capacity: "",
            requires_pet: false,
            booking_stop_date: "",
            images: [],
        });
        setPricingTiers([{ label: "", price: "", valid_from: "", valid_until: "", max_tickets: "" }]);
        setFormFields([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Filter events
    const filteredEvents = eventsList.filter(evt =>
        evt.title.toLowerCase().includes(searchEvent.toLowerCase()) ||
        evt.city.toLowerCase().includes(searchEvent.toLowerCase())
    );

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

    return (
        <div className="manage-events-page">
            {/* Header */}
            <div className="manage-events-header">
                <h2>Manage Events</h2>
                <span className="manage-events-count">{eventsList.length} event{eventsList.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Submenu Tabs */}
            <div className="manage-events-submenu">
                <button
                    className={`submenu-item ${activeTab === "list" ? "active" : ""}`}
                    onClick={() => setActiveTab("list")}
                >
                    <i className="bi bi-list-ul"></i>
                    View Events
                </button>
                <button
                    className={`submenu-item ${activeTab === "add" ? "active" : ""}`}
                    onClick={() => setActiveTab("add")}
                >
                    <i className="bi bi-plus-circle"></i>
                    Add Event
                </button>
                <button
                    className={`submenu-item ${activeTab === "registrations" ? "active" : ""}`}
                    onClick={() => setActiveTab("registrations")}
                >
                    <i className="bi bi-people"></i>
                    Registrations
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

            {/* Events List Tab */}
            {activeTab === "list" && (
                <div className="events-list-section">
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
                            {filteredEvents.map((evt) => (
                                <div
                                    key={evt.id}
                                    className="event-card"
                                    onClick={() => fetchEventInfo(evt.id)}
                                >
                                    <div className="event-card-image">
                                        {evt.images?.[0] ? (
                                            <img src={evt.images[0].image_url} alt={evt.title} />
                                        ) : (
                                            <div className="no-image">
                                                <i className="bi bi-image"></i>
                                            </div>
                                        )}
                                        <span className={`event-status-badge ${evt.status}`}>
                                            {evt.status}
                                        </span>
                                    </div>
                                    <div className="event-card-body">
                                        <h4>{evt.title}</h4>
                                        <div className="event-meta">
                                            <span><i className="bi bi-calendar"></i> {formatDate(evt.event_date)}</span>
                                            <span><i className="bi bi-clock"></i> {formatTime(evt.event_time)}</span>
                                        </div>
                                        <div className="event-meta">
                                            <span><i className="bi bi-geo-alt"></i> {evt.city}, {evt.state}</span>
                                        </div>
                                        <div className="event-stats">
                                            <span>
                                                <i className="bi bi-ticket"></i>
                                                {evt.booked_tickets} booked
                                                {evt.total_capacity && ` / ${evt.total_capacity}`}
                                            </span>
                                            {evt.pricing?.[0] && (
                                                <span className="price">
                                                    From ₹{evt.pricing[0].price}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* Registrations Tab */}
            {activeTab === "registrations" && (
                <div className="registrations-tab-section">
                    {/* Filters */}
                    <div className="events-filters">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={registrationsSearch || ""}
                                onChange={(e) => setRegistrationsSearch(e.target.value)}
                            />
                        </div>
                        <div className="status-filter">
                            <select
                                value={registrationsEventFilter}
                                onChange={(e) => setRegistrationsEventFilter(e.target.value)}
                            >
                                <option value="all">All Events</option>
                                {getEventsForFilter().map(event => (
                                    <option key={event.id} value={event.id}>{event.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    {!loadingAllRegistrations && allRegistrations.length > 0 && (
                        <div className="registrations-tab-stats">
                            <div className="stat-card">
                                <span className="stat-value">{getFilteredRegistrations().length}</span>
                                <span className="stat-label">Total Bookings</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">
                                    {registrationsEventFilter !== "all" && !registrationsSearch.trim() && allRegistrationsCache[registrationsEventFilter]?.stats
                                        ? allRegistrationsCache[Number(registrationsEventFilter)]?.stats?.total_tickets || 0
                                        : getFilteredRegistrations().reduce((sum, r) => sum + (r.ticket_count || 0), 0)
                                    }
                                </span>
                                <span className="stat-label">Total Tickets</span>
                            </div>
                            <div className="stat-card highlight">
                                <span className="stat-value">
                                    ₹{registrationsEventFilter !== "all" && !registrationsSearch.trim() && allRegistrationsCache[registrationsEventFilter]?.stats
                                        ? allRegistrationsCache[Number(registrationsEventFilter)]?.stats?.total_revenue || 0
                                        : getFilteredRegistrations().reduce((sum, r) => sum + (r.total_price || 0), 0)
                                    }
                                </span>
                                <span className="stat-label">Total Revenue</span>
                            </div>
                        </div>
                    )}

                    {/* Registrations List */}
                    {loadingAllRegistrations ? (
                        <div className="registrations-tab-loading">
                            <div className="spinner-border" role="status"></div>
                            <p>Loading registrations...</p>
                        </div>
                    ) : getFilteredRegistrations().length === 0 ? (
                        <div className="registrations-tab-empty">
                            <i className="bi bi-inbox"></i>
                            <h3>No registrations found</h3>
                            <p>{registrationsEventFilter === "all" ? "No event registrations yet." : "No registrations for this event."}</p>
                        </div>
                    ) : (
                        <>
                            <div className="registrations-table-header">
                                <span className="registrations-count">
                                    {getFilteredRegistrations().length} registration{getFilteredRegistrations().length !== 1 ? "s" : ""}
                                </span>
                                <button className="download-csv-btn" onClick={downloadCSV}>
                                    <i className="bi bi-download"></i>
                                    Download as CSV
                                </button>
                            </div>
                            <div className="registrations-table-wrapper">
                                <table className="registrations-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>CF Order ID</th>
                                            <th>Event</th>
                                            <th>User ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Ticket Type</th>
                                            <th>Ticket Price</th>
                                            <th>Qty</th>
                                            <th>Total Amount</th>
                                            <th>Mode</th>
                                            <th>Pet Name</th>
                                            <th>Pet Breed</th>
                                            <th>Pet Age</th>
                                            <th>Pet Weight</th>
                                            {getFormFieldKeys().map(key => (
                                                <th key={key}>{key}</th>
                                            ))}
                                            <th>Status</th>
                                            <th>Booked On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredRegistrations().map((reg) => {
                                            const formData = parseFormData(reg.form_data);
                                            const pet = reg.pets?.[0] || null;
                                            return (
                                                <tr key={reg.id}>
                                                    <td className="order-id">{reg.order_id || `#${reg.id}`}</td>
                                                    <td className="cf-order-id">{reg.cf_order_id || "-"}</td>
                                                    <td className="event-name">{reg.event_title}</td>
                                                    <td className="user-id">{reg.user_id}</td>
                                                    <td className="user-name">{reg.first_name} {reg.last_name}</td>
                                                    <td className="email">{reg.email}</td>
                                                    <td className="phone">{reg.phone_number}</td>
                                                    <td className="ticket-type">{reg.ticket_type}</td>
                                                    <td className="ticket-price">₹{reg.ticket_price}</td>
                                                    <td className="qty">{reg.ticket_count}</td>
                                                    <td className="amount">₹{reg.total_price}</td>
                                                    <td className="mode">{reg.mode || "-"}</td>
                                                    <td className="pet-name">{pet?.name || "-"}</td>
                                                    <td className="pet-breed">{pet?.breed || "-"}</td>
                                                    <td className="pet-age">{pet?.age ? `${pet.age} yr` : "-"}</td>
                                                    <td className="pet-weight">{pet?.weight || "-"}</td>
                                                    {getFormFieldKeys().map(key => (
                                                        <td key={key} className="form-field">{formData[key] || "-"}</td>
                                                    ))}
                                                    <td><span className={`registration-status ${reg.status}`}>{reg.status}</span></td>
                                                    <td className="date">{formatDate(reg.created_at)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Add Event Tab */}
            {activeTab === "add" && (
                <div className="add-event-section">
                    <form onSubmit={handleSubmit}>
                        {/* Basic Info */}
                        <div className="form-section">
                            <h3><i className="bi bi-info-circle"></i> Basic Information</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Event Title *</label>
                                    <input
                                        type="text"
                                        value={eventForm.title}
                                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                        required
                                        placeholder="Enter event title"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        placeholder="Enter event description"
                                        rows={4}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Event Date *</label>
                                    <input
                                        type="date"
                                        value={eventForm.event_date}
                                        onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Event Time *</label>
                                    <input
                                        type="time"
                                        value={eventForm.event_time}
                                        onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Booking Stop Date *</label>
                                    <input
                                        type="date"
                                        value={eventForm.booking_stop_date}
                                        onChange={(e) => setEventForm({ ...eventForm, booking_stop_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total Capacity (leave blank for unlimited)</label>
                                    <input
                                        type="number"
                                        value={eventForm.total_capacity}
                                        onChange={(e) => setEventForm({ ...eventForm, total_capacity: e.target.value })}
                                        placeholder="e.g., 100"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="form-section">
                            <h3><i className="bi bi-geo-alt"></i> Location</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Venue *</label>
                                    <input
                                        type="text"
                                        value={eventForm.venue}
                                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                        required
                                        placeholder="Enter venue name/address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State *</label>
                                    <select
                                        value={eventForm.state}
                                        onChange={(e) => setEventForm({ ...eventForm, state: e.target.value, city: "" })}
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {Object.keys(stateCityMapJson).sort().map((state) => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>City *</label>
                                    <select
                                        value={eventForm.city}
                                        onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                                        required
                                        disabled={!eventForm.state}
                                    >
                                        <option value="">Select City</option>
                                        {cityOptions.sort().map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pet Requirement */}
                        <div className="form-section">
                            <h3><i className="bi bi-heart"></i> Pet Requirement</h3>
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={eventForm.requires_pet}
                                        onChange={(e) => setEventForm({ ...eventForm, requires_pet: e.target.checked })}
                                    />
                                    <span>Requires pet selection (1 pet per ticket)</span>
                                </label>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="form-section">
                            <h3><i className="bi bi-images"></i> Event Banners</h3>
                            <div className="form-group">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="file-input"
                                />
                                {eventForm.images.length > 0 && (
                                    <p className="file-count">{eventForm.images.length} image(s) selected</p>
                                )}
                            </div>
                        </div>

                        {/* Pricing Tiers */}
                        <div className="form-section">
                            <h3><i className="bi bi-currency-rupee"></i> Pricing Tiers</h3>
                            {pricingTiers.map((tier, index) => (
                                <div key={index} className="pricing-tier-row">
                                    <div className="tier-inputs">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g., Early Bird, VIP)"
                                            value={tier.label}
                                            onChange={(e) => updatePricingTier(index, "label", e.target.value)}
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price (₹)"
                                            value={tier.price}
                                            onChange={(e) => updatePricingTier(index, "price", e.target.value)}
                                            required
                                            min="0"
                                        />
                                        <input
                                            type="date"
                                            placeholder="Valid From"
                                            value={tier.valid_from}
                                            onChange={(e) => updatePricingTier(index, "valid_from", e.target.value)}
                                            title="Valid From (optional)"
                                        />
                                        <input
                                            type="date"
                                            placeholder="Valid Until"
                                            value={tier.valid_until}
                                            onChange={(e) => updatePricingTier(index, "valid_until", e.target.value)}
                                            title="Valid Until (optional)"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max Tickets"
                                            value={tier.max_tickets}
                                            onChange={(e) => updatePricingTier(index, "max_tickets", e.target.value)}
                                            min="1"
                                            title="Max tickets for this tier (optional)"
                                        />
                                    </div>
                                    {pricingTiers.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-tier-btn"
                                            onClick={() => removePricingTier(index)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="add-tier-btn" onClick={addPricingTier}>
                                <i className="bi bi-plus-lg"></i> Add Pricing Tier
                            </button>
                        </div>

                        {/* Custom Form Fields */}
                        <div className="form-section">
                            <h3><i className="bi bi-ui-checks"></i> Custom Form Fields (Optional)</h3>
                            <p className="form-hint">Add custom fields that users will fill when booking</p>
                            {formFields.map((field, index) => (
                                <div key={index} className="form-field-row">
                                    <input
                                        type="text"
                                        placeholder="Field Name"
                                        value={field.field_name}
                                        onChange={(e) => updateFormField(index, "field_name", e.target.value)}
                                    />
                                    <select
                                        value={field.field_type}
                                        onChange={(e) => updateFormField(index, "field_type", e.target.value)}
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                        <option value="number">Number</option>
                                        <option value="select">Dropdown</option>
                                        <option value="checkbox">Checkbox</option>
                                    </select>
                                    {field.field_type === "select" && (
                                        <input
                                            type="text"
                                            placeholder="Options (comma separated)"
                                            value={field.options}
                                            onChange={(e) => updateFormField(index, "options", e.target.value)}
                                        />
                                    )}
                                    <label className="checkbox-label small">
                                        <input
                                            type="checkbox"
                                            checked={field.is_required}
                                            onChange={(e) => updateFormField(index, "is_required", e.target.checked)}
                                        />
                                        Required
                                    </label>
                                    <button
                                        type="button"
                                        className="remove-field-btn"
                                        onClick={() => removeFormField(index)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="add-field-btn" onClick={addFormField}>
                                <i className="bi bi-plus-lg"></i> Add Form Field
                            </button>
                        </div>

                        {/* Submit */}
                        <div className="form-actions">
                            {uploadProgress.total > 0 && (
                                <div className="upload-progress">
                                    Uploading images: {uploadProgress.current} / {uploadProgress.total}
                                </div>
                            )}
                            <button type="button" className="btn-cancel" onClick={resetForm}>
                                Reset
                            </button>
                            <button type="submit" className="btn-submit" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg"></i>
                                        Create Event
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Image Order Modal */}
            {showImageOrderModal && (
                <div className="image-order-modal-overlay" onClick={handleCancelImageOrder}>
                    <div className="image-order-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="image-order-modal-header">
                            <h3>Arrange Image Order</h3>
                            <p>First image will be the main banner</p>
                            <button className="modal-close-btn" onClick={handleCancelImageOrder}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="image-order-modal-body">
                            <div className="image-order-list">
                                {pendingImages.map((img, index) => (
                                    <div key={index} className="image-order-item">
                                        <div className="image-order-number">{index + 1}</div>
                                        <img src={img.preview} alt={`Preview ${index + 1}`} />
                                        <div className="image-order-name">{img.file.name}</div>
                                        <div className="image-order-actions">
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <i className="bi bi-chevron-up"></i>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, 'down')}
                                                disabled={index === pendingImages.length - 1}
                                            >
                                                <i className="bi bi-chevron-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="image-order-modal-footer">
                            <button type="button" className="btn-cancel" onClick={handleCancelImageOrder}>
                                Cancel
                            </button>
                            <button type="button" className="btn-confirm" onClick={handleConfirmImageOrder}>
                                <i className="bi bi-check-lg"></i> Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Detail Modal */}
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

                                    {/* Action Buttons */}
                                    <div className="modal-actions">
                                        <button
                                            className="btn-view-registrations"
                                            onClick={() => {
                                                setShowEventModal(false);
                                                setEventInfo(null);
                                                setRegistrationsEventFilter(String(eventInfo.id));
                                                setRegistrationsSearch("");
                                                setActiveTab("registrations");
                                            }}
                                        >
                                            <i className="bi bi-people"></i>
                                            View Registrations ({eventInfo.booked_tickets || 0})
                                        </button>
                                        <button
                                            className="btn-delete-event"
                                            onClick={() => handleDeleteEvent(eventInfo.id)}
                                            disabled={deletingEventId === eventInfo.id}
                                        >
                                            {deletingEventId === eventInfo.id ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <i className="bi bi-trash"></i>
                                            )}
                                            Delete Event
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
        </div>
    );
};

export default ManageEvents;