import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

export default function CrecheBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchBookings() {
            try {
                const user = JSON.parse(localStorage.getItem("user_data") || "{}");
                const payload = {
                    action: "GET_BOOKINGS",
                    session_id: localStorage.getItem("session_id"),
                    user_id: user.id,
                };
                console.log(payload);
                const res = await callServicesApi(payload);
                if (res.success) {
                    setBookings(res.bookings);
                } else {
                    setError(res.message || "Failed to fetch bookings.");
                }
            } catch {
                setError("Error fetching bookings.");
            } finally {
                setLoading(false);
            }
        }
        fetchBookings();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <div
                    className="spinner-border"
                    role="status"
                    style={{ width: "3rem", height: "3rem", color: "#471915" }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    if (!bookings.length) {
        return (
            <div className="container py-5 text-center">
                <p>No bookings found.</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h3 className="mb-4 fw-bold">My Creche Bookings</h3>
            <div className="row gy-4">
                {bookings.map((b) => (
                    <div key={b.booking_id} className="col-12">
                        <div className="card shadow-sm h-100">
                            <div className="card-body">
                                <h5 className="card-title fw-semibold">{b.kennel_name}</h5>

                                <div className="d-flex align-items-center mb-3">
                                    <i className="bi bi-calendar-event me-2 text-muted" />
                                    <span className="me-3">
                                        {new Date(b.check_in_date).toLocaleDateString()} - {new Date(b.check_out_date).toLocaleDateString()}
                                    </span>
                                    <span className="badge" style={{ backgroundColor: "#471915", color: "#fff" }}>
                                        {b.days} day{b.days > 1 ? "s" : ""}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <h6 className="fw-semibold mb-2">Pets</h6>
                                    <ul className="list-unstyled mb-0">
                                        {b.pets.map((p) => (
                                            <li key={p.pet_id} className="d-flex justify-content-between py-1">
                                                <span>
                                                    <i className="bi bi-paw me-1 text-muted" />{p.pet_name}
                                                </span>
                                                <span>
                                                    ₹{p.price_per_day} × {b.days} day = ₹{p.total_price}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">Total: ₹{b.total_price}</span>
                                    <span className="badge bg-success">{b.mode === "online" ? "Paid" : "Pending"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
