import React from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";

const MENU_ITEMS = [
    { path: "/admin/manage-products", icon: "bi-box-seam-fill", label: "Manage Products" },
    { path: "/admin/manage-users", icon: "bi-people-fill", label: "Manage Users" },
    { path: "/admin/manage-kennels", icon: "bi-house-door-fill", label: "Manage Kennels" },
    { path: "/admin/manage-bookings", icon: "bi-calendar-check-fill", label: "Manage Bookings" },
];

const AdminPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("user_data"));

    if (
        !userData ||
        userData.user_type !== "admin" ||
        !userData.permissions
    ) {
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
                                <p>Administrator</p>
                            </div>
                        </div>

                        <nav className="admin-nav">
                            {MENU_ITEMS.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`admin-nav-item ${location.pathname === item.path ? "active" : ""}`}
                                >
                                    <i className={`bi ${item.icon}`}></i>
                                    <span>{item.label}</span>
                                </Link>
                            ))}

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
                                <p>Manage your dashboard using the menu on the left.</p>
                                
                                <div className="admin-quick-stats">
                                    {MENU_ITEMS.map((item) => (
                                        <Link key={item.path} to={item.path} className="admin-stat-card">
                                            <i className={`bi ${item.icon}`}></i>
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Outlet />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;