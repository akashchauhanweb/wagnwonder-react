import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

export default function PaymentStatus() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading"); // "loading" | "paid" | "failed"
    const [message, setMessage] = useState("");

    // parse query params Cashfree returns
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId") || params.get("order_id");
    //   const paymentSessionId   = params.get("paymentSessionId") || params.get("payment_session_id");
    //   const txStatus           = params.get("txStatus");
    //   const txMsg              = params.get("txMsg");

    // retry payment by reloading booking data
    const handleRetry = () => {
        const saved = localStorage.getItem("pending_booking");
        if (saved) {
            const booking = JSON.parse(saved);
            navigate("/booking-review", {
                state: {
                    ...booking,
                    errorMessage: "Your payment failed. Please try again."
                }
            });
        } else {
            alert("No pending booking found. Please start your booking again.");
        }
    };

    useEffect(() => {
        async function verifyPayment() {
            try {
                let payload = {
                    action: "VERIFY_PAYMENT",
                    session_id: localStorage.getItem("session_id"),
                    order_id: orderId
                }
                console.log(payload);
                const data = await callServicesApi(payload);
                if (data.status === "PAID") {
                    setStatus("paid");
                    setMessage(data.message || "Payment successful!");

                    // ▶ Create the booking entry now that payment succeeded
                    try {
                        const saved = JSON.parse(localStorage.getItem("pending_booking") || "{}");
                        const user = JSON.parse(localStorage.getItem("user_data") || "{}");

                        const bookingPayload = {
                            user_id: user.id,
                            action: "CREATE_BOOKING_ENTRY",
                            session_id: localStorage.getItem("session_id"),
                            kennel_id: saved.kennel.kennel_id,
                            room_type_id: saved.room_type_id,
                            check_in_date: saved.checkin,
                            check_out_date: saved.checkout,
                            days: saved.days,
                            total_price: saved.total,
                            mode: "online",
                            pets: saved.breakdown.map((p) => ({
                                pet_id: p.id,
                                price_per_day: p.perDay,
                                days: p.days,
                                total_price: p.total,
                            })),
                        };

                        console.log("Booking payload:", bookingPayload);
                        const res = await callServicesApi(bookingPayload);
                        console.log(res);
                        localStorage.removeItem("pending_booking");
                    } catch (e) {
                        console.error("Failed to create booking entry:", e);
                    }
                } else {
                    setStatus("failed");
                    handleRetry();
                }
            } catch (e) {
                setStatus("failed");
                handleRetry();
                setMessage("Error verifying payment. Contact support.", e);
            }
        }
        verifyPayment();
    }, [orderId]);

    if (status === "loading") {
        return (
            <div className="container py-5 d-flex flex-column align-items-center">
                <div
                    className="spinner-border"
                    role="status"
                    style={{ width: "3rem", height: "3rem", color: "#471915" }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 fw-medium">Verifying payment, please wait…</p>
            </div>
        );
    }

    return (
        <div className="container py-5 d-flex justify-content-center">
            <div className="card" style={{ width: 400 /* no border */ }}>
                <div className="card-body text-center">
                    <div className="mb-3">
                        <i
                            className="bi bi-check-circle-fill"
                            style={{ fontSize: "10rem", color: "#198754" }}
                        />
                    </div>
                    <h3
                        className="fw-semibold mb-2"
                        style={{ color: status === "paid" ? "#198754" : "#DC3545" }}
                    >
                        Payment Successful!
                    </h3>
                    <p className="mb-4">{message}</p>
                    <p className="mb-4 fw-semibold">Transaction ID: {orderId}</p>
                    <button
                        className="btn btn-lg px-5"
                        style={{ backgroundColor: "#471915", color: "#fff" }}
                        onClick={() => navigate("/account/creche-bookings")}
                    >
                        View Bookings
                    </button>
                </div>
            </div>
        </div>
    );

}
