import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";
import { getWelcomeUserEmailHtml } from "../assets/js/welcomeUserEmail";

const ManageUsers = () => {
    const [activeTab, setActiveTab] = useState("list");
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [emailFilter, setEmailFilter] = useState("");
    const [phoneFilter, setPhoneFilter] = useState("");
    const [accessFilter, setAccessFilter] = useState([]);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        user_type: "client",
        password_hashed: "",
        has_admin_access: false,
        has_boarding_access: false,
        has_services_access: false,
        has_clinic_access: false,
        has_events_access: false,
    });
    const [eventsAccessEnabled, setEventsAccessEnabled] = useState(false);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { setLoading } = useLoading();

    const fetchUsers = async () => {
        setFetchingUsers(true);
        const res = await callServicesApi({
            action: "GET_ALL_USERS",
            session_id: localStorage.getItem("session_id")
        });
        if (res?.success) setUsers(res.data || []);
        else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        setFetchingUsers(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        setLoading(true);
        let payload = {
            action: "DELETE_USER",
            user_id: id,
            session_id: localStorage.getItem("session_id")
        };
        const res = await callServicesApi(payload);
        if (res?.success) {
            fetchUsers();
            setSuccessMsg("User deleted successfully.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } else {
            // Check for foreign key constraint error
            const message = res?.message || "";
            if (message.includes("foreign key constraint") || message.includes("Cannot delete")) {
                setErrorMsg("Cannot delete this user. They have existing bookings or pets associated with their account.");
            } else {
                setErrorMsg(message || "Failed to delete user.");
            }
            setTimeout(() => setErrorMsg(""), 5000);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const matchesSearch = (user) => (
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesAccess = (user) => {
        if (accessFilter.length === 0) return true;
        return accessFilter.some(filter => {
            if (filter === "admin") return user.has_admin_access;
            if (filter === "boarding") return user.has_boarding_access;
            if (filter === "services") return user.has_services_access;
            if (filter === "clinic") return user.has_clinic_access;
            if (filter === "events") return user.has_events_access;
            return false;
        });
    };

    const filteredUsers = users.filter(user =>
        matchesSearch(user) &&
        matchesAccess(user) &&
        user.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
        user.phone_number.includes(phoneFilter)
    );

    const handleAccessChange = (value) => {
        setAccessFilter(prev => 
            prev.includes(value) 
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    const fetchAllEvents = async () => {
        setLoadingEvents(true);
        try {
            const response = await callServicesApi({
                action: "GET_EVENTS",
                session_id: localStorage.getItem("session_id"),
                status: "all"
            });
            if (response?.success) {
                setAllEvents(response.events || []);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleEventToggle = (eventId) => {
        setSelectedEventIds(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        // Store password before sending (it gets hashed on backend)
        const plainPassword = formData.password_hashed;

        // If events access enabled, set the flag
        const submitData = {
            ...formData,
            has_events_access: eventsAccessEnabled && selectedEventIds.length > 0,
        };
        
        let payload = {
            action: "ADD_USER",
            session_id: localStorage.getItem("session_id"),
            ...submitData
        };
        const res = await callServicesApi(payload);

        if (res?.success) {
            // Assign event manager roles if events were selected
            if (eventsAccessEnabled && selectedEventIds.length > 0 && res.user_id) {
                for (const eventId of selectedEventIds) {
                    try {
                        await callServicesApi({
                            action: "ASSIGN_EVENT_MANAGER",
                            session_id: localStorage.getItem("session_id"),
                            user_id: res.user_id,
                            event_id: eventId
                        });
                    } catch (err) {
                        console.error(`Error assigning event ${eventId}:`, err);
                    }
                }
            }

            // Send welcome email
            try {
                const emailHtml = getWelcomeUserEmailHtml({
                    firstName: formData.first_name,
                    lastName: formData.last_name,
                    email: formData.email,
                    phoneNumber: formData.phone_number,
                    password: plainPassword
                });
                
                await callServicesApi({
                    action: "SEND_EMAIL",
                    session_id: localStorage.getItem("session_id"),
                    email: formData.email,
                    subject: "Welcome to Wag N Wonder - Your Account Details",
                    html: emailHtml
                });
            } catch (emailErr) {
                console.error("Failed to send welcome email:", emailErr);
            }
            
            setSuccessMsg("User added successfully.");
            setFormData({
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
                has_events_access: false,
            });
            setEventsAccessEnabled(false);
            setSelectedEventIds([]);
            fetchUsers();
        } else {
            setErrorMsg(res?.message || "Failed to add user.");
        }

        setTimeout(() => {
            setSuccessMsg("");
            setErrorMsg("");
        }, 3000);
        setSubmitting(false);
    };

    const getAccessBadges = (user) => {
        const badges = [];
        if (user.has_admin_access) badges.push({ label: "Admin", type: "admin" });
        if (user.has_boarding_access) badges.push({ label: "Boarding", type: "boarding" });
        if (user.has_services_access) badges.push({ label: "Services", type: "services" });
        if (user.has_clinic_access) badges.push({ label: "Clinic", type: "clinic" });
        if (user.has_events_access) badges.push({ label: "Events", type: "events" });
        return badges;
    };

    return (
        <div className="manage-users">
            <div className="manage-users-header">
                <h2>Manage Users</h2>
                <span className="manage-users-count">{users.length} user{users.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Submenu Tabs */}
            <div className="manage-users-submenu">
                <button
                    className={`submenu-item ${activeTab === "list" ? "active" : ""}`}
                    onClick={() => setActiveTab("list")}
                >
                    <i className="bi bi-list-ul"></i>
                    List Users
                </button>
                <button
                    className={`submenu-item ${activeTab === "add" ? "active" : ""}`}
                    onClick={() => setActiveTab("add")}
                >
                    <i className="bi bi-person-plus"></i>
                    Add User
                </button>
            </div>

            {/* Success/Error Messages */}
            {successMsg && (
                <div className="manage-users-alert success">
                    <i className="bi bi-check-circle"></i>
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {errorMsg && (
                <div className="manage-users-alert error">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* List Users Tab */}
            {activeTab === "list" && (
                <div className="manage-users-list">
                    {/* Filters */}
                    <div className="manage-users-filters">
                        <div className="filter-row">
                            <div className="filter-field">
                                <label>Search Users</label>
                                <div className="filter-input-wrapper">
                                    <i className="bi bi-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="filter-field">
                                <label>Filter by Email</label>
                                <div className="filter-input-wrapper">
                                    <i className="bi bi-envelope"></i>
                                    <input
                                        type="text"
                                        placeholder="Enter email"
                                        value={emailFilter}
                                        onChange={(e) => setEmailFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="filter-row">
                            <div className="filter-field">
                                <label>Filter by Mobile</label>
                                <div className="filter-input-wrapper">
                                    <i className="bi bi-phone"></i>
                                    <input
                                        type="text"
                                        placeholder="Enter phone number"
                                        value={phoneFilter}
                                        onChange={(e) => setPhoneFilter(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="filter-field">
                                <label>Filter by Access</label>
                                <div className="filter-chips">
                                    {["admin", "boarding", "services", "clinic"].map((type) => (
                                        <button
                                            key={type}
                                            className={`filter-chip ${accessFilter.includes(type) ? "active" : ""}`}
                                            onClick={() => handleAccessChange(type)}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    {fetchingUsers ? (
                        <div className="manage-users-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="manage-users-empty">
                            <i className="bi bi-people"></i>
                            <p>No users found</p>
                        </div>
                    ) : (
                        <div className="manage-users-table-wrapper">
                            <table className="manage-users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Access</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td className="user-id">#{user.id}</td>
                                            <td className="user-name">
                                                <div className="user-name-inner">
                                                    <div className="user-avatar">
                                                        {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                                                    </div>
                                                    <span>{user.first_name} {user.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="user-email">{user.email}</td>
                                            <td className="user-phone">{user.phone_number}</td>
                                            <td className="user-access">
                                                {getAccessBadges(user).length > 0 ? (
                                                    getAccessBadges(user).map((badge, idx) => (
                                                        <span key={idx} className={`access-badge ${badge.type}`}>
                                                            {badge.label}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="access-badge client">Client</span>
                                                )}
                                            </td>
                                            <td className="user-actions">
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(user.id)}
                                                    title="Delete User"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add User Tab */}
            {activeTab === "add" && (
                <div className="manage-users-add">
                    <form onSubmit={handleSubmit} className="add-user-form">
                        <div className="form-grid">
                            <div className="form-field">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter first name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="form-field">
                                <label>Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                            <div className="form-field">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-field">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="Enter phone number"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                            </div>
                            <div className="form-field">
                                <label>Password *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        placeholder="Enter password"
                                        value={formData.password_hashed}
                                        onChange={(e) => setFormData({ ...formData, password_hashed: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="form-field">
                                <label>User Type *</label>
                                <select
                                    value={formData.user_type}
                                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                                >
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        {formData.user_type === "admin" && (
                            <div className="form-permissions">
                                <label>Access Permissions</label>
                                <div className="permissions-grid">
                                    <label className="permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_admin_access}
                                            onChange={(e) => setFormData({ ...formData, has_admin_access: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="permission-label">
                                            <i className="bi bi-shield-lock"></i>
                                            Admin Access
                                        </span>
                                    </label>
                                    <label className="permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_boarding_access}
                                            onChange={(e) => setFormData({ ...formData, has_boarding_access: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="permission-label">
                                            <i className="bi bi-house-door"></i>
                                            Boarding Access
                                        </span>
                                    </label>
                                    <label className="permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_services_access}
                                            onChange={(e) => setFormData({ ...formData, has_services_access: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="permission-label">
                                            <i className="bi bi-gear"></i>
                                            Services Access
                                        </span>
                                    </label>
                                    <label className="permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.has_clinic_access}
                                            onChange={(e) => setFormData({ ...formData, has_clinic_access: e.target.checked })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="permission-label">
                                            <i className="bi bi-heart-pulse"></i>
                                            Clinic Access
                                        </span>
                                    </label>
                                    <label className="permission-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={eventsAccessEnabled}
                                            onChange={(e) => {
                                                setEventsAccessEnabled(e.target.checked);
                                                if (e.target.checked && allEvents.length === 0) {
                                                    fetchAllEvents();
                                                }
                                                if (!e.target.checked) {
                                                    setSelectedEventIds([]);
                                                }
                                            }}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="permission-label">
                                            <i className="bi bi-calendar-event"></i>
                                            Event Manager
                                        </span>
                                    </label>
                                </div>

                                {eventsAccessEnabled && (
                                    <div className="events-access-selector">
                                        <label>Select Events to Manage</label>
                                        {loadingEvents ? (
                                            <div className="manual-entry-loading">
                                                <div className="spinner-border spinner-border-sm"></div>
                                            </div>
                                        ) : allEvents.length === 0 ? (
                                            <p className="form-hint">No events found.</p>
                                        ) : (
                                            <div className="events-checkbox-list">
                                                {allEvents.map(evt => (
                                                    <label key={evt.id} className="event-checkbox-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEventIds.includes(evt.id)}
                                                            onChange={() => handleEventToggle(evt.id)}
                                                        />
                                                        <span className="checkmark"></span>
                                                        <span className="event-checkbox-info">
                                                            <span className="event-checkbox-title">{evt.title}</span>
                                                            <span className="event-checkbox-meta">
                                                                {new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                                {" · "}{evt.city}
                                                                <span className={`event-checkbox-status ${evt.status}`}>{evt.status}</span>
                                                            </span>
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <button type="submit" className="add-user-submit" disabled={submitting}>
                            {submitting ? (
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
                    </form>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;