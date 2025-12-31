import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const SupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
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
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        const session_id = localStorage.getItem("session_id");
        const body = {
            action: "GET_TICKETS",
            session_id
        };
        const response = await callServicesApi(body);

        if (response?.success) {
            setTickets(response.tickets || []);
        } else {
            setTickets([]);
        }
        setLoading(false);
    };

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
            fetchTickets();
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
            fetchTickets();
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

    const filteredTickets = tickets.filter((ticket) => {
        // Helper: check if ticket is awaiting reply (more than 1 message and last reply by user)
        const isAwaitingReply = ticket.last_reply_by === 'user' && ticket.status !== 'closed' && ticket.source !== 'contact_us' && ticket.message_count > 1;

        // Helper: check if ticket is new (only 1 message)
        const isNew = ticket.status === 'open' && ticket.source !== 'contact_us' && ticket.message_count === 1;

        // Status/Source filter
        if (statusFilter === 'contact_us') {
            if (ticket.source !== 'contact_us') return false;
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
                <h2>
                    {selectedTicket ? (
                        <>
                            <button className="back-btn" onClick={handleBackToList}>
                                <i className="bi bi-arrow-left"></i>
                            </button>
                            Ticket #{selectedTicket.ticket_id}
                        </>
                    ) : (
                        "Support Tickets"
                    )}
                </h2>
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
                            {['all', 'open', 'awaiting_reply', 'in_progress', 'closed', 'contact_us'].map((status) => (
                                <button
                                    key={status}
                                    className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'All' : status === 'contact_us' ? 'Contact Us Enquiries' : status === 'awaiting_reply' ? 'Awaiting Reply' : getStatusLabel(status)}
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
                                            {!(ticket.last_reply_by === 'user' && ticket.status !== 'closed' && ticket.source !== 'contact_us' && ticket.message_count > 1) && (
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
                                    {ticket.last_reply_by === 'user' && ticket.status !== 'closed' && ticket.source !== 'contact_us' && ticket.message_count > 1 && (
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
                    {/* Ticket Detail View */}
                    <div className="ticket-detail">
                        {/* Ticket Info Card */}
                        <div className="ticket-info-card">
                            <div className="ticket-info-row">
                                <div className="info-item">
                                    <span className="info-label">Subject</span>
                                    <span className="info-value">{selectedTicket.subject}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status</span>
                                    <span className={`ticket-status ${getStatusBadgeClass(selectedTicket.status)}`}>
                                        {getStatusLabel(selectedTicket.status)}
                                    </span>
                                </div>
                            </div>
                            <div className="ticket-info-row">
                                <div className="info-item">
                                    <span className="info-label">From</span>
                                    <span className="info-value">{selectedTicket.name} ({selectedTicket.email})</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Created</span>
                                    <span className="info-value">{formatDate(selectedTicket.created_at)}</span>
                                </div>
                            </div>
                            {selectedTicket.phone && (
                                <div className="ticket-info-row">
                                    <div className="info-item">
                                        <span className="info-label">Phone</span>
                                        <span className="info-value">{selectedTicket.phone}</span>
                                    </div>
                                </div>
                            )}
                            <div className="ticket-actions">
                                {selectedTicket.status !== 'closed' ? (
                                    <button 
                                        className="btn-close-ticket"
                                        onClick={() => handleStatusChange('closed')}
                                        disabled={updatingStatus}
                                    >
                                        {updatingStatus ? (
                                            <span className="spinner-border spinner-border-sm" />
                                        ) : (
                                            <i className="bi bi-check-circle"></i>
                                        )}
                                        {updatingStatus ? 'Closing...' : 'Close Ticket'}
                                    </button>
                                ) : (
                                    <button 
                                        className="btn-reopen-ticket"
                                        onClick={() => handleStatusChange('open')}
                                        disabled={updatingStatus}
                                    >
                                        {updatingStatus ? (
                                            <span className="spinner-border spinner-border-sm" />
                                        ) : (
                                            <i className="bi bi-arrow-counterclockwise"></i>
                                        )}
                                        {updatingStatus ? 'Reopening...' : 'Reopen Ticket'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages Thread */}
                        <div className="messages-thread">
                            <h4>Conversation</h4>
                            {loadingMessages ? (
                                <div className="support-loading">
                                    <div className="spinner-border" role="status" />
                                </div>
                            ) : (
                                <div className="messages-list">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.message_id}
                                            className={`message-item ${msg.sender_type === 'admin' ? 'admin' : 'user'}`}
                                        >
                                            <div className="message-header">
                                                <span className="message-sender">
                                                    {msg.sender_type === 'admin' ? (
                                                        <>
                                                            <i className="bi bi-shield-check"></i>
                                                            {msg.sender_name || 'Admin'}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-person"></i>
                                                            {selectedTicket.name}
                                                        </>
                                                    )}
                                                </span>
                                                <span className="message-time">{formatDate(msg.created_at)}</span>
                                            </div>
                                            <div className="message-body">
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reply Box */}
                        {selectedTicket.status !== 'closed' && (
                            <div className="reply-box">
                                {(selectedTicket.user_id !== null && selectedTicket.user_id !== undefined) || selectedTicket.can_reply === 1 ? (
                                    <>
                                        <textarea
                                            placeholder="Type your reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            rows={3}
                                        />
                                        <button
                                            className="btn-send-reply"
                                            onClick={handleSendReply}
                                            disabled={sending || !replyText.trim()}
                                        >
                                            {sending ? (
                                                <span className="spinner-border spinner-border-sm" />
                                            ) : (
                                                <>
                                                    <i className="bi bi-send"></i>
                                                    Send Reply
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <div className="reply-disabled">
                                        <i className="bi bi-exclamation-triangle"></i>
                                        <p>Cannot reply to this ticket. The user is not registered in the system.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedTicket.status === 'closed' && (
                            <div className="ticket-closed-notice">
                                <i className="bi bi-lock"></i>
                                <p>This ticket is closed. Reopen it to continue the conversation.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SupportTickets;