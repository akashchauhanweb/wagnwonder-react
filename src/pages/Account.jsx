import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";

function Account() {
    const navigate = useNavigate();
    const [_, setUser] = useState(null);
    useEffect(() => {
        const session = localStorage.getItem("session_id");
        const userData = localStorage.getItem("user_data");
        if (!session || !userData) {
            navigate("/login");
        } else {
            setUser(JSON.parse(userData));
        }
    }, []);

    function handleLogout() {
        localStorage.clear();
        navigate("/");
    }

    const location = useLocation();
    const isBaseAccountRoute = location.pathname === "/account";

    return (
        <div className="container my-4">
            <div className="row border">
                {/* Sidebar */}
                <div className={`col-md-4 border-md-end ${isBaseAccountRoute ? 'd-block' : 'd-none d-md-block'}`}>
                    <ul className="list-group list-group-flush">
                        <Link to="/account/orders" className="list-group-item list-group-item-action">
                            <i className="bi bi-bag-check me-2"></i> Your Orders
                        </Link>
                        <Link to="/account/creche-bookings" className="list-group-item list-group-item-action">
                            <i className="bi bi-house-heart me-2"></i> Your Creche Bookings
                        </Link>
                        <Link to="/account/pets" className="list-group-item list-group-item-action">
                            <i className="bi bi-heart-pulse me-2"></i> Your Pets
                        </Link>
                        <Link to="/account/info" className="list-group-item list-group-item-action">
                            <i className="bi bi-person me-2"></i> Your Personal Info
                        </Link>
                        <Link to="/account/addresses" className="list-group-item list-group-item-action">
                            <i className="bi bi-geo-alt me-2"></i> Your Addresses
                        </Link>
                        <Link to="/account/password" className="list-group-item list-group-item-action">
                            <i className="bi bi-shield-lock me-2"></i> Change Password
                        </Link>
                        {JSON.parse(localStorage.getItem("user_data"))?.user_type === "admin" && (
                            <Link to="/admin" className="list-group-item list-group-item-action">
                                <i className="bi bi-shield-lock me-2"></i> Admin Panel
                            </Link>
                        )}

                        <li
                            className="list-group-item list-group-item-action text-danger"
                            onClick={handleLogout}
                            style={{ cursor: "pointer" }}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i> Logout
                        </li>

                    </ul>
                </div>

                {/* Content Area */}
                <div className={`col-md-8 ${isBaseAccountRoute ? 'd-md-block d-none' : 'd-block'}`}>
                    <div className="p-4 text-muted">
                        <Outlet />
                    </div>
                </div>

            </div>
        </div>

    );
}

export default Account;
