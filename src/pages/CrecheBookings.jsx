import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import { getCancellationEmailHtml } from "../assets/js/cancellationEmail";
import Pagination from "../assets/components/Pagination";

export default function CrecheBookings() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("active");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelBooking, setCancelBooking] = useState(null);
    const [cancelPreview, setCancelPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [refundMethod, setRefundMethod] = useState("wallet");
    const [processingCancel, setProcessingCancel] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const openCancelModal = async (booking) => {
        setCancelBooking(booking);
        setCancelPreview(null);
        setRefundMethod("wallet");
        setShowCancelModal(true);
        setLoadingPreview(true);
        try {
            const res = await callServicesApi({
                action: "CANCEL_BOOKING",
                session_id: localStorage.getItem("session_id"),
                booking_id: booking.booking_id,
                refund_method: "wallet",
                preview: true
            });
            if (res?.success && res.preview) {
                setCancelPreview(res);
            }
        } catch (err) {
            console.error("Error fetching cancel preview:", err);
        } finally {
            setLoadingPreview(false);
        }
    };

    const updatePreview = async (method) => {
        setRefundMethod(method);
        if (!cancelBooking) return;
        setLoadingPreview(true);
        try {
            const res = await callServicesApi({
                action: "CANCEL_BOOKING",
                session_id: localStorage.getItem("session_id"),
                booking_id: cancelBooking.booking_id,
                refund_method: method,
                preview: true
            });
            if (res?.success && res.preview) {
                setCancelPreview(res);
            }
        } catch (err) {
            console.error("Error updating preview:", err);
        } finally {
            setLoadingPreview(false);
        }
    };

    const confirmCancel = async () => {
        if (!cancelBooking) return;
        setProcessingCancel(true);
        try {
            const res = await callServicesApi({
                action: "CANCEL_BOOKING",
                session_id: localStorage.getItem("session_id"),
                booking_id: cancelBooking.booking_id,
                refund_method: refundMethod
            });
            if (res?.success) {
                setBookings(prev => prev.map(b =>
                    b.booking_id === cancelBooking.booking_id ? { ...b, status: res.new_status || "cancelled" } : b
                ));
                localStorage.removeItem("bookings");

                // Send cancellation email
                try {
                    const user = JSON.parse(localStorage.getItem("user_data") || "{}");
                    const refundSummary = res.refund_summary || {};
                    await callServicesApi({
                        action: "SEND_EMAIL",
                        session_id: localStorage.getItem("session_id"),
                        email: user.email,
                        subject: res.new_status === "no_show" ? "Booking No-Show - Wag N Wonder" : "Booking Cancelled - Wag N Wonder",
                        html: getCancellationEmailHtml({
                            userName: `${user.first_name} ${user.last_name}`,
                            kennelName: cancelBooking.kennel_name,
                            bookingId: cancelBooking.booking_id,
                            checkIn: formatDate(cancelBooking.check_in_date),
                            checkOut: formatDate(cancelBooking.check_out_date),
                            days: cancelBooking.days,
                            pets: cancelBooking.pets?.map(p => ({ name: p.pet_name, breed: p.pet_breed })) || [],
                            totalPrice: cancelBooking.total_price,
                            cancellationFee: refundSummary.cancellation_fee || 0,
                            walletRefund: refundSummary.wallet_refund || 0,
                            onlineRefund: refundSummary.online_refund || 0,
                            refundMethod: refundSummary.refund_method || "wallet",
                            isNoShow: refundSummary.no_show || false
                        })
                    });
                } catch (e) { console.error("Failed to send cancellation email:", e); }
                // Refresh wallet balance from DB
                try {
                    const user = JSON.parse(localStorage.getItem("user_data") || "{}");
                    const walletRes = await callServicesApi({
                        action: "GET_WALLET_BALANCE",
                        session_id: localStorage.getItem("session_id"),
                        user_id: user.id
                    });
                    if (walletRes?.success) localStorage.setItem("woof_balance", walletRes.balance);
                } catch (e) { console.error("Failed to refresh wallet balance:", e); }
                setShowCancelModal(false);
                setCancelBooking(null);
                setCancelPreview(null);
                setActiveFilter("cancelled");
            } else {
                alert(res?.message || "Failed to cancel booking.");
            }
        } catch (err) {
            console.error("Error cancelling:", err);
            alert("Something went wrong.");
        } finally {
            setProcessingCancel(false);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("user_data") || "{}");
            const payload = {
                action: "GET_BOOKINGS",
                session_id: localStorage.getItem("session_id"),
                user_id: user.id,
            };
            const res = await callServicesApi(payload);
            if (res.success) {
                setBookings(res.bookings);
                localStorage.setItem("bookings", JSON.stringify(res.bookings));
            } else {
                setError(res.message || "Failed to fetch bookings.");
            }
        } catch {
            setError("Error fetching bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cachedBookings = localStorage.getItem("bookings");
        if (cachedBookings) {
            setBookings(JSON.parse(cachedBookings));
            setLoading(false);
        } else {
            fetchBookings();
        }
    }, []);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'booked': return 'status-booked';
            case 'checked_in': return 'status-checked-in';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            case 'no_show': return 'status-no-show';
            default: return '';
        }
    };

    return (
        <div className="creche-bookings">
            <div className="bookings-header">
                <h2>Your Bookings</h2>
                {!loading && <span className="bookings-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>}
            </div>

            <div className="event-bookings-filters">
                <button
                    className={activeFilter === "active" ? "active" : ""}
                    onClick={() => { setActiveFilter("active"); setCurrentPage(1); }}
                >
                    Active
                </button>
                <button
                    className={activeFilter === "past" ? "active" : ""}
                    onClick={() => { setActiveFilter("past"); setCurrentPage(1); }}
                >
                    Past
                </button>
                <button
                    className={activeFilter === "cancelled" ? "active" : ""}
                    onClick={() => { setActiveFilter("cancelled"); setCurrentPage(1); }}
                >
                    Cancelled
                </button>
            </div>

            {loading ? (
                <div className="bookings-loading">
                    <div className="spinner-border" role="status" />
                </div>
            ) : error ? (
                <div className="bookings-error">
                    <i className="bi bi-exclamation-circle"></i>
                    <p>{error}</p>
                </div>
            ) : bookings.filter(b => {
                if (activeFilter === "active") return b.status === "booked" || b.status === "checked_in";
                if (activeFilter === "past") return b.status === "completed";
                if (activeFilter === "cancelled") return b.status === "cancelled" || b.status === "no_show";
                return false;
            }).length === 0 ? (
                <div className="bookings-empty">
                    <div className="bookings-empty-icon">
                        <i className="bi bi-calendar-x"></i>
                    </div>
                    <h3>No {activeFilter} bookings</h3>
                    <p>{activeFilter === "active" ? "When you book a stay for your pet, it will appear here." : activeFilter === "past" ? "Your completed bookings will appear here." : "No cancelled bookings."}</p>
                </div>
            ) : (
                <div className="bookings-list">
                    {(() => {
                        const filtered = bookings.filter(b => {
                            if (activeFilter === "active") return b.status === "booked" || b.status === "checked_in";
                            if (activeFilter === "past") return b.status === "completed";
                            if (activeFilter === "cancelled") return b.status === "cancelled" || b.status === "no_show";
                            return false;
                        });
                        const totalPages = Math.ceil(filtered.length / itemsPerPage);
                        const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                        return (<>
                            {paginated.map((booking) => {
                                const isActive = booking.status === "booked" || booking.status === "checked_in";
                                const isCompleted = booking.status === "completed";
                                const isCancelled = booking.status === "cancelled" || booking.status === "no_show";

                                return (
                                    <div key={booking.booking_id} className={`booking-card ${isCancelled ? "booking-card-cancelled" : ""}`}>
                                        {/* Top accent bar */}
                                        <div className={`booking-card-accent ${isActive ? "accent-active" : isCompleted ? "accent-completed" : "accent-cancelled"}`}></div>

                                        <div className="booking-card-inner">
                                            {/* Header: Kennel + Status + ID */}
                                            <div className="booking-card-header">
                                                <div className="booking-kennel">
                                                    <div className="booking-kennel-icon">
                                                        <i className="bi bi-house-heart-fill"></i>
                                                    </div>
                                                    <div>
                                                        <span className="booking-kennel-name">{booking.kennel_name}</span>
                                                        <span className="booking-id-inline">#{booking.booking_id}</span>
                                                    </div>
                                                </div>
                                                <span className={`booking-status ${getStatusColor(booking.status)}`}>
                                                    {booking.status === "checked_in" ? "Checked In" : booking.status === "no_show" ? "No Show" : booking.status}
                                                </span>
                                            </div>

                                            {/* Stay details grid */}
                                            <div className="booking-stay-grid">
                                                <div className="booking-stay-item">
                                                    <i className="bi bi-box-arrow-in-right"></i>
                                                    <div>
                                                        <span className="stay-label">Check-in</span>
                                                        <span className="stay-value">{formatDate(booking.check_in_date)}</span>
                                                    </div>
                                                </div>
                                                <div className="booking-stay-item">
                                                    <i className="bi bi-box-arrow-right"></i>
                                                    <div>
                                                        <span className="stay-label">Check-out</span>
                                                        <span className="stay-value">{formatDate(booking.check_out_date)}</span>
                                                    </div>
                                                </div>
                                                <div className="booking-stay-item">
                                                    <i className="bi bi-moon-fill"></i>
                                                    <div>
                                                        <span className="stay-label">Duration</span>
                                                        <span className="stay-value">{booking.days} night{booking.days !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pets */}
                                            <div className="booking-pets-section">
                                                {booking.pets.map((pet) => (
                                                    <div key={pet.pet_id} className="booking-pet-chip">
                                                        <div className="pet-chip-avatar">
                                                            {pet.pet_photo ? (
                                                                <img src={pet.pet_photo} alt={pet.pet_name} />
                                                            ) : (
                                                                <i className="bi bi-heart-pulse-fill"></i>
                                                            )}
                                                        </div>
                                                        <div className="pet-chip-info">
                                                            <span className="pet-chip-name">{pet.pet_name}</span>
                                                            <span className="pet-chip-breed">{pet.pet_breed}</span>
                                                        </div>
                                                        <span className="pet-chip-price">₹{pet.total_price}</span>
                                                    </div>
                                                ))}

                                                {/* Consolidated extension line */}
                                                {booking.extensions?.length > 0 && (() => {
                                                    const totalExtraDays = booking.extensions.reduce((sum, ext) => sum + ext.extra_days, 0);
                                                    const totalAmount = booking.extensions.reduce((sum, ext) => sum + parseFloat(ext.amount), 0);
                                                    const paidCount = booking.extensions.filter(ext => ext.payment_status === "paid").length;
                                                    const totalCount = booking.extensions.length;

                                                    let paymentLabel, paymentColor;
                                                    if (paidCount === totalCount) {
                                                        paymentLabel = "Paid";
                                                        paymentColor = "#059669";
                                                    } else if (paidCount > 0) {
                                                        paymentLabel = "Partially Paid";
                                                        paymentColor = "#d97706";
                                                    } else {
                                                        paymentLabel = "Not Paid";
                                                        paymentColor = "#dc2626";
                                                    }

                                                    return (
                                                        <div className="booking-extension-chip">
                                                            <div className="extension-chip-icon">
                                                                <i className="bi bi-calendar-plus"></i>
                                                            </div>
                                                            <div className="pet-chip-info">
                                                                <span className="pet-chip-name">Extension (+{totalExtraDays} night{totalExtraDays !== 1 ? 's' : ''})</span>
                                                                <span className="pet-chip-breed" style={{ color: paymentColor }}>{paymentLabel}</span>
                                                            </div>
                                                            <span className="pet-chip-price">₹{totalAmount.toFixed(2)}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Footer: Total */}
                                            <div className="booking-footer">
                                                <div className="booking-mode">
                                                    <i className={`bi ${booking.mode === "wallet" ? "bi-wallet2" : booking.mode === "partial" ? "bi-wallet2" : booking.mode === "online" ? "bi-globe" : "bi-shop"}`}></i>
                                                    {booking.mode === "wallet" ? "Wallet" : booking.mode === "partial" ? "Wallet + Online" : booking.mode === "online" ? "Online" : "Offline"}
                                                </div>
                                                <div className="booking-total">
                                                    <span>Total</span>
                                                    <span className="total-amount">₹{booking.total_price}</span>
                                                </div>
                                            </div>

                                            {/* Refund summary for cancelled/no-show */}
                                            {isCancelled && booking.refund && (
                                                <div style={{
                                                    padding: "12px 14px", borderRadius: "10px", marginTop: "10px",
                                                    background: booking.status === "no_show" ? "#fef2f2" : "#f8fafc",
                                                    border: `1px solid ${booking.status === "no_show" ? "#fecaca" : "#e2e8f0"}`,
                                                    fontSize: "0.82rem"
                                                }}>
                                                    <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <i className="bi bi-receipt" style={{ color: "#64748b" }}></i>
                                                        Refund Details
                                                    </div>
                                                    {booking.status === "no_show" ? (
                                                        <div style={{ color: "#dc2626" }}>
                                                            No refund — booking was marked as no-show.
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                            {(() => {
                                                                const walletRefund = parseFloat(booking.refund.wallet_refund_amount || 0);
                                                                const onlineRefund = parseFloat(booking.refund.online_refund_amount || 0);
                                                                const method = booking.refund.refund_method;
                                                                const totalToWallet = method === "wallet" ? walletRefund + onlineRefund : walletRefund;
                                                                const toOriginal = method === "original" ? onlineRefund : 0;

                                                                return (
                                                                    <>
                                                                        {totalToWallet > 0 && (
                                                                            <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                                                                                <span><i className="bi bi-wallet2 me-1" style={{ color: "#7c3aed" }}></i>Refunded to Wallet</span>
                                                                                <span style={{ fontWeight: 600, color: "#059669" }}>₹{Math.round(totalToWallet)}</span>
                                                                            </div>
                                                                        )}
                                                                        {toOriginal > 0 && (
                                                                            <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                                                                                <span><i className="bi bi-credit-card me-1" style={{ color: "#2563eb" }}></i>Refunded to Original Payment</span>
                                                                                <div style={{ textAlign: "right" }}>
                                                                                    <span style={{ fontWeight: 600, color: "#059669" }}>₹{Math.round(toOriginal)}</span>
                                                                                    {booking.refund.cashfree_refund_status && (
                                                                                        <span style={{
                                                                                            marginLeft: "6px", padding: "1px 6px", borderRadius: "6px",
                                                                                            fontSize: "0.7rem", fontWeight: 600,
                                                                                            background: booking.refund.cashfree_refund_status === "processed" ? "#dcfce7" : booking.refund.cashfree_refund_status === "failed" ? "#fee2e2" : "#fef3c7",
                                                                                            color: booking.refund.cashfree_refund_status === "processed" ? "#166534" : booking.refund.cashfree_refund_status === "failed" ? "#991b1b" : "#92400e"
                                                                                        }}>
                                                                                            {booking.refund.cashfree_refund_status === "processed" ? "Completed" : booking.refund.cashfree_refund_status === "failed" ? "Failed" : "Processing"}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {parseFloat(booking.refund.cancellation_fee) > 0 && (
                                                                            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", marginTop: "2px", paddingTop: "4px", borderTop: "1px dashed #e2e8f0" }}>
                                                                                <span>Cancellation Fee ({Math.round(parseFloat(booking.refund.cancellation_fee_percent))}%)</span>
                                                                                <span>₹{Math.round(parseFloat(booking.refund.cancellation_fee))}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Action buttons */}
                                            {!isCompleted && !isCancelled && (
                                                <div className="booking-actions">
                                                    {booking.kennel_lat && booking.kennel_lng && (
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${booking.kennel_lat},${booking.kennel_lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="booking-action-btn"
                                                        >
                                                            <i className="bi bi-geo-alt"></i>
                                                            Get Directions
                                                        </a>
                                                    )}
                                                    {booking.owner_phone && (
                                                        <a
                                                            href={`tel:${booking.owner_phone}`}
                                                            className="booking-action-btn"
                                                        >
                                                            <i className="bi bi-telephone"></i>
                                                            Call Kennel
                                                        </a>
                                                    )}
                                                    <button
                                                        className="booking-action-btn"
                                                        onClick={() => navigate("/account/my-tickets", {
                                                            state: {
                                                                prefillTicket: {
                                                                    subject: "booking",
                                                                    message: `Help needed for Booking #${booking.booking_id}\nKennel: ${booking.kennel_name}\nCheck-in: ${formatDate(booking.check_in_date)}\nCheck-out: ${formatDate(booking.check_out_date)}\nPets: ${booking.pets?.map(p => p.pet_name).join(", ")}\n\nIssue: `,
                                                                    booking_id: booking.booking_id
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <i className="bi bi-life-preserver"></i>
                                                        Help
                                                    </button>
                                                    {booking.status === "booked" && (
                                                        <button
                                                            className="booking-action-btn booking-cancel-btn"
                                                            onClick={(e) => { e.stopPropagation(); openCancelModal(booking); }}
                                                        >
                                                            <i className="bi bi-x-circle"></i> Cancel Booking
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Post-checkout actions (3 days after checkout) */}
                                            {isCompleted && (() => {
                                                const checkoutDate = new Date(booking.check_out_date);
                                                const threeDaysAfter = new Date(checkoutDate);
                                                threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
                                                return new Date() <= threeDaysAfter;
                                            })() && (
                                                <div className="booking-actions">
                                                    <button
                                                        className="booking-action-btn"
                                                        onClick={() => navigate("/account/my-tickets", {
                                                            state: {
                                                                prefillTicket: {
                                                                    subject: "booking",
                                                                    message: `Help needed for Booking #${booking.booking_id}\nKennel: ${booking.kennel_name}\nCheck-in: ${formatDate(booking.check_in_date)}\nCheck-out: ${formatDate(booking.check_out_date)}\nPets: ${booking.pets?.map(p => p.pet_name).join(", ")}\n\nIssue: `,
                                                                    booking_id: booking.booking_id
                                                                }
                                                            }
                                                        })}
                                                    >
                                                        <i className="bi bi-life-preserver"></i>
                                                        Help
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={filtered.length}
                                theme="user"
                            />
                        </>);
                    })()}
                </div>
            )}

            {/* Cancel & Refund Modal */}
            {showCancelModal && cancelBooking && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "20px"
                }} onClick={() => !processingCancel && setShowCancelModal(false)}>
                    <div style={{
                        background: "white", borderRadius: "16px", maxWidth: "480px",
                        width: "100%", maxHeight: "90vh", overflowY: "auto"
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{
                            padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Cancel Booking</h3>
                            <button onClick={() => !processingCancel && setShowCancelModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#94a3b8" }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div style={{ padding: "20px 24px" }}>
                            {/* Booking info */}
                            <div style={{
                                padding: "14px 16px", borderRadius: "10px",
                                background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px"
                            }}>
                                <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" }}>
                                    #{cancelBooking.booking_id} · {cancelBooking.kennel_name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                                    {formatDate(cancelBooking.check_in_date)} → {formatDate(cancelBooking.check_out_date)} · ₹{cancelBooking.total_price}
                                </div>
                            </div>

                            {loadingPreview ? (
                                <div style={{ textAlign: "center", padding: "30px 0" }}>
                                    <div className="spinner-border spinner-border-sm"></div>
                                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "10px" }}>Calculating refund...</p>
                                </div>
                            ) : cancelPreview ? (
                                <>
                                    {/* Time warning */}
                                    <div style={{
                                        padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
                                        background: cancelPreview.no_show ? "#1e293b" : cancelPreview.hours_before_checkin < 72 ? "#fef2f2" : "#f0fdf4",
                                        border: `1px solid ${cancelPreview.no_show ? "#1e293b" : cancelPreview.hours_before_checkin < 72 ? "#fecaca" : "#bbf7d0"}`,
                                        fontSize: "0.82rem",
                                        color: cancelPreview.no_show ? "#ffffff" : cancelPreview.hours_before_checkin < 72 ? "#dc2626" : "#059669"
                                    }}>
                                        <i className={`bi ${cancelPreview.no_show ? "bi-exclamation-octagon" : cancelPreview.hours_before_checkin < 72 ? "bi-exclamation-triangle" : "bi-clock"} me-2`}></i>
                                        {cancelPreview.no_show
                                            ? "Check-in date has passed. No refund will be issued."
                                            : cancelPreview.hours_before_checkin < 72
                                                ? "Less than 72 hours before check-in — higher cancellation fee applies."
                                                : "More than 72 hours before check-in — lower cancellation fee applies."
                                        }
                                    </div>

                                    {/* Refund method selection */}
                                    {!cancelPreview.no_show && (
                                        <div style={{ marginBottom: "20px" }}>
                                            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", marginBottom: "10px" }}>
                                                {cancelPreview.online_portion > 0 ? "Refund online payment to:" : "Refund to:"}
                                            </p>
                                            {[
                                                { value: "wallet", label: "Woof Wallet", sublabel: "Instant refund", icon: "bi-wallet2", color: "#7c3aed" },
                                                ...(cancelPreview.booking_mode !== "wallet" ? [{ value: "original", label: "Original Payment", sublabel: "5-7 business days", icon: "bi-credit-card", color: "#2563eb" }] : [])
                                            ].map(opt => (
                                                <div key={opt.value}
                                                    onClick={() => updatePreview(opt.value)}
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: "12px",
                                                        padding: "14px 16px", borderRadius: "10px", marginBottom: "8px",
                                                        border: refundMethod === opt.value ? `2px solid ${opt.color}` : "1px solid #e2e8f0",
                                                        background: refundMethod === opt.value ? `${opt.color}08` : "white",
                                                        cursor: "pointer", transition: "all 0.15s"
                                                    }}
                                                >
                                                    <div style={{
                                                        width: "18px", height: "18px", borderRadius: "50%",
                                                        border: refundMethod === opt.value ? `5px solid ${opt.color}` : "2px solid #cbd5e1",
                                                        flexShrink: 0
                                                    }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>
                                                            <i className={`bi ${opt.icon} me-2`}></i>{opt.label}
                                                        </div>
                                                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{opt.sublabel}</div>
                                                    </div>
                                                    <span style={{
                                                        padding: "2px 8px", borderRadius: "8px", fontSize: "0.72rem",
                                                        fontWeight: 600, background: "#f0fdf4", color: "#059669"
                                                    }}>
                                                        {opt.value === "wallet" ? `${cancelPreview.wallet_rate}% fee` : `${cancelPreview.original_rate}% fee`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Refund breakdown */}
                                    <div style={{
                                        background: "#f8fafc", borderRadius: "10px", padding: "16px",
                                        border: "1px solid #e2e8f0", marginBottom: "20px"
                                    }}>
                                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b", marginBottom: "10px" }}>Refund Breakdown</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>
                                            <span>Booking Total</span>
                                            <span>₹{cancelPreview.total_price}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#dc2626", marginBottom: "6px" }}>
                                            <span>Cancellation Fee</span>
                                            <span>−₹{cancelPreview.total_fee}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem", fontWeight: 700, color: "#059669", paddingTop: "8px", borderTop: "1px dashed #e2e8f0" }}>
                                            <span>You Get Back</span>
                                            <span>₹{cancelPreview.total_refund}</span>
                                        </div>
                                        {cancelPreview.wallet_refund > 0 && cancelPreview.online_refund > 0 && (
                                            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "8px" }}>
                                                <div>Wallet: ₹{cancelPreview.wallet_refund} (instant)</div>
                                                <div>{refundMethod === "wallet" ? "Wallet" : "Original"}: ₹{cancelPreview.online_refund} ({refundMethod === "wallet" ? "instant" : "5-7 days"})</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button onClick={() => setShowCancelModal(false)} disabled={processingCancel}
                                            style={{
                                                flex: 1, padding: "12px", borderRadius: "10px",
                                                border: "1px solid #e2e8f0", background: "white",
                                                color: "#475569", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                                            }}>
                                            Keep Booking
                                        </button>
                                        <button onClick={confirmCancel} disabled={processingCancel}
                                            style={{
                                                flex: 1, padding: "12px", borderRadius: "10px",
                                                border: "none", background: "#dc2626",
                                                color: "white", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                                            }}>
                                            {processingCancel ? (
                                                <><span className="spinner-border spinner-border-sm"></span> Cancelling...</>
                                            ) : (
                                                <><i className="bi bi-x-circle"></i> Cancel & Refund</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "20px", color: "#dc2626" }}>
                                    <p>Failed to load refund details. Please try again.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}