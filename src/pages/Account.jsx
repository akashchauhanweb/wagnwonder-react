import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";

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

    const handleLogout = () => {
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

                        <button className="account-nav-item logout" onClick={handleLogout}>
                            <i className="bi bi-box-arrow-right"></i>
                            <span>Logout</span>
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
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Account;