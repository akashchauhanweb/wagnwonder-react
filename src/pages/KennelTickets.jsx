import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const KennelTickets = () => {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const session_id = localStorage.getItem("session_id");

    const [kennels, setKennels] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [kennelFilter, setKennelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        fetchKennelsAndTickets();
    }, []);

    useEffect(() => {
        if (successMsg || errorMsg) {
            const timer = setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, errorMsg]);

    const fetchKennelsAndTickets = async () => {
        setLoading(true);
        try {
            const kennelRes = await callServicesApi({
                action: "GET_MANAGED_KENNELS",
                session_id,
                user_id: userData.id
            });
            const kens = kennelRes?.success ? (kennelRes.kennels || []) : [];
            setKennels(kens);

            if (kens.length > 0) {
                const ticketRes = await callServicesApi({
                    action: "GET_KENNEL_TICKETS",
                    session_id,
                    kennel_ids: kens.map(k => k.id)
                });
                if (ticketRes?.success) {
                    setTickets(ticketRes.tickets || []);
                }
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (ticketId) => {
        setLoadingMessages(true);
        try {
            const response = await callServicesApi({
                action: "GET_TICKET_MESSAGES",
                session_id,
                ticket_id: ticketId
            });
            if (response?.success) {
                setMessages(response.messages || []);
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setMessages([]);
        setReplyText("");
        fetchMessages(ticket.ticket_id);
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setSending(true);
        try {
            const response = await callServicesApi({
                action: "REPLY_TO_TICKET",
                session_id,
                ticket_id: selectedTicket.ticket_id,
                message: replyText.trim(),
                sender_type: "admin",
                sender_id: userData.id
            });
            if (response?.success) {
                setReplyText("");
                fetchMessages(selectedTicket.ticket_id);
                fetchKennelsAndTickets();
                setSuccessMsg("Reply sent.");
            } else {
                setErrorMsg(response?.message || "Failed to send reply.");
            }
        } catch { setErrorMsg("Error sending reply."); }
        finally { setSending(false); }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const filteredTickets = tickets.filter(t => {
        if (kennelFilter !== "all" && t.kennel_id !== parseInt(kennelFilter)) return false;
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (searchQuery.trim()) {
            const s = searchQuery.toLowerCase();
            return (
                t.name?.toLowerCase().includes(s) ||
                t.email?.toLowerCase().includes(s) ||
                t.phone?.includes(s) ||
                t.kennel_name?.toLowerCase().includes(s) ||
                t.ticket_id?.toString().includes(s)
            );
        }
        return true;
    });

    // const pendingCount = tickets.filter(t => t.status === "open" || (t.status === "in_progress" && t.last_reply_by === "user")).length;

    if (!userData || !userData.permissions?.includes("boarding")) {
        localStorage.clear();
        window.location.href = "/login";
        return null;
    }

    return (
        <div className="manage-events-page">
            <div className="manage-events-header">
                <h2>Support Tickets</h2>
            </div>

            {successMsg && (
                <div className="manage-events-alert success">
                    <i className="bi bi-check-circle"></i> {successMsg}
                    <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}
            {errorMsg && (
                <div className="manage-events-alert error">
                    <i className="bi bi-exclamation-circle"></i> {errorMsg}
                    <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {!selectedTicket ? (
                <>
                    <div className="events-filters">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {kennels.length > 1 && (
                            <div className="status-filter">
                                <select value={kennelFilter} onChange={(e) => setKennelFilter(e.target.value)}>
                                    <option value="all">All Kennels</option>
                                    {kennels.map(k => (
                                        <option key={k.id} value={k.id}>{k.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="status-filter">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <button
                            className="earnings-refresh-btn"
                            onClick={fetchKennelsAndTickets}
                            disabled={loading}
                            style={{ marginLeft: "auto", minWidth: "unset" }}
                        >
                            <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-chat-dots"></i>
                            <p>No booking tickets found</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {filteredTickets.map(ticket => {
                                const isNew = ticket.status === "open";
                                const needsReply = ticket.status === "in_progress" && ticket.last_reply_by === "user";
                                return (
                                    <div
                                        key={ticket.ticket_id}
                                        onClick={() => handleTicketClick(ticket)}
                                        style={{
                                            padding: "16px 20px", borderRadius: "12px", cursor: "pointer",
                                            background: "white", border: `1px solid ${isNew || needsReply ? "#fde68a" : "#e2e8f0"}`,
                                            transition: "transform 0.15s, box-shadow 0.15s"
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>
                                                    #{ticket.ticket_id}
                                                </span>
                                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                    {ticket.name}
                                                </span>
                                                {kennels.length > 1 && (
                                                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                                        · {ticket.kennel_name}
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600,
                                                background: isNew ? "#fef3c7" : ticket.status === "in_progress" ? "#dbeafe" : "#f1f5f9",
                                                color: isNew ? "#d97706" : ticket.status === "in_progress" ? "#2563eb" : "#64748b"
                                            }}>
                                                {isNew ? "New" : ticket.status === "in_progress" ? "In Progress" : "Closed"}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                                <i className="bi bi-chat-dots me-1"></i>{ticket.message_count} message{ticket.message_count !== 1 ? "s" : ""}
                                                <span style={{ margin: "0 8px" }}>·</span>
                                                Booking #{ticket.booking_id}
                                                <span style={{ margin: "0 8px" }}>·</span>
                                                {formatDate(ticket.last_reply_at)}
                                            </div>
                                            {needsReply && (
                                                <span style={{
                                                    padding: "2px 8px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: 600,
                                                    background: "#fef3c7", color: "#d97706"
                                                }}>
                                                    Needs Reply
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Ticket Detail */}
                    <button
                        onClick={() => { setSelectedTicket(null); setMessages([]); }}
                        style={{
                            padding: "6px 14px", borderRadius: "8px", border: "1px solid #e2e8f0",
                            background: "white", color: "#475569", fontSize: "0.85rem", fontWeight: 600,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px"
                        }}
                    >
                        <i className="bi bi-arrow-left"></i> Back to Tickets
                    </button>

                    {/* Ticket info card */}
                    <div style={{
                        background: "white", borderRadius: "12px", padding: "18px 20px",
                        border: "1px solid #e2e8f0", marginBottom: "16px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#1e293b" }}>Ticket #{selectedTicket.ticket_id}</span>
                            <span style={{
                                padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 600,
                                background: selectedTicket.status === "open" ? "#fef3c7" : selectedTicket.status === "in_progress" ? "#dbeafe" : "#f1f5f9",
                                color: selectedTicket.status === "open" ? "#d97706" : selectedTicket.status === "in_progress" ? "#2563eb" : "#64748b"
                            }}>
                                {selectedTicket.status === "open" ? "Open" : selectedTicket.status === "in_progress" ? "In Progress" : "Closed"}
                            </span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            {selectedTicket.name} · {selectedTicket.email}
                            {selectedTicket.phone && <> · {selectedTicket.phone}</>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
                            Booking #{selectedTicket.booking_id} · {selectedTicket.kennel_name} · Created {formatDate(selectedTicket.created_at)}
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        background: "white", borderRadius: "12px", border: "1px solid #e2e8f0",
                        marginBottom: "16px", overflow: "hidden"
                    }}>
                        {loadingMessages ? (
                            <div style={{ textAlign: "center", padding: "30px" }}>
                                <div className="spinner-border spinner-border-sm"></div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", maxHeight: "400px", overflowY: "auto" }}>
                                {messages.map(msg => (
                                    <div key={msg.message_id} style={{
                                        padding: "14px 20px",
                                        background: msg.sender_type === "admin" ? "#f8fafc" : "white",
                                        borderBottom: "1px solid #f1f5f9"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <span style={{
                                                fontSize: "0.78rem", fontWeight: 600,
                                                color: msg.sender_type === "admin" ? "#1e293b" : "#D84A39"
                                            }}>
                                                <i className={`bi ${msg.sender_type === "admin" ? "bi-headset" : "bi-person"} me-1`}></i>
                                                {msg.sender_type === "admin" ? "Support" : selectedTicket.name}
                                            </span>
                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{formatDate(msg.created_at)}</span>
                                        </div>
                                        <div style={{ fontSize: "0.88rem", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reply box */}
                    {selectedTicket.status !== "closed" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply..."
                                rows={3}
                                style={{
                                    width: "100%", padding: "12px 14px", borderRadius: "10px",
                                    border: "1px solid #e2e8f0", fontSize: "0.88rem", resize: "none",
                                    fontFamily: "inherit"
                                }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Close this ticket? The user will no longer be able to reply.")) return;
                                        try {
                                            const response = await callServicesApi({
                                                action: "UPDATE_TICKET_STATUS",
                                                session_id,
                                                ticket_id: selectedTicket.ticket_id,
                                                status: "closed",
                                                admin_id: userData.id
                                            });
                                            if (response?.success) {
                                                setSuccessMsg("Ticket closed.");
                                                setSelectedTicket({ ...selectedTicket, status: "closed" });
                                                fetchKennelsAndTickets();
                                            } else {
                                                setErrorMsg(response?.message || "Failed to close ticket.");
                                            }
                                        } catch { setErrorMsg("Error closing ticket."); }
                                    }}
                                    style={{
                                        padding: "8px 14px", borderRadius: "8px",
                                        border: "1px solid #fecaca", background: "#fef2f2",
                                        color: "#dc2626", fontSize: "0.8rem", fontWeight: 600,
                                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                                    }}
                                >
                                    <i className="bi bi-x-circle"></i> Close Ticket
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending || !replyText.trim()}
                                    style={{
                                        padding: "10px 20px", borderRadius: "10px", border: "none",
                                        background: "#1e293b", color: "white", fontSize: "0.85rem",
                                        fontWeight: 600, cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: "6px"
                                    }}
                                >
                                    {sending ? (
                                        <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                        <><i className="bi bi-send"></i> Reply</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: "14px 16px", borderRadius: "10px",
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            textAlign: "center", color: "#94a3b8", fontSize: "0.85rem"
                        }}>
                            <i className="bi bi-lock me-2"></i>
                            This ticket is closed.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default KennelTickets;