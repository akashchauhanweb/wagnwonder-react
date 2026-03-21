import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import Pagination from "../assets/components/Pagination";

export default function WoofWallet() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const session_id = localStorage.getItem("session_id");
    const IS_DEV = import.meta.env.VITE_IS_DEV === '1' ? 1 : 0;
    const ENV_NAME = import.meta.env.VITE_IS_DEV === '1' ? 'sandbox' : 'production';

    const [balance, setBalance] = useState(0);
    const [slabs, setSlabs] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [activeView, setActiveView] = useState("buy"); // "buy" or "history"
    const [historyPage, setHistoryPage] = useState(1);
    const historyPerPage = 5;

    useEffect(() => {
        if (!session_id || !userData) {
            navigate("/login");
            return;
        }
        fetchWallet();
    }, []);

    // Check for returning from wallet topup payment
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("order_id");
        const topupWoofs = params.get("topup_woofs");
        if (orderId && topupWoofs) {
            verifyTopup(orderId, parseInt(topupWoofs));
        }
    }, []);

    const fetchWallet = async () => {
        setLoading(true);
        try {
            const res = await callServicesApi({
                action: "GET_WALLET_BALANCE",
                session_id,
                user_id: userData.id
            });
            if (res?.success) {
                setBalance(res.balance);
                localStorage.setItem("woof_balance", res.balance);
                setSlabs(res.slabs || []);
                setTransactions(res.transactions || []);
            }
        } catch (err) {
            console.error("Error fetching wallet:", err);
        } finally {
            setLoading(false);
        }
    };

    const verifyTopup = async (orderId, woofs) => {
        setLoading(true);
        try {
            const verifyRes = await callServicesApi({
                action: "VERIFY_PAYMENT",
                session_id,
                order_id: orderId
            });
            if (verifyRes?.status === "PAID") {
                const topupRes = await callServicesApi({
                    action: "TOPUP_WALLET",
                    session_id,
                    user_id: userData.id,
                    woofs: woofs,
                    order_id: orderId,
                    cf_order_id: verifyRes.cf_order_id
                });
                if (topupRes?.success) {
                    setBalance(topupRes.new_balance);
                    localStorage.setItem("woof_balance", topupRes.new_balance);
                    setActiveView("history");
                }
            }
            // Clean URL
            window.history.replaceState({}, "", "/account/wallet");
            fetchWallet();
        } catch (err) {
            console.error("Error verifying topup:", err);
            window.history.replaceState({}, "", "/account/wallet");
            fetchWallet();
        }
    };

    const handleBuySlab = async (slab) => {
        setPurchasing(slab.woofs);
        try {
            // Load Cashfree SDK if not loaded
            if (!window.Cashfree) {
                await new Promise((resolve) => {
                    const script = document.createElement("script");
                    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
                    script.onload = resolve;
                    document.body.appendChild(script);
                });
            }

            const payRes = await callServicesApi({
                action: "CREATE_PAYMENT_SESSION",
                session_id,
                customer_id: userData.id.toString().padStart(3, '0'),
                customer_phone: userData.phone_number,
                order_amount: slab.price
            });

            if (!payRes?.payment_session_id) {
                console.error("Failed to create payment session");
                setPurchasing(null);
                return;
            }

            const cashfree = window.Cashfree({ mode: ENV_NAME });
            cashfree.checkout({
                paymentSessionId: payRes.payment_session_id,
                redirectTarget: "_self",
                returnUrl: `${window.location.origin}/account/wallet?order_id={order_id}&topup_woofs=${slab.woofs}`
            });
        } catch (err) {
            console.error("Error purchasing woofs:", err);
            setPurchasing(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const getTypeIcon = (type) => {
        if (type === "topup") return "bi-plus-circle-fill";
        if (type === "spend") return "bi-dash-circle-fill";
        if (type === "refund") return "bi-arrow-counterclockwise";
        return "bi-circle";
    };

    const getTypeColor = (type) => {
        if (type === "topup") return "#059669";
        if (type === "spend") return "#dc2626";
        if (type === "refund") return "#2563eb";
        return "#64748b";
    };

    if (loading && !slabs.length) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "720px" }}>
            {/* Balance Card */}
            <div style={{
                background: "linear-gradient(135deg, #D84A39, #471915)",
                borderRadius: "16px", padding: "28px 24px", color: "white",
                marginBottom: "24px", position: "relative", overflow: "hidden"
            }}>
                <div style={{
                    position: "absolute", top: "-20px", right: "-20px",
                    width: "120px", height: "120px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)"
                }} />
                <div style={{
                    position: "absolute", bottom: "-30px", left: "-30px",
                    width: "80px", height: "80px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)"
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: "6px", letterSpacing: "0.03em" }}>
                        Woof Balance
                    </div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                        {Math.floor(balance).toLocaleString("en-IN")}
                        <span style={{ fontSize: "1rem", fontWeight: 500, marginLeft: "8px", opacity: 0.8 }}>Woofs</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "4px" }}>
                        Worth ₹{Math.floor(balance).toLocaleString("en-IN")} at checkout
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <button
                    onClick={() => setActiveView("buy")}
                    style={{
                        flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0",
                        background: activeView === "buy" ? "#1e293b" : "white",
                        color: activeView === "buy" ? "white" : "#64748b",
                        fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                    }}
                >
                    <i className="bi bi-plus-circle"></i> Buy Woofs
                </button>
                <button
                    onClick={() => setActiveView("history")}
                    style={{
                        flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0",
                        background: activeView === "history" ? "#1e293b" : "white",
                        color: activeView === "history" ? "white" : "#64748b",
                        fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                    }}
                >
                    <i className="bi bi-clock-history"></i> History
                </button>
            </div>

            {/* Buy Woofs */}
            {activeView === "buy" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 4px 0" }}>
                        Buy Woofs at a discount. Use them at checkout — 1 Woof = ₹1.
                    </p>
                    {slabs.map((slab) => (
                        <div key={slab.woofs} style={{
                            background: "white", borderRadius: "12px", padding: "18px 20px",
                            border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
                            justifyContent: "space-between", gap: "16px",
                            transition: "all 0.15s",
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D84A39"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(216,74,57,0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                        >
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1e293b" }}>
                                    {slab.woofs.toLocaleString("en-IN")} Woofs
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                                    Save ₹{Math.round(slab.savings)} 
                                    <span style={{
                                        marginLeft: "8px", padding: "2px 8px", borderRadius: "10px",
                                        background: "#f0fdf4", color: "#059669", fontSize: "0.75rem", fontWeight: 600
                                    }}>
                                        {slab.discount_percent}% off
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleBuySlab(slab)}
                                disabled={purchasing !== null}
                                style={{
                                    padding: "10px 20px", borderRadius: "10px", border: "none",
                                    background: purchasing === slab.woofs ? "#94a3b8" : "linear-gradient(135deg, #D84A39, #471915)",
                                    color: "white", fontWeight: 700, fontSize: "0.9rem",
                                    cursor: purchasing !== null ? "not-allowed" : "pointer",
                                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px"
                                }}
                            >
                                {purchasing === slab.woofs ? (
                                    <><span className="spinner-border spinner-border-sm"></span></>
                                ) : (
                                    <>₹{Math.round(slab.price).toLocaleString("en-IN")}</>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Transaction History */}
            {activeView === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {transactions.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                            <i className="bi bi-clock-history" style={{ fontSize: "2rem", display: "block", marginBottom: "8px", opacity: 0.5 }}></i>
                            <p style={{ margin: 0 }}>No transactions yet</p>
                        </div>
                    ) : transactions.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage).map((tx) => (
                        <div key={tx.id} style={{
                            display: "flex", alignItems: "center", gap: "14px",
                            padding: "14px 16px", background: "white", borderRadius: "10px",
                            border: "1px solid #f1f5f9"
                        }}>
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "10px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: tx.type === "topup" ? "#ecfdf5" : tx.type === "refund" ? "#eff6ff" : "#fef2f2",
                                flexShrink: 0
                            }}>
                                <i className={`bi ${getTypeIcon(tx.type)}`} style={{ color: getTypeColor(tx.type), fontSize: "1rem" }}></i>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b" }}>
                                    {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
                                    {formatDate(tx.created_at)}
                                </div>
                            </div>
                            <div style={{
                                fontWeight: 700, fontSize: "0.95rem",
                                color: tx.type === "spend" ? "#dc2626" : "#059669"
                            }}>
                                {tx.type === "spend" ? "−" : "+"}{Math.floor(tx.amount).toLocaleString("en-IN")}
                            </div>
                        </div>
                    ))}
                    <Pagination
                        currentPage={historyPage}
                        totalPages={Math.ceil(transactions.length / historyPerPage)}
                        onPageChange={setHistoryPage}
                        itemsPerPage={historyPerPage}
                        totalItems={transactions.length}
                        theme="user"
                    />
                </div>
            )}
        </div>
    );
}