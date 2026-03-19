import React, { useState, useEffect } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import logo from '../assets/images/horizontal-compressed.png';
import { callServicesApi } from "../assets/js/servicesApi";

const MENU_ITEMS = [
    { path: "/admin/earnings", icon: "bi-bar-chart-line-fill", label: "Earnings Dashboard" },
    { path: "/admin/manage-products", icon: "bi-box-seam-fill", label: "Manage Products" },
    { path: "/admin/manage-users", icon: "bi-people-fill", label: "Manage Users" },
    { path: "/admin/manage-pets", icon: "bi-heart-pulse-fill", label: "Manage Pets" },
    { path: "/admin/manage-kennels", icon: "bi-house-door-fill", label: "Manage Kennels" },
    { path: "/admin/manage-cities", icon: "bi-geo-alt-fill", label: "Service Cities" },
    { path: "/admin/manage-bookings", icon: "bi-calendar-check-fill", label: "Manage Bookings" },
    { path: "/admin/manage-events", icon: "bi-calendar-event", label: "Manage Events" },
    { path: "/admin/support-tickets", icon: "bi-chat-dots-fill", label: "Support Tickets" },
];

const AdminPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("user_data"));

    const [supportTickets, setSupportTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [pendingTicketCount, setPendingTicketCount] = useState(0);
    const [pendingKennelTicketCount, setPendingKennelTicketCount] = useState(0);

    const fetchSupportTickets = async () => {
        const session_id = localStorage.getItem("session_id");
        setTicketsLoading(true);
        try {
            const response = await callServicesApi({
                action: "GET_TICKETS",
                session_id
            });
            if (response?.success && response.tickets) {
                setSupportTickets(response.tickets);
                // Count "New" + "Awaiting Reply" + "Contact Us New" tickets
                const pendingCount = response.tickets.filter(ticket => {
                    const isNew = ticket.status === 'open' && ticket.source !== 'contact_us';
                    const isAwaitingReply = ticket.last_reply_by === 'user' && ticket.status === 'in_progress' && ticket.source !== 'contact_us';
                    const isContactUsNew = ticket.source === 'contact_us' && ticket.status !== 'closed';
                    return isNew || isAwaitingReply || isContactUsNew;
                }).length;
                setPendingTicketCount(pendingCount);
            } else {
                setSupportTickets([]);
            }
        } catch (err) {
            console.error("Error fetching tickets:", err);
        } finally {
            setTicketsLoading(false);
        }
    };

    const fetchKennelTicketCount = async () => {
        const session_id = localStorage.getItem("session_id");
        try {
            const kennelRes = await callServicesApi({
                action: "GET_MANAGED_KENNELS",
                session_id,
                user_id: userData.id
            });
            if (kennelRes?.success && kennelRes.kennels?.length > 0) {
                const ticketRes = await callServicesApi({
                    action: "GET_KENNEL_TICKETS",
                    session_id,
                    kennel_ids: kennelRes.kennels.map(k => k.id)
                });
                if (ticketRes?.success) {
                    const pending = (ticketRes.tickets || []).filter(t =>
                        t.status === "open" || (t.status === "in_progress" && t.last_reply_by === "user")
                    ).length;
                    setPendingKennelTicketCount(pending);
                }
            }
        } catch (err) {
            console.error("Error fetching kennel ticket count:", err);
        }
    };

    const isSuperAdmin = userData?.permissions?.includes("master_console");
    const isEventsAdmin = userData?.permissions?.includes("events");
    const isBoardingAdmin = userData?.permissions?.includes("boarding");


    useEffect(() => {
        if (isSuperAdmin) {
            fetchSupportTickets();
        }
        if (isBoardingAdmin) {
            fetchKennelTicketCount();
        }
    }, []);

    if (!userData || (!isSuperAdmin && !isEventsAdmin && !isBoardingAdmin)) {
        localStorage.clear();
        return <Navigate to="/login" />;
    }

    const isBaseAdminRoute = location.pathname === "/admin";

    return (
        <div className="admin-page">
            {/* Small Screen Message */}
            <div className="admin-small-screen-message">
                <div className="admin-small-screen-content">
                    <i className="bi bi-display"></i>
                    <h2>Larger Screen Required</h2>
                    <p>The admin panel is optimized for tablets and desktops. Please access it from a device with a larger screen.</p>
                    <button onClick={() => navigate("/account")}>
                        <i className="bi bi-arrow-left"></i>
                        Back to Account
                    </button>
                </div>
            </div>

            {/* Main Admin Content */}
            <div className="admin-main-content">
                {/* Header */}
                <div className="admin-header">
                    <div className="admin-header-content">
                        <button className="admin-back-btn" onClick={() => navigate("/account")}>
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1>Admin Panel</h1>
                        <div className="admin-header-branding">
                            <span>Powered by</span>
                            <img src={logo} alt="Wag N Wonder" />
                        </div>
                    </div>
                </div>

                <div className="admin-container">
                    {/* Sidebar */}
                    <aside className={`admin-sidebar ${isBaseAdminRoute ? "" : "hide-mobile"}`}>
                        <div className="admin-user-card">
                            <div className="admin-avatar">
                                <i className="bi bi-shield-lock-fill"></i>
                            </div>
                            <div className="admin-user-info">
                                <h3>{userData.first_name} {userData.last_name}</h3>
                                <p>{
                                    isSuperAdmin ? "Administrator" :
                                        (isBoardingAdmin && isEventsAdmin) ? "Events & Boarding Admin" :
                                            isBoardingAdmin ? "Boarding Admin" :
                                                isEventsAdmin ? "Events Manager" :
                                                    "User"
                                }</p>
                            </div>
                        </div>

                        <nav className="admin-nav">
                            {isSuperAdmin && (
                                <>
                                    <div className="admin-nav-divider">
                                        <span>SUPER ADMIN</span>
                                    </div>
                                    {MENU_ITEMS.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`admin-nav-item ${location.pathname === item.path ? "active" : ""}`}
                                        >
                                            <i className={`bi ${item.icon}`}></i>
                                            <span>{item.label}</span>
                                            {item.path === "/admin/support-tickets" && pendingTicketCount > 0 && (
                                                <span className="admin-unread-badge">{pendingTicketCount}</span>
                                            )}
                                        </Link>
                                    ))}
                                </>
                            )}

                            {isEventsAdmin && (
                                <>
                                    <div className="admin-nav-divider">
                                        <span>EVENTS ADMIN</span>
                                    </div>
                                    <Link
                                        to="/admin/events-admin"
                                        className={`admin-nav-item ${location.pathname === "/admin/events-admin" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-calendar-event-fill"></i>
                                        <span>My Events</span>
                                    </Link>
                                    <Link
                                        to="/admin/events-revenue"
                                        className={`admin-nav-item ${location.pathname === "/admin/events-revenue" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-bar-chart-line-fill"></i>
                                        <span>Events Revenue</span>
                                    </Link>
                                </>
                            )}

                            {isBoardingAdmin && (
                                <>
                                    <div className="admin-nav-divider">
                                        <span>BOARDING ADMIN</span>
                                    </div>
                                    <Link
                                        to="/admin/kennels-admin/kennels"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/kennels" || location.pathname === "/admin/kennels-admin" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-house-door-fill"></i>
                                        <span>My Kennels</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/profile"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/profile" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-pencil-square"></i>
                                        <span>Kennel Profile</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/revenue"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/revenue" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-bar-chart-line-fill"></i>
                                        <span>Revenue</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/bookings"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/bookings" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-calendar-check-fill"></i>
                                        <span>Bookings</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/today"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/today" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-calendar-day-fill"></i>
                                        <span>Today's Activity</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/occupancy"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/occupancy" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-grid-3x3-gap-fill"></i>
                                        <span>Occupancy</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/employees"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/employees" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-person-badge-fill"></i>
                                        <span>Employees</span>
                                    </Link>
                                    <Link
                                        to="/admin/kennel-tickets"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennel-tickets" ? "active" : ""}`}
                                    >
                                        <i className="bi bi-chat-dots-fill"></i>
                                        <span>Support Tickets</span>
                                        {pendingKennelTicketCount > 0 && (
                                            <span className="admin-unread-badge">{pendingKennelTicketCount}</span>
                                        )}
                                    </Link>
                                    <Link
                                        to="/admin/kennels-admin/closure"
                                        className={`admin-nav-item ${location.pathname === "/admin/kennels-admin/closure" ? "active" : ""}`}
                                        style={location.pathname !== "/admin/kennels-admin/closure" ? {
                                            background: "linear-gradient(135deg, #fff5f5, #fee2e2)",
                                            border: "1px solid #fecaca",
                                            color: "#dc2626"
                                        } : {}}
                                    >
                                        <i className="bi bi-exclamation-triangle-fill" style={{ color: location.pathname === "/admin/kennels-admin/closure" ? undefined : "#dc2626" }}></i>
                                        <span>Maintenance Closure</span>
                                    </Link>
                                </>
                            )}

                            <Link to="/account" className="admin-nav-item back-to-account">
                                <i className="bi bi-person-fill"></i>
                                <span>Back to Account</span>
                            </Link>
                        </nav>
                    </aside>

                    {/* Content */}
                    <main className={`admin-content ${isBaseAdminRoute ? "hide-mobile" : ""}`}>
                        {!isBaseAdminRoute && (
                            <button className="admin-content-back" onClick={() => { navigate("/admin"); window.scrollTo(0, 0); }}>
                                <i className="bi bi-arrow-left"></i>
                                Back to menu
                            </button>
                        )}

                        {isBaseAdminRoute ? (
                            <div className="admin-welcome">
                                <div className="admin-welcome-icon">
                                    <i className="bi bi-speedometer2"></i>
                                </div>
                                <h2>Welcome, {userData.first_name}!</h2>
                                <p>Manage your dashboard using the menu on the left or get started below.</p>

                                <div className="admin-quick-stats">
                                    {isSuperAdmin && MENU_ITEMS.map((item) => (
                                        <Link key={item.path} to={item.path} className="admin-stat-card">
                                            <i className={`bi ${item.icon}`}></i>
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                    {isBoardingAdmin && (
                                        <>
                                            <Link to="/admin/kennels-admin/kennels" className="admin-stat-card">
                                                <i className="bi bi-house-door-fill"></i>
                                                <span>My Kennels</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/profile" className="admin-stat-card">
                                                <i className="bi bi-pencil-square"></i>
                                                <span>Kennel Profile</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/revenue" className="admin-stat-card">
                                                <i className="bi bi-bar-chart-line-fill"></i>
                                                <span>Revenue</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/bookings" className="admin-stat-card">
                                                <i className="bi bi-calendar-check-fill"></i>
                                                <span>Bookings</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/today" className="admin-stat-card">
                                                <i className="bi bi-calendar-day-fill"></i>
                                                <span>Today's Activity</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/occupancy" className="admin-stat-card">
                                                <i className="bi bi-grid-3x3-gap-fill"></i>
                                                <span>Occupancy</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/employees" className="admin-stat-card">
                                                <i className="bi bi-person-badge-fill"></i>
                                                <span>Employees</span>
                                            </Link>

                                            <Link to="/admin/kennel-tickets" className="admin-stat-card">
                                                <i className="bi bi-chat-dots-fill"></i>
                                                <span>Support Tickets</span>
                                            </Link>
                                            <Link to="/admin/kennels-admin/closure" className="admin-stat-card" style={{ borderColor: "#fecaca", background: "#fff5f5" }}>
                                                <i className="bi bi-exclamation-triangle-fill" style={{ color: "#dc2626" }}></i>
                                                <span style={{ color: "#dc2626" }}>Maintenance Closure</span>
                                            </Link>
                                        </>
                                    )}
                                    {isEventsAdmin && (
                                        <>
                                            <Link to="/admin/events-admin" className="admin-stat-card">
                                                <i className="bi bi-calendar-event-fill"></i>
                                                <span>My Events</span>
                                            </Link>
                                            <Link to="/admin/events-revenue" className="admin-stat-card">
                                                <i className="bi bi-bar-chart-line-fill"></i>
                                                <span>Events Revenue</span>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Outlet context={{ supportTickets, ticketsLoading, refreshTickets: fetchSupportTickets }} />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;