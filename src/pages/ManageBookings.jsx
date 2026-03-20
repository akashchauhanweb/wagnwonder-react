import React, { useState, useEffect } from 'react';
import { callServicesApi } from '../assets/js/servicesApi';
import BookingDetailModal from '../assets/components/BookingDetailModal';

const ManageBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [checkInFilter, setCheckInFilter] = useState("");
    const [checkOutFilter, setCheckOutFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modeFilter, setModeFilter] = useState("all");
    const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState(null);

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
        const statusOk =
            statusFilter === "all" ||
            (statusFilter === "past" && new Date(b.check_out_date) < today) ||
            (statusFilter === "upcoming" && new Date(b.check_in_date) > today);
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
                    setBookings(res.bookings);
                } else if (res?.status_code === 498) {
                    localStorage.clear();
                    window.location.href = "/login";
                    return;
                }
            } catch (err) {
                console.log("Error fetching bookings.", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBookings();
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'booked': return 'status-booked';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    const getModeClass = (mode) => {
        if (mode === 'wallet') return 'mode-wallet';
        if (mode === 'partial') return 'mode-partial';
        return mode === 'online' ? 'mode-online' : 'mode-offline';
    };

    const clearFilters = () => {
        setSearchTerm("");
        setCheckInFilter("");
        setCheckOutFilter("");
        setStatusFilter("all");
        setModeFilter("all");
        setBookingStatusFilter("all");
    };

    return (
        <div className="manage-bookings">
            <div className="manage-bookings-header">
                <h2>All Bookings</h2>
                <span className="manage-bookings-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Filters */}
            <div className="bookings-filters">
                <div className="filter-row">
                    <div className="filter-field search-field">
                        <label>Search</label>
                        <div className="filter-input-wrapper">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="ID or Kennel Name"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-field">
                        <label>Check-In From</label>
                        <input
                            type="date"
                            value={checkInFilter}
                            onChange={e => setCheckInFilter(e.target.value)}
                        />
                    </div>
                    <div className="filter-field">
                        <label>Check-Out To</label>
                        <input
                            type="date"
                            value={checkOutFilter}
                            onChange={e => setCheckOutFilter(e.target.value)}
                        />
                    </div>
                </div>
                <div className="filter-row">
                    <div className="filter-field">
                        <label>Timeline</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="past">Past</option>
                            <option value="upcoming">Upcoming</option>
                        </select>
                    </div>
                    <div className="filter-field">
                        <label>Mode</label>
                        <select
                            value={modeFilter}
                            onChange={e => setModeFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                        </select>
                    </div>
                    <div className="filter-field">
                        <label>Booking Status</label>
                        <select
                            value={bookingStatusFilter}
                            onChange={e => setBookingStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="booked">Booked</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="filter-field filter-actions">
                        <button className="clear-filters-btn" onClick={clearFilters}>
                            <i className="bi bi-x-circle"></i>
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="bookings-results-summary">
                Showing {filteredBookings.length} of {bookings.length} bookings
            </div>

            {/* Bookings Table */}
            {loading ? (
                <div className="manage-bookings-loading">
                    <div className="spinner-border" role="status" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="manage-bookings-empty">
                    <i className="bi bi-calendar-x"></i>
                    <p>No bookings found</p>
                </div>
            ) : (
                <div className="bookings-table-wrapper">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Kennel</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Days</th>
                                <th>Pets</th>
                                <th>Total</th>
                                <th>Mode</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map(booking => (
                                <tr key={booking.booking_id} onClick={() => setSelectedBooking(booking)}>
                                    <td className="booking-id-cell">#{booking.booking_id}</td>
                                    <td className="booking-kennel-cell">{booking.kennel_name}</td>
                                    <td>{formatDate(booking.check_in_date)}</td>
                                    <td>{formatDate(booking.check_out_date)}</td>
                                    <td>{booking.days}</td>
                                    <td>{booking.pets?.length || 0}</td>
                                    <td className="booking-total-cell">₹{booking.total_price.toFixed(0)}</td>
                                    <td>
                                        <span className={`mode-badge ${getModeClass(booking.mode)}`}>
                                            {booking.mode === 'partial' ? 'Wallet + Online' : booking.mode.charAt(0).toUpperCase() + booking.mode.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`booking-status-badge ${getStatusClass(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Booking Detail Modal */}
            <BookingDetailModal 
                booking={selectedBooking} 
                onClose={() => setSelectedBooking(null)} 
            />
        </div>
    );
};

export default ManageBookings;