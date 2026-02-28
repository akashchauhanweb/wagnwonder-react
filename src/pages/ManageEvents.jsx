import React, { useState, useRef, useEffect } from "react";
import { imageCompressor } from "../assets/js/imageCompressor";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { callServicesApi } from "../assets/js/servicesApi";
import stateCityMap from "../assets/js/stateCityMap";
import AddPetModal from "../assets/components/AddPetModal";
import { getEventBookingEmailHtml } from "../assets/js/eventBookingEmail";
import { getWelcomeUserEmailHtml } from "../assets/js/welcomeUserEmail";

const ManageEvents = () => {
    const [activeTab, setActiveTab] = useState("list");
    const [eventsList, setEventsList] = useState([]);
    const [allEventsCache, setAllEventsCache] = useState(null);
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

    // Manual entry states
    const [manualEntryEvent, setManualEntryEvent] = useState(null);
    const [manualEntryUser, setManualEntryUser] = useState(null);
    const [manualEntryUsers, setManualEntryUsers] = useState([]);
    const [manualEntryPets, setManualEntryPets] = useState([]);
    const [manualEntrySelectedPets, setManualEntrySelectedPets] = useState([]);
    const [manualEntryTier, setManualEntryTier] = useState(null);
    const [manualEntryTicketCount, setManualEntryTicketCount] = useState(1);
    const [manualEntryFormData, setManualEntryFormData] = useState({});
    const [manualEntryLoading, setManualEntryLoading] = useState(false);
    const [manualEntrySubmitting, setManualEntrySubmitting] = useState(false);
    const [loadingManualUsers, setLoadingManualUsers] = useState(false);
    const [loadingManualPets, setLoadingManualPets] = useState(false);
    const [showManualAddPetModal, setShowManualAddPetModal] = useState(false);
    const [showManualAddUser, setShowManualAddUser] = useState(false);
    const [addingManualUser, setAddingManualUser] = useState(false);
    const [manualNewUserForm, setManualNewUserForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password_hashed: "",
        user_type: "client",
        has_admin_access: false,
        has_boarding_access: false,
        has_services_access: false,
        has_clinic_access: false,
    });

    const session_id = localStorage.getItem("session_id");
    const fileInputRef = useRef(null);
    const stateCityMapJson = stateCityMap();

    // Helper to format date for email
    const formatDateForEmail = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    // Helper to format time for email
    const formatTimeForEmail = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

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

    // Fetch all events once and cache
    const fetchEvents = async (forceRefresh = false) => {
        // If cache exists and no force refresh, just filter from cache
        if (allEventsCache && !forceRefresh) {
            const filtered = statusFilter === "all"
                ? allEventsCache
                : allEventsCache.filter(evt => evt.status === statusFilter);
            setEventsList(filtered);
            return;
        }

        setLoadingEvents(true);
        try {
            const response = await callServicesApi({
                action: "GET_EVENTS",
                session_id,
                status: "all"
            });
            if (response?.success) {
                const allEvents = response.events || [];
                setAllEventsCache(allEvents);
                const filtered = statusFilter === "all"
                    ? allEvents
                    : allEvents.filter(evt => evt.status === statusFilter);
                setEventsList(filtered);
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

    // Fetch users for manual entry
    const fetchManualEntryUsers = async () => {
        setLoadingManualUsers(true);
        try {
            const response = await callServicesApi({
                action: "GET_ALL_USERS",
                session_id
            });
            if (response?.success) {
                setManualEntryUsers(response.data || []);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoadingManualUsers(false);
        }
    };

    // Fetch pets for selected user
    const fetchManualEntryPets = async (userId) => {
        setLoadingManualPets(true);
        setManualEntryPets([]);
        setManualEntrySelectedPets([]);
        try {
            const response = await callServicesApi({
                action: "GET_ALL_PETS",
                session_id
            });
            if (response?.success) {
                // Filter pets by owner_id
                const userPets = (response.data || []).filter(pet => pet.owner_id === userId);
                setManualEntryPets(userPets);
            }
        } catch (err) {
            console.error("Error fetching pets:", err);
        } finally {
            setLoadingManualPets(false);
        }
    };

    // Handle user selection for manual entry
    const handleManualUserSelect = (userId) => {
        const user = manualEntryUsers.find(u => u.id === parseInt(userId));
        setManualEntryUser(user || null);
        setManualEntrySelectedPets([]);
        if (user && manualEntryEvent?.requires_pet) {
            fetchManualEntryPets(user.id);
        }
    };

    // Handle event selection for manual entry
    const handleManualEventSelect = async (eventId) => {
        if (!eventId) {
            setManualEntryEvent(null);
            setManualEntryTier(null);
            return;
        }
        setManualEntryLoading(true);
        try {
            const response = await callServicesApi({
                action: "GET_EVENT_INFO",
                session_id,
                event_id: parseInt(eventId)
            });
            if (response?.success) {
                setManualEntryEvent(response.event);
                // Auto-select first pricing tier
                if (response.event.pricing?.length > 0) {
                    setManualEntryTier(response.event.pricing[0]);
                }
                // Reset form data for custom fields
                setManualEntryFormData({});
            }
        } catch (err) {
            console.error("Error fetching event info:", err);
        } finally {
            setManualEntryLoading(false);
        }
    };

    // Handle pet selection for manual entry
    const handleManualPetSelect = (petId) => {
        if (manualEntrySelectedPets.includes(petId)) {
            setManualEntrySelectedPets(manualEntrySelectedPets.filter(id => id !== petId));
        } else if (manualEntrySelectedPets.length < manualEntryTicketCount) {
            setManualEntrySelectedPets([...manualEntrySelectedPets, petId]);
        }
    };

    // Reset manual entry form
    const resetManualEntryForm = () => {
        setManualEntryEvent(null);
        setManualEntryUser(null);
        setManualEntryPets([]);
        setManualEntrySelectedPets([]);
        setManualEntryTier(null);
        setManualEntryTicketCount(1);
        setManualEntryFormData({});
    };

    // Handle pet added in manual entry
    const handleManualPetAdded = () => {
        setShowManualAddPetModal(false);
        if (manualEntryUser) {
            fetchManualEntryPets(manualEntryUser.id);
        }
    };

    // Handle adding new user in manual entry
    const handleManualAddNewUser = async () => {
        if (!manualNewUserForm.first_name || !manualNewUserForm.email || !manualNewUserForm.password_hashed) {
            setErrorMsg("Please fill in required fields: First Name, Email, and Password.");
            return;
        }
        
        setAddingManualUser(true);
        
        // Store password before sending
        const plainPassword = manualNewUserForm.password_hashed;
        
        const res = await callServicesApi({
            action: "ADD_USER",
            session_id,
            ...manualNewUserForm
        });
        
        if (res?.success) {
            // Send welcome email
            try {
                const emailHtml = getWelcomeUserEmailHtml({
                    firstName: manualNewUserForm.first_name,
                    lastName: manualNewUserForm.last_name,
                    email: manualNewUserForm.email,
                    phoneNumber: manualNewUserForm.phone_number,
                    password: plainPassword
                });
                
                await callServicesApi({
                    action: "SEND_EMAIL",
                    session_id,
                    email: manualNewUserForm.email,
                    subject: "Welcome to Wag N Wonder - Your Account Details",
                    html: emailHtml
                });
            } catch (emailErr) {
                console.error("Failed to send welcome email:", emailErr);
            }
            
            setSuccessMsg("User added successfully.");
            
            // Reset form
            setManualNewUserForm({
                first_name: "",
                last_name: "",
                email: "",
                phone_number: "",
                password_hashed: "",
                user_type: "client",
                has_admin_access: false,
                has_boarding_access: false,
                has_services_access: false,
                has_clinic_access: false,
            });
            
            // Refresh users and select the new user
            await fetchManualEntryUsers();
            setShowManualAddUser(false);
            
            // Auto-select the newly added user
            if (res.data?.id) {
                const newUserId = res.data.id;
                setTimeout(() => {
                    const newUser = manualEntryUsers.find(u => u.id === newUserId);
                    if (newUser) {
                        setManualEntryUser(newUser);
                        if (manualEntryEvent?.requires_pet) {
                            fetchManualEntryPets(newUserId);
                        }
                    }
                }, 500);
            }
        } else {
            setErrorMsg(res?.message || "Failed to add user.");
        }
        
        setAddingManualUser(false);
    };

    // Submit manual entry booking
    const handleManualEntrySubmit = async () => {
        if (!manualEntryEvent || !manualEntryUser || !manualEntryTier) {
            setErrorMsg("Please select event, user, and ticket type.");
            return;
        }

        if (manualEntryEvent.requires_pet && manualEntrySelectedPets.length !== manualEntryTicketCount) {
            setErrorMsg(`Please select ${manualEntryTicketCount} pet(s) for ${manualEntryTicketCount} ticket(s).`);
            return;
        }

        // Validate required form fields
        if (manualEntryEvent.form_fields?.length > 0) {
            for (const field of manualEntryEvent.form_fields) {
                if (field.is_required && !manualEntryFormData[field.field_name]) {
                    setErrorMsg(`Please fill in required field: ${field.field_name}`);
                    return;
                }
            }
        }

        setManualEntrySubmitting(true);
        try {
            const orderId = `MANUAL_${Date.now()}`;
            const response = await callServicesApi({
                action: "BOOK_EVENT",
                session_id,
                event_id: manualEntryEvent.id,
                user_id: manualEntryUser.id,
                pricing_id: manualEntryTier.id,
                ticket_count: manualEntryTicketCount,
                form_data: manualEntryFormData,
                pets: manualEntrySelectedPets,
                order_id: orderId,
                cf_order_id: null,
                mode: "offline"
            });

            if (response?.success) {
                // Send confirmation email
                try {
                    // Get pet details for email
                    const selectedPetDetails = manualEntrySelectedPets.map(petId => {
                        const pet = manualEntryPets.find(p => p.id === petId);
                        return pet ? { name: pet.name, breed: pet.breed } : { name: `Pet #${petId}`, breed: '-' };
                    });

                    const emailHtml = getEventBookingEmailHtml({
                        userName: manualEntryUser.first_name || "Guest",
                        eventTitle: manualEntryEvent.title,
                        eventDate: formatDateForEmail(manualEntryEvent.event_date),
                        eventTime: formatTimeForEmail(manualEntryEvent.event_time),
                        venue: manualEntryEvent.venue,
                        city: manualEntryEvent.city,
                        ticketType: manualEntryTier.label,
                        ticketCount: manualEntryTicketCount,
                        totalPrice: (manualEntryTier.price || 0) * manualEntryTicketCount,
                        orderId: orderId,
                        transactionId: "MANUAL",
                        pets: selectedPetDetails
                    });

                    await callServicesApi({
                        action: "SEND_EMAIL",
                        session_id,
                        email: manualEntryUser.email,
                        subject: `Booking Confirmed: ${manualEntryEvent.title} - Wag N Wonder`,
                        html: emailHtml
                    });
                } catch (emailErr) {
                    console.error("Failed to send confirmation email:", emailErr);
                }

                setSuccessMsg(`Booking created successfully! Booking ID: ${response.booking_id}`);
                // Clear registrations cache so it re-fetches when tab is visited
                setAllRegistrationsCache({});
                setAllRegistrations([]);
                resetManualEntryForm();
            } else {
                setErrorMsg(response?.message || "Failed to create booking.");
            }
        } catch (err) {
            console.error("Error creating manual booking:", err);
            setErrorMsg("Error creating booking. Please try again.");
        } finally {
            setManualEntrySubmitting(false);
        }
    };

    // Load users when manual entry tab is selected
    useEffect(() => {
        if (activeTab === "manual") {
            if (manualEntryUsers.length === 0) {
                fetchManualEntryUsers();
            }
            if (!allEventsCache) {
                fetchEvents();
            }
        }
    }, [activeTab]);

    // Reset selected pets when ticket count changes
    useEffect(() => {
        setManualEntrySelectedPets([]);
    }, [manualEntryTicketCount]);

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

        // Build rows - one row per pet
        const rows = registrations.flatMap(reg => {
            const formData = parseFormData(reg.form_data);
            const pets = reg.pets && reg.pets.length > 0 ? reg.pets : [null];

            return pets.map(pet => [
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
            ]);
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
                setAllEventsCache(null);
                fetchEvents(true);
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
                setAllEventsCache(null);
                fetchEvents(true);
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
                                                <i className="bi bi-ticket me-1"></i>
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
                                        {getFilteredRegistrations().flatMap((reg) => {
                                            const formData = parseFormData(reg.form_data);
                                            const pets = reg.pets && reg.pets.length > 0 ? reg.pets : [null];
                                            
                                            return pets.map((pet, petIndex) => (
                                                <tr key={`${reg.id}-${petIndex}`}>
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
                                            ));
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
                                    value={manualEntryEvent?.id || ""}
                                    onChange={(e) => handleManualEventSelect(e.target.value)}
                                    className="manual-entry-select"
                                    disabled={manualEntryLoading}
                                >
                                    <option value="">Choose an event...</option>
                                    {(allEventsCache || []).filter(e => e.status === "upcoming").length > 0 && <optgroup label="Upcoming">
                                        {(allEventsCache || []).filter(e => e.status === "upcoming").map(evt => (
                                            <option key={evt.id} value={evt.id}>{evt.title} - {new Date(evt.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</option>
                                        ))}
                                    </optgroup>}
                                    {(allEventsCache || []).filter(e => e.status === "past").length > 0 && <optgroup label="Past Events">
                                        {(allEventsCache || []).filter(e => e.status === "past").map(evt => (
                                            <option key={evt.id} value={evt.id}>{evt.title} - {new Date(evt.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</option>
                                        ))}
                                    </optgroup>}
                                </select>
                            </div>
                        </div>

                        {/* Step 2: Select User */}
                        {manualEntryEvent && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">2</span>
                                    <h4>Select User</h4>
                                </div>
                                <div className="step-content">
                                    {loadingManualUsers ? (
                                        <div className="manual-entry-loading">
                                            <div className="spinner-border spinner-border-sm"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                value={showManualAddUser ? "__add_new__" : (manualEntryUser?.id || "")}
                                                onChange={(e) => {
                                                    if (e.target.value === "__add_new__") {
                                                        setShowManualAddUser(true);
                                                        setManualEntryUser(null);
                                                    } else {
                                                        setShowManualAddUser(false);
                                                        handleManualUserSelect(e.target.value);
                                                    }
                                                }}
                                                className="manual-entry-select"
                                            >
                                                <option value="">Choose a user...</option>
                                                <option value="__add_new__">+ Add New User</option>
                                                {manualEntryUsers.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.first_name} {user.last_name} ({user.email})
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {/* Add New User Form */}
                                            {showManualAddUser && (
                                                <div className="manual-add-user-section">
                                                    <h5>Add New User</h5>
                                                    <div className="manual-add-user-grid">
                                                        <div className="manual-field">
                                                            <label>First Name *</label>
                                                            <input
                                                                type="text"
                                                                placeholder="First Name"
                                                                value={manualNewUserForm.first_name}
                                                                onChange={(e) => setManualNewUserForm({ ...manualNewUserForm, first_name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="manual-field">
                                                            <label>Last Name</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Last Name"
                                                                value={manualNewUserForm.last_name}
                                                                onChange={(e) => setManualNewUserForm({ ...manualNewUserForm, last_name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="manual-field">
                                                            <label>Email *</label>
                                                            <input
                                                                type="email"
                                                                placeholder="Email"
                                                                value={manualNewUserForm.email}
                                                                onChange={(e) => setManualNewUserForm({ ...manualNewUserForm, email: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="manual-field">
                                                            <label>Phone</label>
                                                            <input
                                                                type="tel"
                                                                placeholder="Phone"
                                                                value={manualNewUserForm.phone_number}
                                                                onChange={(e) => setManualNewUserForm({ ...manualNewUserForm, phone_number: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="manual-field full-width">
                                                            <label>Password *</label>
                                                            <input
                                                                type="password"
                                                                placeholder="Password"
                                                                value={manualNewUserForm.password_hashed}
                                                                onChange={(e) => setManualNewUserForm({ ...manualNewUserForm, password_hashed: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        className="manual-add-user-btn"
                                                        onClick={handleManualAddNewUser}
                                                        disabled={addingManualUser}
                                                    >
                                                        {addingManualUser ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm"></span>
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="bi bi-person-plus"></i>
                                                                Add User
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Select Ticket Type */}
                        {manualEntryUser && manualEntryEvent && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">3</span>
                                    <h4>Select Ticket Type</h4>
                                </div>
                                <div className="step-content">
                                    <div className="manual-entry-tiers">
                                        {manualEntryEvent.pricing?.map(tier => (
                                            <button
                                                key={tier.id}
                                                className={`tier-btn ${manualEntryTier?.id === tier.id ? 'selected' : ''}`}
                                                onClick={() => setManualEntryTier(tier)}
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
                        {manualEntryTier && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">4</span>
                                    <h4>Number of Tickets</h4>
                                </div>
                                <div className="step-content">
                                    <div className="manual-entry-counter">
                                        <button
                                            onClick={() => setManualEntryTicketCount(Math.max(1, manualEntryTicketCount - 1))}
                                            disabled={manualEntryTicketCount <= 1}
                                        >
                                            <i className="bi bi-dash"></i>
                                        </button>
                                        <span>{manualEntryTicketCount}</span>
                                        <button
                                            onClick={() => setManualEntryTicketCount(manualEntryTicketCount + 1)}
                                        >
                                            <i className="bi bi-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Pet Selection (if required) */}
                        {manualEntryTier && manualEntryEvent.requires_pet === 1 && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">5</span>
                                    <h4>Select Pets ({manualEntrySelectedPets.length}/{manualEntryTicketCount})</h4>
                                </div>
                                <div className="step-content">
                                    {loadingManualPets ? (
                                        <div className="manual-entry-loading">
                                            <div className="spinner-border spinner-border-sm"></div>
                                        </div>
                                    ) : manualEntryPets.length === 0 ? (
                                        <div className="manual-entry-no-pets">
                                            <p>No pets found for this user.</p>
                                            <button onClick={() => setShowManualAddPetModal(true)}>
                                                <i className="bi bi-plus"></i> Add Pet
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="manual-entry-pets">
                                            {manualEntryPets.map(pet => (
                                                <button
                                                    key={pet.id}
                                                    className={`pet-select-btn ${manualEntrySelectedPets.includes(pet.id) ? 'selected' : ''}`}
                                                    onClick={() => handleManualPetSelect(pet.id)}
                                                    disabled={!manualEntrySelectedPets.includes(pet.id) && manualEntrySelectedPets.length >= manualEntryTicketCount}
                                                >
                                                    <i className={`bi ${manualEntrySelectedPets.includes(pet.id) ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                                    <div className="pet-info">
                                                        <span className="pet-name">{pet.name}</span>
                                                        <span className="pet-breed">{pet.breed}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            <button className="pet-add-btn" onClick={() => setShowManualAddPetModal(true)}>
                                                <i className="bi bi-plus"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 6: Custom Form Fields (if any) */}
                        {manualEntryTier && manualEntryEvent.form_fields?.length > 0 && (
                            <div className="manual-entry-step">
                                <div className="step-header">
                                    <span className="step-number">{manualEntryEvent.requires_pet === 1 ? '6' : '5'}</span>
                                    <h4>Additional Information</h4>
                                </div>
                                <div className="step-content">
                                    <div className="manual-entry-fields">
                                        {manualEntryEvent.form_fields.map(field => (
                                            <div key={field.id} className="manual-field">
                                                <label>
                                                    {field.field_name}
                                                    {field.is_required === 1 && <span className="required">*</span>}
                                                </label>
                                                {field.field_type === "select" ? (
                                                    <select
                                                        value={manualEntryFormData[field.field_name] || ""}
                                                        onChange={(e) => setManualEntryFormData({
                                                            ...manualEntryFormData,
                                                            [field.field_name]: e.target.value
                                                        })}
                                                    >
                                                        <option value="">Select...</option>
                                                        {(typeof field.field_options === 'string'
                                                            ? JSON.parse(field.field_options)
                                                            : field.field_options || []
                                                        ).map((opt, idx) => (
                                                            <option key={idx} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : field.field_type === "textarea" ? (
                                                    <textarea
                                                        value={manualEntryFormData[field.field_name] || ""}
                                                        onChange={(e) => setManualEntryFormData({
                                                            ...manualEntryFormData,
                                                            [field.field_name]: e.target.value
                                                        })}
                                                        placeholder={`Enter ${field.field_name.toLowerCase()}`}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.field_type || "text"}
                                                        value={manualEntryFormData[field.field_name] || ""}
                                                        onChange={(e) => setManualEntryFormData({
                                                            ...manualEntryFormData,
                                                            [field.field_name]: e.target.value
                                                        })}
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
                        {manualEntryTier && (
                            <div className="manual-entry-summary">
                                <div className="summary-details">
                                    <div className="summary-row">
                                        <span>Event</span>
                                        <span>{manualEntryEvent?.title}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>User</span>
                                        <span>{manualEntryUser?.first_name} {manualEntryUser?.last_name}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Ticket Type</span>
                                        <span>{manualEntryTier?.label}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Quantity</span>
                                        <span>{manualEntryTicketCount}</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Total</span>
                                        <span>₹{(manualEntryTier?.price || 0) * manualEntryTicketCount}</span>
                                    </div>
                                </div>
                                <button
                                    className="manual-entry-submit"
                                    onClick={handleManualEntrySubmit}
                                    disabled={manualEntrySubmitting}
                                >
                                    {manualEntrySubmitting ? (
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

            {/* Add Pet Modal for Manual Entry */}
            {showManualAddPetModal && manualEntryUser && (
                <AddPetModal
                    onClose={() => setShowManualAddPetModal(false)}
                    onSaved={handleManualPetAdded}
                    userId={manualEntryUser.id}
                />
            )}
        </div>
    );
};

export default ManageEvents;