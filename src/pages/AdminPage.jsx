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

    const isSuperAdmin = userData?.permissions?.includes("master_console");
    const isEventsAdmin = userData?.permissions?.includes("events");

    useEffect(() => {
        if (isSuperAdmin) {
            fetchSupportTickets();
        }
    }, []);

    if (!userData || (!isSuperAdmin && !isEventsAdmin)) {
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
                                <p>{isSuperAdmin ? "Administrator" : "Events Manager"}</p>
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
                                    {isEventsAdmin && (
                                        <Link to="/admin/events-admin" className="admin-stat-card">
                                            <i className="bi bi-calendar-event-fill"></i>
                                            <span>My Events</span>
                                        </Link>
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