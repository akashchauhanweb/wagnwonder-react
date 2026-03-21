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
            case 'no_show': return 'status-no-show';
            default: return '';
        }
    };

    const getModeBadgeClass = (mode) => {
        if (mode === 'wallet') return 'mode-wallet';
        if (mode === 'partial') return 'mode-partial';
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
                            {booking.status === "checked_in" ? "Checked In" : booking.status === "no_show" ? "No Show" : booking.status}
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
                                    {booking.mode === 'partial' ? 'Wallet + Online' : booking.mode.charAt(0).toUpperCase() + booking.mode.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {booking.pets?.length > 0 && (
                        <div className="modal-section">
                            <h5>Pets ({booking.pets.length})</h5>
                            <div className="modal-pets-list">
                                {booking.pets.map((pet, idx) => (
                                    <div key={idx} className="modal-pet-card">
                                        <div className="modal-pet-header">
                                            <div className="pet-avatar">
                                                {pet.pet_photo ? (
                                                    <img src={pet.pet_photo} alt={pet.pet_name} />
                                                ) : (
                                                    <i className="bi bi-heart-pulse-fill"></i>
                                                )}
                                            </div>
                                            <div className="pet-header-info">
                                                <span className="pet-name">{pet.pet_name}</span>
                                                <div className="pet-badges">
                                                    <span className={`type-badge ${pet.pet_type}`}>
                                                        {pet.pet_type?.charAt(0).toUpperCase() + pet.pet_type?.slice(1)}
                                                    </span>
                                                    <span className={`aggression-badge ${pet.pet_aggression}`}>
                                                        {pet.pet_aggression?.charAt(0).toUpperCase() + pet.pet_aggression?.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-pet-details">
                                            <div className="pet-detail-item">
                                                <span className="label">Breed</span>
                                                <span className="value">{pet.pet_breed}</span>
                                            </div>
                                            <div className="pet-detail-item">
                                                <span className="label">Age</span>
                                                <span className="value">{pet.pet_age} yr{pet.pet_age !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="pet-detail-item">
                                                <span className="label">Weight</span>
                                                <span className="value">
                                                    {pet.pet_weight === "below 15kgs" ? "< 15 kg" : 
                                                     pet.pet_weight === "above 15kgs and below 40kgs" ? "15-40 kg" : 
                                                     pet.pet_weight === "above 40kgs" ? "> 40 kg" : pet.pet_weight}
                                                </span>
                                            </div>
                                            <div className="pet-detail-item">
                                                <span className="label">Gender</span>
                                                <span className="value">{pet.pet_gender?.charAt(0).toUpperCase() + pet.pet_gender?.slice(1)}</span>
                                            </div>
                                        </div>
                                        <div className="modal-pet-pricing">
                                            <span className="pet-price">₹{pet.total_price}</span>
                                            <span className="pet-price-breakdown">({booking.days} days × ₹{pet.price_per_day}/day)</span>
                                        </div>
                                        {pet.pet_vaccine_card && (
                                            <div className="modal-pet-vaccine">
                                                <span className="vaccine-label">
                                                    <i className="bi bi-file-medical"></i>
                                                    Vaccine Card
                                                </span>
                                                <a href={pet.pet_vaccine_card} target="_blank" rel="noopener noreferrer" className="vaccine-link">
                                                    <img src={pet.pet_vaccine_card} alt="Vaccine Card" />
                                                    <span className="vaccine-view">
                                                        <i className="bi bi-eye"></i>
                                                        View Full
                                                    </span>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="modal-section">
                        <h5>Payment Summary</h5>
                        <div className="modal-payment-summary">
                            {parseFloat(booking.discount_amount || 0) > 0 && (
                                <>
                                    <div className="payment-row">
                                        <span>Subtotal</span>
                                        <span>₹{(parseFloat(booking.total_price) + parseFloat(booking.discount_amount)).toFixed(2)}</span>
                                    </div>
                                    <div className="payment-row" style={{ color: "#059669" }}>
                                        <span><i className="bi bi-tag me-1"></i>Coupon{booking.coupon_code ? ` (${booking.coupon_code})` : ""}</span>
                                        <span>−₹{parseFloat(booking.discount_amount).toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            {!parseFloat(booking.discount_amount || 0) && (
                                <div className="payment-row">
                                    <span>Subtotal</span>
                                    <span>₹{parseFloat(booking.total_price).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="payment-row total">
                                <span>Total Paid</span>
                                <span>₹{parseFloat(booking.total_price).toFixed(2)}</span>
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