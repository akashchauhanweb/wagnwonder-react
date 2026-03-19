import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const EventsRevenue = () => {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const session_id = localStorage.getItem("session_id");

    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch managed events
            const eventsRes = await callServicesApi({
                action: "GET_MANAGED_EVENTS",
                session_id,
                user_id: userData.id
            });
            const evts = eventsRes?.success ? (eventsRes.events || []) : [];
            setEvents(evts);

            // Fetch registrations for all events
            const allRegs = [];
            for (const evt of evts) {
                const res = await callServicesApi({
                    action: "GET_EVENT_REGISTRATIONS",
                    session_id,
                    event_id: evt.id
                });
                if (res?.success && res.registrations?.length > 0) {
                    const regsWithEvent = res.registrations.map(reg => ({
                        ...reg,
                        event_id: evt.id,
                        event_title: evt.title
                    }));
                    allRegs.push(...regsWithEvent);
                }
            }
            setRegistrations(allRegs);
        } catch (err) {
            console.error("Error fetching revenue data:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
        return `₹${Math.round(num).toLocaleString('en-IN')}`;
    };

    if (!userData || !userData.permissions?.includes("events")) {
        localStorage.clear();
        window.location.href = "/login";
        return null;
    }

    const filtered = registrations.filter(reg =>
        eventFilter === "all" || reg.event_id === parseInt(eventFilter)
    );
    const bookedRegs = filtered.filter(r => r.status === "booked");
    const totalRevenue = bookedRegs.reduce((sum, r) => sum + parseFloat(r.total_price || 0), 0);
    const onlineRegs = bookedRegs.filter(r => r.mode === "online");
    const offlineRegs = bookedRegs.filter(r => r.mode === "offline");
    const onlineRevenue = onlineRegs.reduce((sum, r) => sum + parseFloat(r.total_price || 0), 0);
    const offlineRevenue = offlineRegs.reduce((sum, r) => sum + parseFloat(r.total_price || 0), 0);
    const totalTickets = bookedRegs.reduce((sum, r) => sum + (r.ticket_count || 0), 0);

    // Per-event breakdown
    const eventStats = {};
    bookedRegs.forEach(r => {
        if (!eventStats[r.event_id]) {
            eventStats[r.event_id] = { title: r.event_title, count: 0, tickets: 0, revenue: 0, online: 0, offline: 0 };
        }
        eventStats[r.event_id].count++;
        eventStats[r.event_id].tickets += r.ticket_count || 0;
        eventStats[r.event_id].revenue += parseFloat(r.total_price || 0);
        if (r.mode === "online") eventStats[r.event_id].online++;
        else eventStats[r.event_id].offline++;
    });

    // Monthly trend
    const monthlyStats = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyStats[key] = { month: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }), revenue: 0, count: 0 };
    }
    bookedRegs.forEach(r => {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyStats[key]) {
            monthlyStats[key].revenue += parseFloat(r.total_price || 0);
            monthlyStats[key].count++;
        }
    });
    const monthlyData = Object.values(monthlyStats);
    const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

    return (
        <div className="manage-events-page">
            <div className="manage-events-header">
                <h2>Events Revenue</h2>
            </div>

            <div className="events-filters">
                {events.length > 1 && (
                    <div className="status-filter">
                        <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value)}
                        >
                            <option value="all">All Events</option>
                            {events.map(evt => (
                                <option key={evt.id} value={evt.id}>{evt.title}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button
                    className="earnings-refresh-btn"
                    onClick={fetchData}
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
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Summary Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                        <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Total Revenue</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1e293b" }}>{formatCurrency(totalRevenue)}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>{bookedRegs.length} booking{bookedRegs.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Online Collection</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#059669" }}>{formatCurrency(onlineRevenue)}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>{onlineRegs.length} booking{onlineRegs.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Offline Collection</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#d97706" }}>{formatCurrency(offlineRevenue)}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>{offlineRegs.length} booking{offlineRegs.length !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "4px" }}>Total Tickets Sold</div>
                            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#7c3aed" }}>{totalTickets}</div>
                            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>across {bookedRegs.length} booking{bookedRegs.length !== 1 ? "s" : ""}</div>
                        </div>
                    </div>

                    {/* Monthly Trend */}
                    <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                            Monthly Trend (Last 6 Months)
                        </h4>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "180px" }}>
                            {monthlyData.map((m, idx) => {
                                const barHeight = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 150 : 0;
                                return (
                                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 500 }}>
                                            {m.revenue > 0 ? formatCurrency(m.revenue) : "—"}
                                        </span>
                                        <div style={{
                                            width: "100%", maxWidth: "60px",
                                            height: `${Math.max(barHeight, 4)}px`,
                                            borderRadius: "6px 6px 0 0",
                                            background: m.revenue > 0 ? "linear-gradient(180deg, #1e293b, #334155)" : "#f1f5f9",
                                            transition: "height 0.5s ease"
                                        }}></div>
                                        <div style={{ textAlign: "center" }}>
                                            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{m.month}</span>
                                            {m.count > 0 && (
                                                <span style={{ display: "block", fontSize: "0.65rem", color: "#cbd5e1" }}>{m.count} bookings</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Per-Event Breakdown */}
                    {Object.keys(eventStats).length > 0 && (
                        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                                    Event-wise Breakdown
                                </h4>
                            </div>
                            <div className="registrations-table-wrapper">
                                <table className="registrations-table">
                                    <thead>
                                        <tr>
                                            <th>Event</th>
                                            <th>Bookings</th>
                                            <th>Tickets</th>
                                            <th>Online</th>
                                            <th>Offline</th>
                                            <th>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values(eventStats).sort((a, b) => b.revenue - a.revenue).map((e, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>{e.title}</td>
                                                <td>{e.count}</td>
                                                <td>{e.tickets}</td>
                                                <td><span className="mode-badge mode-online">{e.online}</span></td>
                                                <td><span className="mode-badge mode-offline">{e.offline}</span></td>
                                                <td style={{ fontWeight: 600 }}>{formatCurrency(e.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {bookedRegs.length === 0 && (
                        <div className="empty-state">
                            <i className="bi bi-bar-chart"></i>
                            <p>No booking data available yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventsRevenue;