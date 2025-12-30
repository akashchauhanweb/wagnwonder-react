import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

const MENU_ITEMS = [
    { path: "/account/info", icon: "bi-person-fill", label: "Personal Info" },
    { path: "/account/pets", icon: "bi-heart-pulse-fill", label: "Your Pets" },
    { path: "/account/creche-bookings", icon: "bi-house-heart-fill", label: "Creche Bookings" },
    { path: "/account/orders", icon: "bi-bag-check-fill", label: "Orders", comingSoon: true },
    { path: "/account/addresses", icon: "bi-geo-alt-fill", label: "Addresses", comingSoon: true },
];

function Account() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const session = localStorage.getItem("session_id");
        const userData = localStorage.getItem("user_data");
        if (!session || !userData) {
            navigate("/login");
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        const sessionId = localStorage.getItem("session_id");
        if (sessionId) {
            try {
                await callServicesApi({
                    action: "LOGOUT",
                    session_id: sessionId
                });
            } catch (err) {
                console.error("Logout error:", err);
            }
        }
        localStorage.clear();
        navigate("/");
    };

    const isBaseRoute = location.pathname === "/account";
    const isAdmin = user?.user_type === "admin";

    return (
        <div className="account-page">
            {/* Header */}
            <div className="account-header">
                <div className="account-header-content">
                    <button className="account-back-btn" onClick={() => navigate("/")}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h1>My Account</h1>
                </div>
            </div>

            <div className="account-container">
                {/* Sidebar */}
                <aside className={`account-sidebar ${isBaseRoute ? "" : "hide-mobile"}`}>
                    {user && (
                        <div className="account-user-card">
                            <div className="account-avatar">
                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </div>
                            <div className="account-user-info">
                                <h3>{user.first_name} {user.last_name}</h3>
                                <p>{user.email}</p>
                            </div>
                        </div>
                    )}

                    <nav className="account-nav">
                        {MENU_ITEMS.map((item) => (
                            <Link
                                key={item.path}
                                to={item.comingSoon ? "#" : item.path}
                                className={`account-nav-item ${location.pathname === item.path ? "active" : ""} ${item.comingSoon ? "disabled" : ""}`}
                                onClick={(e) => item.comingSoon && e.preventDefault()}
                            >
                                <i className={`bi ${item.icon}`}></i>
                                <span>{item.label}</span>
                                {item.comingSoon && <span className="coming-soon-badge">Soon</span>}
                            </Link>
                        ))}

                        {isAdmin && (
                            <Link to="/admin" className="account-nav-item">
                                <i className="bi bi-shield-lock-fill"></i>
                                <span>Admin Panel</span>
                            </Link>
                        )}

                        <button className="account-nav-item logout" onClick={handleLogout} disabled={loggingOut}>
                            {loggingOut ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    <span>Logging out...</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-box-arrow-right"></i>
                                    <span>Logout</span>
                                </>
                            )}
                        </button>
                    </nav>
                </aside>

                {/* Content */}
                <main className={`account-content ${isBaseRoute ? "hide-mobile" : ""}`}>
                    {!isBaseRoute && (
                        <button className="account-content-back" onClick={() => { navigate("/account"); window.scrollTo(0, 0); }}>
                            <i className="bi bi-arrow-left"></i>
                            Back to menu
                        </button>
                    )}
                    
                    {isBaseRoute ? (
                        <div className="account-welcome">
                            <div className="account-welcome-icon">
                                <i className="bi bi-person-heart"></i>
                            </div>
                            <h2>Welcome{user ? `, ${user.first_name}` : ''}!</h2>
                            <p>Manage your profile, pets, and bookings all in one place.</p>
                            
                            <div className="account-quick-links">
                                {MENU_ITEMS.filter(item => !item.comingSoon).map((item) => (
                                    <Link key={item.path} to={item.path} className="account-quick-card">
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
    );
}

export default Account;