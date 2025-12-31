import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [showNewTicketModal, setShowNewTicketModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const userData = JSON.parse(localStorage.getItem("user_data"));

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        const session_id = localStorage.getItem("session_id");
        const body = {
            action: "GET_USER_TICKETS",
            session_id,
            user_id: userData?.id
        };
        console.log(body);
        const response = await callServicesApi(body);
        console.log(response);
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
            sender_type: "user",
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
            case 'open': return 'Open';
            case 'in_progress': return 'In Progress';
            case 'closed': return 'Closed';
            default: return status;
        }
    };

    return (
        <div className="my-tickets">
            {/* Header */}
            <div className="my-tickets-header">
                <h2>
                    {selectedTicket ? (
                        <>
                            <button className="back-btn" onClick={handleBackToList}>
                                <i className="bi bi-arrow-left"></i>
                            </button>
                            Ticket #{selectedTicket.ticket_id}
                        </>
                    ) : (
                        "Help"
                    )}
                </h2>
                {!selectedTicket && (
                    <button className="new-ticket-btn" onClick={() => setShowNewTicketModal(true)}>
                        <i className="bi bi-plus-lg"></i>
                        New Ticket
                    </button>
                )}
            </div>

            {/* Alerts */}
            {successMsg && (
                <div className="my-tickets-alert success">
                    <i className="bi bi-check-circle"></i>
                    <span>{successMsg}</span>
                </div>
            )}
            {errorMsg && (
                <div className="my-tickets-alert error">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{errorMsg}</span>
                </div>
            )}

            {!selectedTicket ? (
                <>
                    {/* Tickets List */}
                    {loading ? (
                        <div className="my-tickets-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="my-tickets-empty">
                            <i className="bi bi-chat-square-text"></i>
                            <p>No support tickets yet</p>
                            <span>Need help? Create a new ticket to get in touch with us.</span>
                        </div>
                    ) : (
                        <div className="my-tickets-list">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.ticket_id}
                                    className={`my-ticket-card ${ticket.last_reply_by === 'admin' && ticket.status !== 'closed' ? 'has-reply' : ''}`}
                                    onClick={() => handleTicketClick(ticket)}
                                >
                                    <div className="my-ticket-card-header">
                                        <span className="my-ticket-id">#{ticket.ticket_id}</span>
                                        <span className={`my-ticket-status ${getStatusBadgeClass(ticket.status)}`}>
                                            {getStatusLabel(ticket.status)}
                                        </span>
                                    </div>
                                    <h3 className="my-ticket-subject">{ticket.subject}</h3>
                                    <div className="my-ticket-meta">
                                        <span>
                                            <i className="bi bi-chat-dots"></i>
                                            {ticket.message_count} {ticket.message_count === 1 ? 'message' : 'messages'}
                                        </span>
                                        <span>
                                            <i className="bi bi-clock"></i>
                                            {formatDate(ticket.last_reply_at || ticket.created_at)}
                                        </span>
                                    </div>
                                    {ticket.last_reply_by === 'admin' && ticket.status !== 'closed' && (
                                        <div className="my-ticket-new-reply">
                                            <i className="bi bi-reply-fill"></i>
                                            New reply from support
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
                    <div className="my-ticket-detail">
                        {/* Ticket Info */}
                        <div className="my-ticket-info">
                            <div className="my-ticket-info-row">
                                <span className="info-label">Subject</span>
                                <span className="info-value">{selectedTicket.subject}</span>
                            </div>
                            <div className="my-ticket-info-row">
                                <span className="info-label">Status</span>
                                <span className={`my-ticket-status ${getStatusBadgeClass(selectedTicket.status)}`}>
                                    {getStatusLabel(selectedTicket.status)}
                                </span>
                            </div>
                            <div className="my-ticket-info-row">
                                <span className="info-label">Created</span>
                                <span className="info-value">{formatDate(selectedTicket.created_at)}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="my-ticket-messages">
                            {loadingMessages ? (
                                <div className="my-tickets-loading">
                                    <div className="spinner-border" role="status" />
                                </div>
                            ) : (
                                <div className="my-messages-list">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.message_id}
                                            className={`my-message-item ${msg.sender_type}`}
                                        >
                                            <div className="my-message-header">
                                                <span className="my-message-sender">
                                                    {msg.sender_type === 'admin' ? (
                                                        <>
                                                            <i className="bi bi-headset"></i>
                                                            Support Team
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-person"></i>
                                                            You
                                                        </>
                                                    )}
                                                </span>
                                                <span className="my-message-time">{formatDate(msg.created_at)}</span>
                                            </div>
                                            <div className="my-message-body">
                                                {msg.message}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reply Box */}
                        {selectedTicket.status !== 'closed' ? (
                            <div className="my-ticket-reply">
                                <textarea
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending || !replyText.trim()}
                                >
                                    {sending ? (
                                        <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                        <>
                                            <i className="bi bi-send"></i>
                                            Send
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="my-ticket-closed">
                                <i className="bi bi-lock"></i>
                                <p>This ticket is closed. Create a new ticket if you need further assistance.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* New Ticket Modal */}
            {showNewTicketModal && (
                <NewTicketModal
                    onClose={() => setShowNewTicketModal(false)}
                    onSuccess={() => {
                        setShowNewTicketModal(false);
                        fetchTickets();
                        setSuccessMsg("Ticket created successfully.");
                        setTimeout(() => setSuccessMsg(""), 3000);
                    }}
                    userData={userData}
                />
            )}
        </div>
    );
};

// New Ticket Modal Component
const NewTicketModal = ({ onClose, onSuccess, userData }) => {
    const [formData, setFormData] = useState({
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const session_id = localStorage.getItem("session_id");
            const response = await callServicesApi({
                action: "SEND_ENQUIRY",
                session_id,
                name: `${userData.first_name} ${userData.last_name}`,
                email: userData.email,
                phone: userData.phone_number || "",
                subject: formData.subject,
                message: formData.message,
                user_id: userData.user_id,
                source: "app"
            });

            if (response?.success) {
                onSuccess();
            } else {
                setError(response?.message || "Failed to create ticket.");
            }
        } catch (err) {
            console.log(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="new-ticket-modal-overlay" onClick={onClose}>
            <div className="new-ticket-modal" onClick={(e) => e.stopPropagation()}>
                <div className="new-ticket-modal-header">
                    <h3>Create New Ticket</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="new-ticket-error">
                            <i className="bi bi-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <div className="new-ticket-field">
                        <label>Subject *</label>
                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a subject</option>
                            <option value="general">General Inquiry</option>
                            <option value="booking">Booking Related</option>
                            <option value="support">Customer Support</option>
                            <option value="feedback">Feedback</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="new-ticket-field">
                        <label>Message *</label>
                        <textarea
                            name="message"
                            placeholder="Describe your issue or question..."
                            value={formData.message}
                            onChange={handleChange}
                            rows={5}
                            required
                        />
                    </div>

                    <div className="new-ticket-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-send"></i>
                                    Create Ticket
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyTickets;