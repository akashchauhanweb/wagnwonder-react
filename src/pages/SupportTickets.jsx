import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";

const SupportTickets = () => {
    const { supportTickets: tickets, ticketsLoading: loading, refreshTickets } = useOutletContext();
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const userData = JSON.parse(localStorage.getItem("user_data"));

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const fetchMessages = async (ticketId) => {
        setLoadingMessages(true);
        const session_id = localStorage.getItem("session_id");

        const response = await callServicesApi({
            action: "GET_TICKET_MESSAGES",
            session_id,
            ticket_id: ticketId
        });
        // console.log(response);
        if (response?.success) {
            setSelectedTicket(response.ticket);
            setMessages(response.messages || []);
        }
        setLoadingMessages(false);
    };

    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setMessages([]);
        setReplyText("");
        fetchMessages(ticket.ticket_id);
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        setSending(true);
        const session_id = localStorage.getItem("session_id");

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
            refreshTickets();
            setSuccessMsg("Reply sent successfully.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } else {
            setErrorMsg(response?.message || "Failed to send reply.");
            setTimeout(() => setErrorMsg(""), 3000);
        }
        setSending(false);
    };

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        const session_id = localStorage.getItem("session_id");

        const response = await callServicesApi({
            action: "UPDATE_TICKET_STATUS",
            session_id,
            ticket_id: selectedTicket.ticket_id,
            status: newStatus,
            admin_id: userData.user_id
        });

        if (response?.success) {
            fetchMessages(selectedTicket.ticket_id);
            refreshTickets();
            setSuccessMsg(`Ticket ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully.`);
            setTimeout(() => setSuccessMsg(""), 3000);
        } else {
            setErrorMsg(response?.message || "Failed to update status.");
            setTimeout(() => setErrorMsg(""), 3000);
        }
        setUpdatingStatus(false);
    };

    const handleBackToList = () => {
        setSelectedTicket(null);
        setMessages([]);
        setReplyText("");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'open': return 'status-open';
            case 'in_progress': return 'status-in-progress';
            case 'closed': return 'status-closed';
            default: return '';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'open': return 'New';
            case 'in_progress': return 'In Progress';
            case 'closed': return 'Closed';
            default: return status;
        }
    };

    // Calculate counts for each filter
    const filterCounts = useMemo(() => {
        if (!tickets) return {};
        const contactUsTickets = tickets.filter(t => t.source === 'contact_us');
        const bookingTickets = tickets.filter(t => t.booking_id && t.source !== 'contact_us');
        return {
            all: tickets.filter(t => t.source !== 'contact_us').length,
            open: tickets.filter(t => t.status === 'open' && t.source !== 'contact_us').length,
            awaiting_reply: tickets.filter(t => t.last_reply_by === 'user' && t.status === 'in_progress' && t.source !== 'contact_us').length,
            in_progress: tickets.filter(t => t.status === 'in_progress' && t.source !== 'contact_us' && t.last_reply_by === 'admin').length,
            closed: tickets.filter(t => t.status === 'closed' && t.source !== 'contact_us').length,
            booking: bookingTickets.length,
            booking_pending: bookingTickets.filter(t => t.status !== 'closed').length,
            contact_us: contactUsTickets.length,
            contact_us_new: contactUsTickets.filter(t => t.status !== 'closed').length,
            contact_us_closed: contactUsTickets.filter(t => t.status === 'closed').length
        };
    }, [tickets]);

    const filteredTickets = (tickets || []).filter((ticket) => {

        // Helper: check if ticket is new (admin has never replied - status is still 'open')
        const isNew = ticket.status === 'open' && ticket.source !== 'contact_us';

        // Helper: check if ticket is awaiting reply (admin has replied before, but user replied last)
        const isAwaitingReply = ticket.last_reply_by === 'user' && ticket.status === 'in_progress' && ticket.source !== 'contact_us';

        // Status/Source filter
        if (statusFilter === 'contact_us') {
            if (ticket.source !== 'contact_us') return false;
        } else if (statusFilter === 'booking') {
            if (!ticket.booking_id || ticket.source === 'contact_us') return false;
        } else if (statusFilter === 'awaiting_reply') {
            if (!isAwaitingReply) return false;
        } else if (statusFilter === 'open') {
            // New tickets - only 1 message
            if (!isNew) return false;
        } else if (statusFilter === 'in_progress') {
            // In Progress - admin replied, waiting for user
            if (ticket.status !== 'in_progress' || ticket.source === 'contact_us' || ticket.last_reply_by !== 'admin') return false;
        } else if (statusFilter === 'closed') {
            // Closed tickets - only registered users
            if (ticket.status !== 'closed' || ticket.source === 'contact_us') return false;
        }

        // Search filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            ticket.name?.toLowerCase().includes(query) ||
            ticket.email?.toLowerCase().includes(query) ||
            ticket.phone?.includes(query) ||
            ticket.ticket_id?.toString().includes(query)
        );
    });

    return (
        <div className="support-tickets">
            {/* Header */}
            <div className="support-tickets-header">
                <h2>Support Tickets</h2>
                {!selectedTicket && (
                    <div className="ticket-count">
                        {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                    </div>
                )}
            </div>

            {/* Alerts */}
            {successMsg && (
                <div className="support-alert success">
                    <i className="bi bi-check-circle"></i>
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="support-alert error">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{errorMsg}</span>
                </div>
            )}

            {!selectedTicket ? (
                <>
                   {/* Filters */}
                    <div className="tickets-filters">
                        <div className="tickets-search">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone or ticket ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="search-clear" onClick={() => setSearchQuery("")}>
                                    <i className="bi bi-x"></i>
                                </button>
                            )}
                        </div>
                        <div className="filter-chips">
                            {['all', 'open', 'awaiting_reply', 'in_progress', 'closed', 'booking', 'contact_us'].map((status) => (
                                <button
                                    key={status}
                                    className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'All' : status === 'contact_us' ? 'Contact Us' : status === 'booking' ? 'Kennel Owner Tickets' : status === 'awaiting_reply' ? 'Awaiting Reply' : getStatusLabel(status)}
                                    {status === 'contact_us' ? (
                                        <span className={`filter-count ${filterCounts.contact_us_new > 0 ? 'highlight' : ''}`}>
                                            {filterCounts.contact_us_new || 0}/{filterCounts.contact_us_closed || 0}
                                        </span>
                                    ) : status === 'booking' ? (
                                        <span className={`filter-count ${filterCounts.booking_pending > 0 ? 'highlight' : ''}`}>
                                            {filterCounts.booking_pending || 0}/{filterCounts.booking || 0}
                                        </span>
                                    ) : (
                                        <span className={`filter-count ${(status === 'open' || status === 'awaiting_reply') && filterCounts[status] > 0 ? 'highlight' : ''}`}>
                                            {filterCounts[status] || 0}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tickets List */}
                    {loading ? (
                        <div className="support-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="support-empty">
                            <i className="bi bi-inbox"></i>
                            <p>No tickets found</p>
                        </div>
                    ) : (
                        <div className="tickets-list">
                            {filteredTickets.map((ticket) => (
                                <div
                                    key={ticket.ticket_id}
                                    className={`ticket-card ${(ticket.last_reply_by === 'user' || ticket.last_reply_by === null) && ticket.status !== 'closed' ? 'needs-reply' : ''}`}
                                    onClick={() => handleTicketClick(ticket)}
                                >
                                    <div className="ticket-card-header">
                                        <div className="ticket-info">
                                            <span className="ticket-id">#{ticket.ticket_id}</span>
                                            <h3 className="ticket-subject">{ticket.subject}</h3>
                                        </div>
                                        <div className="ticket-meta">
                                            {!(ticket.last_reply_by === 'user' && ticket.status === 'in_progress' && ticket.source !== 'contact_us') && (
                                                <span className={`ticket-status ${getStatusBadgeClass(ticket.status)}`}>
                                                    {getStatusLabel(ticket.status)}
                                                </span>
                                            )}
                                            {ticket.source === 'contact_us' && (
                                                <span className="ticket-source">
                                                    <i className="bi bi-envelope"></i>
                                                    Contact Form
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ticket-card-body">
                                        <div className="ticket-user">
                                            <i className="bi bi-person"></i>
                                            <span>{ticket.name}</span>
                                            <span className="ticket-email">{ticket.email}</span>
                                            {ticket.booking_id && (
                                                <span className="ticket-email" style={{ marginLeft: "8px" }}>
                                                    <i className="bi bi-house-door me-1"></i>
                                                    Booking #{ticket.booking_id}{ticket.kennel_name && ` · ${ticket.kennel_name}`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="ticket-stats">
                                            <span className="ticket-messages">
                                                <i className="bi bi-chat-dots"></i>
                                                {ticket.message_count}
                                            </span>
                                            <span className="ticket-date">
                                                <i className="bi bi-clock"></i>
                                                {formatDate(ticket.last_reply_at)}
                                            </span>
                                        </div>
                                    </div>
                                    {ticket.last_reply_by === 'user' && ticket.status === 'in_progress' && ticket.source !== 'contact_us' && (
                                        <div className="ticket-badge-waiting">
                                            Awaiting Reply
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Back button */}
                    <button
                        onClick={handleBackToList}
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
                                {getStatusLabel(selectedTicket.status)}
                            </span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            {selectedTicket.name} · {selectedTicket.email}
                            {selectedTicket.phone && <> · {selectedTicket.phone}</>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
                            Subject: {selectedTicket.subject}
                            {selectedTicket.booking_id && <> · Booking #{selectedTicket.booking_id}</>}
                            {selectedTicket.kennel_name && <> · {selectedTicket.kennel_name}</>}
                            <span style={{ margin: "0 8px" }}>·</span>
                            Created {formatDate(selectedTicket.created_at)}
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
                                                <i className={`bi ${msg.sender_type === "admin" ? "bi-shield-check" : "bi-person"} me-1`}></i>
                                                {msg.sender_type === "admin" ? (msg.sender_name || "Admin") : selectedTicket.name}
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

                    {/* Reply box + actions */}
                    {selectedTicket.status !== "closed" ? (
                        <>
                            {(selectedTicket.user_id !== null && selectedTicket.user_id !== undefined) || selectedTicket.can_reply === 1 ? (
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
                                            onClick={() => handleStatusChange("closed")}
                                            disabled={updatingStatus}
                                            style={{
                                                padding: "8px 14px", borderRadius: "8px",
                                                border: "1px solid #fecaca", background: "#fef2f2",
                                                color: "#dc2626", fontSize: "0.8rem", fontWeight: 600,
                                                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                                            }}
                                        >
                                            {updatingStatus ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <><i className="bi bi-x-circle"></i> Close Ticket</>
                                            )}
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
                                    background: "#fffbeb", border: "1px solid #fde68a",
                                    display: "flex", alignItems: "center", gap: "10px",
                                    fontSize: "0.85rem", color: "#92400e"
                                }}>
                                    <i className="bi bi-exclamation-triangle"></i>
                                    Cannot reply — user is not registered. You can only close this ticket.
                                    <button
                                        onClick={() => handleStatusChange("closed")}
                                        disabled={updatingStatus}
                                        style={{
                                            marginLeft: "auto", padding: "6px 12px", borderRadius: "8px",
                                            border: "1px solid #fecaca", background: "#fef2f2",
                                            color: "#dc2626", fontSize: "0.78rem", fontWeight: 600,
                                            cursor: "pointer", whiteSpace: "nowrap"
                                        }}
                                    >
                                        {updatingStatus ? (
                                            <span className="spinner-border spinner-border-sm"></span>
                                        ) : (
                                            "Close Ticket"
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            padding: "14px 16px", borderRadius: "10px",
                            background: "#f8fafc", border: "1px solid #e2e8f0",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "0.85rem" }}>
                                <i className="bi bi-lock"></i>
                                This ticket is closed.
                            </div>
                            <button
                                onClick={() => handleStatusChange("open")}
                                disabled={updatingStatus}
                                style={{
                                    padding: "6px 14px", borderRadius: "8px",
                                    border: "1px solid #dbeafe", background: "#eff6ff",
                                    color: "#2563eb", fontSize: "0.8rem", fontWeight: 600,
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                                }}
                            >
                                {updatingStatus ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <><i className="bi bi-arrow-counterclockwise"></i> Reopen</>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SupportTickets;