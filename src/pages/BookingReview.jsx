import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";


export default function BookingReview() {
    const location = useLocation();
    const navigate = useNavigate();
    const { kennel, checkin, checkout, breakdown, total, days, room_type_id, errorMessage } = location.state || {};
    const [error, _] = useState(errorMessage || "");

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    if (!kennel || !checkin || !checkout || !breakdown || !total || !days  || !room_type_id) {
        console.warn("Missing one of:", { kennel, checkin, checkout, breakdown, total, days, room_type_id });
        return (
            <div className="container py-5">
                <p className="text-danger">Missing booking information.</p>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const handlePayNow = async () => {
        localStorage.setItem(
            "pending_booking",
            JSON.stringify({ kennel, checkin, checkout, breakdown, total, days, room_type_id })
        );
        try {
            // 2.1 Create order on your backend
            let customer_data = JSON.parse(localStorage.getItem("user_data"));
            let payload = {
                action: "CREATE_PAYMENT_SESSION",
                session_id: localStorage.getItem("session_id"),
                customer_id: customer_data.id.toString().padStart(3, '0'),
                customer_phone: customer_data.phone_number,
                order_amount: total
            }
            const data = await callServicesApi(payload);
            if (!data.payment_session_id) {
                console.error("Missing payment_session_id", data);
                console.log(data.status_code);
                return;
            }
            // 2.2 Launch Cashfree Checkout
            const cashfree = window.Cashfree({ mode: "sandbox" });  // or "production"
            cashfree.checkout({
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_self",
                returnUrl: `${window.location.origin}/payment-status?order_id={order_id}`
            });
        } catch (err) {
            console.error("Error creating payment order:", err);
        }
    };

    return (
        <div className="container py-5">
            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                    {error}
                </div>
            )}

            <h3 className="mb-4 fw-bold">Booking Review</h3>

            {/* Kennel Info */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-2" style={{ color: "#471915" }}>Kennel</h5>
                    <p className="mb-0 fw-semibold">{kennel.kennel_name}</p>
                </div>
            </div>

            {/* Dates */}
            <div className="card mb-4">
                <div className="card-body d-flex justify-content-between">
                    <div>
                        <h6 className="text-muted">Check-in</h6>
                        <p className="mb-0 fw-semibold">{new Date(checkin).toDateString()}</p>
                    </div>
                    <div>
                        <h6 className="text-muted">Check-out</h6>
                        <p className="mb-0 fw-semibold">{new Date(checkout).toDateString()}</p>
                    </div>
                    <div>
                        <h6 className="text-muted">Duration</h6>
                        <p className="mb-0 fw-semibold">{days} day(s)</p>
                    </div>
                </div>
            </div>

            {/* Pets */}
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3" style={{ color: "#471915" }}>Pets</h5>
                    {breakdown.map((p) => (
                        <div key={p.id} className="d-flex justify-content-between border-bottom py-2">
                            <div>
                                <strong>{p.name}</strong> <span className="badge bg-secondary ms-2">{p.breed}</span>
                                <div className="text-muted small">Weight: {p.weight}</div>
                            </div>
                            <div className="text-end">
                                <div>₹{p.perDay} / day</div>
                                <div className="fw-semibold">₹{p.total}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Total + Pay */}
            <div className="card mb-4" style={{ border: "2px solid #471915" }}>
                <div className="card-body d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        Total: <span className="fw-bold" style={{ color: "#471915" }}>₹{total}</span>
                    </h5>
                    <button
                        className="btn btn-lg"
                        style={{ backgroundColor: "#471915", color: "#fff" }}
                        onClick={handlePayNow}
                    >
                        Pay Now
                    </button>
                </div>
            </div>
        </div>

    );
}
