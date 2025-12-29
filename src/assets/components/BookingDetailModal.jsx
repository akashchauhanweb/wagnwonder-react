import React from 'react';

const BookingDetailModal = ({ booking, onClose }) => {
    if (!booking) return null;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'booked': return 'status-booked';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    };

    const getModeBadgeClass = (mode) => {
        return mode === 'online' ? 'mode-online' : 'mode-offline';
    };

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="booking-modal-header">
                    <h3>Booking Details</h3>
                    <button onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="booking-modal-body">
                    <div className="modal-booking-header">
                        <div>
                            <h4>{booking.kennel_name}</h4>
                            <span className="modal-booking-id">Booking #{booking.booking_id}</span>
                        </div>
                        <span className={`booking-status-badge ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status}
                        </span>
                    </div>

                    <div className="modal-section">
                        <h5>Stay Details</h5>
                        <div className="modal-details-grid">
                            <div className="modal-detail">
                                <span className="detail-label">Check-in</span>
                                <span className="detail-value">{formatDate(booking.check_in_date)}</span>
                            </div>
                            <div className="modal-detail">
                                <span className="detail-label">Check-out</span>
                                <span className="detail-value">{formatDate(booking.check_out_date)}</span>
                            </div>
                            <div className="modal-detail">
                                <span className="detail-label">Duration</span>
                                <span className="detail-value">{booking.days} night{booking.days !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="modal-detail">
                                <span className="detail-label">Payment Mode</span>
                                <span className={`mode-badge ${getModeBadgeClass(booking.mode)}`}>
                                    {booking.mode}
                                </span>
                            </div>
                        </div>
                    </div>

                    {booking.pets?.length > 0 && (
                        <div className="modal-section">
                            <h5>Pets ({booking.pets.length})</h5>
                            <div className="modal-pets-list">
                                {booking.pets.map((pet, idx) => (
                                    <div key={idx} className="modal-pet-item">
                                        <div className="pet-avatar">
                                            <i className="bi bi-paw"></i>
                                        </div>
                                        <div className="pet-info">
                                            <span className="pet-name">{pet.pet_name}</span>
                                            <span className="pet-price">₹{pet.total_price} ({pet.days} days × ₹{pet.price_per_day}/day)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="modal-section">
                        <h5>Payment Summary</h5>
                        <div className="modal-payment-summary">
                            <div className="payment-row">
                                <span>Subtotal</span>
                                <span>₹{booking.total_price.toFixed(2)}</span>
                            </div>
                            <div className="payment-row total">
                                <span>Total Paid</span>
                                <span>₹{booking.total_price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {booking.order_id && (
                        <div className="modal-section">
                            <h5>Transaction Details</h5>
                            <div className="modal-details-grid">
                                <div className="modal-detail">
                                    <span className="detail-label">Order ID</span>
                                    <span className="detail-value">{booking.order_id}</span>
                                </div>
                                {booking.cf_order_id && (
                                    <div className="modal-detail">
                                        <span className="detail-label">CF Order ID</span>
                                        <span className="detail-value">{booking.cf_order_id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingDetailModal;