// src/admin/ManageBookings.jsx
import React, { useState, useEffect } from 'react';
import { callServicesApi } from '../assets/js/servicesApi';

const ManageBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [checkInFilter, setCheckInFilter] = useState("");
    const [checkOutFilter, setCheckOutFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");
    const handleModeChange = (e) => setModeFilter(e.target.value);
    const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
    const handleBookingStatusChange = (e) => setBookingStatusFilter(e.target.value);
    const today = new Date();
    const filteredBookings = bookings.filter(b => {
        const ms = !searchTerm ||
            b.kennel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.booking_id.toString().includes(searchTerm);
        const mIn = !checkInFilter ||
            new Date(b.check_in_date) >= new Date(checkInFilter);
        const mOut = !checkOutFilter ||
            new Date(b.check_out_date) <= new Date(checkOutFilter);
        const mm = modeFilter === "all" || modeFilter === b.mode;
        // existing past/upcoming filter
        const statusOk =
            statusFilter === "all" ||
            (statusFilter === "past"     && new Date(b.check_out_date) < today) ||
            (statusFilter === "upcoming" && new Date(b.check_in_date)  > today);
        // new booked/cancelled/completed filter
        const bsOk = bookingStatusFilter === "all" || bookingStatusFilter === b.status;

        return ms && mIn && mOut && mm && statusOk && bsOk;
    });

    useEffect(() => {
        async function fetchBookings() {
            try {
                const payload = {
                    action: "GET_BOOKINGS",
                    session_id: localStorage.getItem("session_id"),
                };
                const res = await callServicesApi(payload);
                if (res.success) {
                    console.log(res.bookings);
                    setBookings(res.bookings);
                } else if (res?.status_code === 498) {
                    localStorage.clear();
                    window.location.href = "/login";
                    return;
                } else {
                    console.log(res.message || "Failed to fetch bookings.");
                }
            } catch (err) {
                console.log("Error fetching bookings.", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBookings();
    }, []);

    return (
        <div className="container mt-4">
            <h2 className="mb-4">All Bookings</h2>
            <div className="row g-3 mb-3">
                <div className="col-lg-3">
                    <label className="form-label">Search</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="ID or Kennel Name"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-lg-3">
                    <label className="form-label">Check-In From</label>
                    <input
                        type="date"
                        className="form-control"
                        value={checkInFilter}
                        onChange={e => setCheckInFilter(e.target.value)}
                    />
                </div>
                <div className="col-lg-3">
                    <label className="form-label">Check-Out To</label>
                    <input
                        type="date"
                        className="form-control"
                        value={checkOutFilter}
                        onChange={e => setCheckOutFilter(e.target.value)}
                    />
                </div>
                <div className="col-md-3">
                    <label className="form-label">Timeline</label>
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="past">Past</option>
                        <option value="upcoming">Upcoming</option>
                    </select>
                </div>
                <div className="col-lg-3">
                    <label className="form-label">Mode</label>
                    <select
                        className="form-select"
                        value={modeFilter}
                        onChange={handleModeChange}
                    >
                        <option value="all">All</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>
                </div>
                <div className="col-lg-3">
                    <label className="form-label">Booking Status</label>
                    <select
                        className="form-select"
                        value={bookingStatusFilter}
                        onChange={handleBookingStatusChange}
                    >
                        <option value="all">All</option>
                        <option value="booked">Booked</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

            </div>
            {loading ? (
                <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filteredBookings.length === 0 === 0 ? (
                <div className="text-center my-5">No bookings found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Kennel</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Days</th>
                                <th>Total ₹</th>
                                <th>Mode</th>
                                <th>Status</th>
                                <th># Pets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map(b => (
                                    <tr key={b.booking_id}>
                                        <td>{b.booking_id}</td>
                                        <td>{b.kennel_name}</td>
                                        <td>{new Date(b.check_in_date).toLocaleDateString()}</td>
                                        <td>{new Date(b.check_out_date).toLocaleDateString()}</td>
                                        <td>{b.days}</td>
                                        <td>{b.total_price.toFixed(2)}</td>
                                        <td>{b.mode}</td>
                                        <td>{b.status}</td>
                                        <td>{b.pets?.length || 0}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center py-4">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageBookings;
