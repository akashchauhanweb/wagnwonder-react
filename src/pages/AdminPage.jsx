import React from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";

const AdminPage = () => {
    const location = useLocation();
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
        <div className="container my-4">
            <div className="row border">
                <div className="col-md-4 border-end">
                    <ul className="list-group list-group-flush">
                        <Link to="/admin/manage-products" className="list-group-item list-group-item-action">
                            <i className="bi bi-box"></i> Manage Products
                        </Link>
                        <Link to="/admin/manage-users" className="list-group-item list-group-item-action">
                            <i className="bi bi-people"></i> Manage Users
                        </Link>
                        <Link to="/admin/manage-bookings" className="list-group-item list-group-item-action">
                            <i className="bi bi-calendar-check"></i> View Bookings
                        </Link>
                        {/* Add more links as needed */}
                    </ul>
                </div>
                <div className={`py-4 px-5 bg-light rounded shadow-sm col-md-8 ${isBaseAdminRoute ? 'd-md-block d-none' : 'd-block'}`}>
                    {isBaseAdminRoute ? (
                        <>
                            <div className="d-flex align-items-center mb-3">
                                <i className="bi bi-person-badge-fill fs-3 text-primary me-3"></i>
                                <h3 className="m-0">Welcome, {userData.first_name}!</h3>
                            </div>
                            <p className="text-muted">Manage your dashboard using the menu on the left.</p>
                        </>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
