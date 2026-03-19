import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const DATE_RANGES = [
    { value: "all_time", label: "All Time" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
];

const EventsRevenue = () => {
    const userData = JSON.parse(localStorage.getItem("user_data"));
    const session_id = localStorage.getItem("session_id");

    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventFilter, setEventFilter] = useState("all");
    const [dateRange, setDateRange] = useState("all_time");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const eventsRes = await callServicesApi({
                action: "GET_MANAGED_EVENTS",
                session_id,
                user_id: userData.id
            });
            const evts = eventsRes?.success ? (eventsRes.events || []) : [];
            setEvents(evts);

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

    // Date boundaries
    const getDateBoundaries = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - mondayOffset);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekStart.getDate() - 6);
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthEnd = new Date(thisMonthStart);
        lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
        const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
        return { today, thisWeekStart, lastWeekStart, lastWeekEnd, thisMonthStart, lastMonthStart, lastMonthEnd };
    };
    const db = getDateBoundaries();

    const filterByDate = (reg, range) => {
        const d = new Date(reg.created_at);
        d.setHours(0, 0, 0, 0);
        switch (range) {
            case "this_week": return d >= db.thisWeekStart;
            case "last_week": return d >= db.lastWeekStart && d <= db.lastWeekEnd;
            case "this_month": return d >= db.thisMonthStart;
            case "last_month": return d >= db.lastMonthStart && d <= db.lastMonthEnd;
            default: return true;
        }
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
        return `₹${Math.round(num).toLocaleString("en-IN")}`;
    };

    const getGrowthClass = (g) => g > 0 ? "positive" : g < 0 ? "negative" : "neutral";
    const calcGrowth = (c, p) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 1000) / 10;

    const PieChart = ({ data, valueKey, labelKey, colors }) => {
        const total = data.reduce((s, d) => s + d[valueKey], 0);
        let cumulative = 0;
        return (
            <div className="pie-chart-container">
                <div className="pie-chart-wrapper">
                    <svg viewBox="0 0 100 100" className="pie-chart-svg">
                        {data.map((item, idx) => {
                            const pct = total > 0 ? (item[valueKey] / total) * 100 : 0;
                            const startAngle = (cumulative / 100) * 360;
                            cumulative += pct;
                            const endAngle = (cumulative / 100) * 360;
                            const largeArc = pct > 50 ? 1 : 0;
                            const sr = (startAngle - 90) * (Math.PI / 180);
                            const er = (endAngle - 90) * (Math.PI / 180);
                            const x1 = 50 + 40 * Math.cos(sr), y1 = 50 + 40 * Math.sin(sr);
                            const x2 = 50 + 40 * Math.cos(er), y2 = 50 + 40 * Math.sin(er);
                            const d = pct === 100
                                ? "M 50 10 A 40 40 0 1 1 49.99 10 Z"
                                : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                            return <path key={idx} d={d} fill={colors[idx % colors.length]} className="pie-slice" />;
                        })}
                    </svg>
                </div>
                <div className="pie-chart-legend">
                    {data.map((item, idx) => {
                        const pct = total > 0 ? (item[valueKey] / total) * 100 : 0;
                        return (
                            <div key={idx} className="pie-legend-item">
                                <span className="pie-legend-color" style={{ background: colors[idx % colors.length] }}></span>
                                <span className="pie-legend-label">{item[labelKey]}</span>
                                <span className="pie-legend-value">{pct.toFixed(0)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (!userData || !userData.permissions?.includes("events")) {
        localStorage.clear();
        window.location.href = "/login";
        return null;
    }

    // Filtered data
    const today = new Date().toISOString().split("T")[0];
    const upcomingEventIds = new Set(events.filter(e => e.event_date >= today).map(e => e.id));
    const pastEventIds = new Set(events.filter(e => e.event_date < today).map(e => e.id));

    const allValid = registrations.filter(r => {
        if (eventFilter === "all") return true;
        if (eventFilter === "upcoming") return upcomingEventIds.has(r.event_id);
        if (eventFilter === "past") return pastEventIds.has(r.event_id);
        return r.event_id === parseInt(eventFilter);
    });
    const filtered = allValid.filter(r => r.status === "booked" && filterByDate(r, dateRange));
    const allFiltered = allValid.filter(r => filterByDate(r, dateRange));

    // Summary
    const totalRevenue = filtered.reduce((s, r) => s + parseFloat(r.total_price || 0), 0);
    const onlineRegs = filtered.filter(r => r.mode === "online");
    const offlineRegs = filtered.filter(r => r.mode === "offline");
    const onlineRevenue = onlineRegs.reduce((s, r) => s + parseFloat(r.total_price || 0), 0);
    const offlineRevenue = offlineRegs.reduce((s, r) => s + parseFloat(r.total_price || 0), 0);
    const totalTickets = filtered.reduce((s, r) => s + (r.ticket_count || 0), 0);
    const avgValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;

    // Comparisons
    const locFiltered = allValid.filter(r => r.status === "booked");
    const calcRev = (regs, start, end) => regs.filter(r => {
        const d = new Date(r.created_at); d.setHours(0, 0, 0, 0);
        return end ? (d >= start && d <= end) : d >= start;
    }).reduce((s, r) => s + parseFloat(r.total_price || 0), 0);

    const thisWeekRev = calcRev(locFiltered, db.thisWeekStart);
    const lastWeekRev = calcRev(locFiltered, db.lastWeekStart, db.lastWeekEnd);
    const thisMonthRev = calcRev(locFiltered, db.thisMonthStart);
    const lastMonthRev = calcRev(locFiltered, db.lastMonthStart, db.lastMonthEnd);
    const weekGrowth = calcGrowth(thisWeekRev, lastWeekRev);
    const monthGrowth = calcGrowth(thisMonthRev, lastMonthRev);

    // Customer stats
    const userBookings = {};
    filtered.forEach(r => { if (!userBookings[r.user_id]) userBookings[r.user_id] = 0; userBookings[r.user_id]++; });
    const totalCustomers = Object.keys(userBookings).length;
    const repeatCustomers = Object.values(userBookings).filter(c => c > 1).length;

    // Status breakdown
    const statusBreakdown = {};
    allFiltered.forEach(r => {
        if (!statusBreakdown[r.status]) statusBreakdown[r.status] = { status: r.status, count: 0, revenue: 0 };
        statusBreakdown[r.status].count++;
        statusBreakdown[r.status].revenue += parseFloat(r.total_price || 0);
    });

    // Mode breakdown
    const modeBreakdown = {};
    filtered.forEach(r => {
        const m = r.mode || "unknown";
        if (!modeBreakdown[m]) modeBreakdown[m] = { mode: m, count: 0, revenue: 0 };
        modeBreakdown[m].count++;
        modeBreakdown[m].revenue += parseFloat(r.total_price || 0);
    });

    // Ticket type breakdown
    const ticketTypeStats = {};
    filtered.forEach(r => {
        const t = r.ticket_type || "Unknown";
        if (!ticketTypeStats[t]) ticketTypeStats[t] = { ticket_type: t, count: 0, tickets: 0, revenue: 0 };
        ticketTypeStats[t].count++;
        ticketTypeStats[t].tickets += r.ticket_count || 0;
        ticketTypeStats[t].revenue += parseFloat(r.total_price || 0);
    });

    // Per-event breakdown
    const eventStats = {};
    filtered.forEach(r => {
        if (!eventStats[r.event_id]) eventStats[r.event_id] = { title: r.event_title, count: 0, tickets: 0, revenue: 0, online: 0, offline: 0 };
        eventStats[r.event_id].count++;
        eventStats[r.event_id].tickets += r.ticket_count || 0;
        eventStats[r.event_id].revenue += parseFloat(r.total_price || 0);
        if (r.mode === "online") eventStats[r.event_id].online++; else eventStats[r.event_id].offline++;
    });

    // Daily revenue (30 days)
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); thirtyDaysAgo.setHours(0, 0, 0, 0);
    const dailyStats = {};
    locFiltered.filter(r => new Date(r.created_at) >= thirtyDaysAgo && (eventFilter === "all" || r.event_id === parseInt(eventFilter)))
        .forEach(r => {
            const key = new Date(r.created_at).toISOString().split("T")[0];
            if (!dailyStats[key]) dailyStats[key] = { date: key, revenue: 0, bookings: 0 };
            dailyStats[key].revenue += parseFloat(r.total_price || 0);
            dailyStats[key].bookings++;
        });
    const dailyRevenue = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
    const maxDaily = Math.max(...dailyRevenue.map(d => d.revenue), 1);

    // Offline collection
    const offlineTotal = offlineRegs.reduce((s, r) => s + parseFloat(r.total_price || 0), 0);

    return (
        <div className="manage-events-page">
            <div className="manage-events-header">
                <h2>Earnings Dashboard</h2>
            </div>

            {/* Filters */}
            <div className="events-filters">
                <div className="status-filter">
                    <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                        {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </div>
                <div className="status-filter">
                    <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                        <option value="all">All Events</option>
                        <option value="upcoming">Upcoming Events</option>
                        <option value="past">Past Events</option>
                        {events.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
                    </select>
                </div>
                {(dateRange !== "all_time" || eventFilter !== "all") && (
                    <button
                        className="earnings-refresh-btn"
                        onClick={() => { setDateRange("all_time"); setEventFilter("all"); }}
                        style={{ minWidth: "unset" }}
                    >
                        <i className="bi bi-x-circle"></i>
                    </button>
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
                <div className="loading-spinner"><div className="spinner-border" role="status"></div></div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="earnings-summary-grid">
                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon revenue"><i className="bi bi-currency-rupee"></i></div>
                            <div className="summary-card-content">
                                <span className="summary-label">Total Revenue</span>
                                <span className="summary-value">{formatCurrency(totalRevenue)}</span>
                                <div className={`summary-growth ${getGrowthClass(monthGrowth)}`}>
                                    <i className={`bi bi-arrow-${monthGrowth >= 0 ? "up" : "down"}`}></i>
                                    {Math.abs(monthGrowth)}% vs last month
                                </div>
                            </div>
                        </div>
                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon profit"><i className="bi bi-globe"></i></div>
                            <div className="summary-card-content">
                                <span className="summary-label">Online Collection</span>
                                <span className="summary-value">{formatCurrency(onlineRevenue)}</span>
                                <span className="summary-subtext">{onlineRegs.length} booking{onlineRegs.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>
                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon payout"><i className="bi bi-shop"></i></div>
                            <div className="summary-card-content">
                                <span className="summary-label">Offline Collection</span>
                                <span className="summary-value">{formatCurrency(offlineRevenue)}</span>
                                <span className="summary-subtext">{offlineRegs.length} booking{offlineRegs.length !== 1 ? "s" : ""}</span>
                            </div>
                        </div>
                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon bookings"><i className="bi bi-ticket"></i></div>
                            <div className="summary-card-content">
                                <span className="summary-label">Tickets Sold</span>
                                <span className="summary-value">{totalTickets}</span>
                                <span className="summary-subtext">Avg: {formatCurrency(avgValue)}/booking</span>
                            </div>
                        </div>
                    </div>

                    {/* Offline Collection */}
                    {offlineRegs.length > 0 && (
                        <div className="earnings-card" style={{ marginBottom: "1.5rem" }}>
                            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #f1f5f9" }}>
                                <div className="summary-card-icon" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", color: "#ea580c" }}>
                                    <i className="bi bi-shop"></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Offline Collection</h3>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Collected directly at the venue</p>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ea580c" }}>{formatCurrency(offlineTotal)}</span>
                                    <span style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8" }}>{offlineRegs.length} booking{offlineRegs.length !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparison Cards */}
                    <div className="earnings-comparison-grid">
                        <div className="earnings-card comparison-card">
                            <div className="comparison-header"><i className="bi bi-calendar-week"></i><span>Weekly</span></div>
                            <div className="comparison-body">
                                <div className="comparison-item"><span className="comparison-label">This Week</span><span className="comparison-value">{formatCurrency(thisWeekRev)}</span></div>
                                <div className="comparison-item"><span className="comparison-label">Last Week</span><span className="comparison-value muted">{formatCurrency(lastWeekRev)}</span></div>
                            </div>
                            <div className={`comparison-growth ${getGrowthClass(weekGrowth)}`}>
                                <i className={`bi bi-arrow-${weekGrowth >= 0 ? "up" : "down"}-circle-fill`}></i>
                                <span>{weekGrowth >= 0 ? "+" : ""}{weekGrowth}%</span>
                            </div>
                        </div>
                        <div className="earnings-card comparison-card">
                            <div className="comparison-header"><i className="bi bi-calendar-month"></i><span>Monthly</span></div>
                            <div className="comparison-body">
                                <div className="comparison-item"><span className="comparison-label">This Month</span><span className="comparison-value">{formatCurrency(thisMonthRev)}</span></div>
                                <div className="comparison-item"><span className="comparison-label">Last Month</span><span className="comparison-value muted">{formatCurrency(lastMonthRev)}</span></div>
                            </div>
                            <div className={`comparison-growth ${getGrowthClass(monthGrowth)}`}>
                                <i className={`bi bi-arrow-${monthGrowth >= 0 ? "up" : "down"}-circle-fill`}></i>
                                <span>{monthGrowth >= 0 ? "+" : ""}{monthGrowth}%</span>
                            </div>
                        </div>
                        <div className="earnings-card comparison-card">
                            <div className="comparison-header"><i className="bi bi-people"></i><span>Customers</span></div>
                            <div className="comparison-body">
                                <div className="comparison-item"><span className="comparison-label">Total</span><span className="comparison-value">{totalCustomers}</span></div>
                                <div className="comparison-item"><span className="comparison-label">Repeat</span><span className="comparison-value highlight">{repeatCustomers}</span></div>
                            </div>
                            <div className="comparison-stat"><span>{filtered.length} total bookings</span></div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="earnings-charts-row">
                        <div className="earnings-card chart-card">
                            <div className="chart-card-header"><h3>Revenue Trend (Last 30 Days)</h3></div>
                            <div className="chart-card-body">
                                {dailyRevenue.length > 0 ? (
                                    <div className="line-chart">
                                        {(() => {
                                            const yLabels = [maxDaily, maxDaily * 0.5, 0];
                                            return (
                                                <>
                                                    <div className="line-chart-y-labels">
                                                        {yLabels.map((v, i) => <span key={i}>{formatCurrency(v)}</span>)}
                                                    </div>
                                                    <div className="line-chart-main">
                                                        <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="line-chart-svg">
                                                            {(() => {
                                                                const pts = dailyRevenue.map((d, i) => {
                                                                    const x = (i / (dailyRevenue.length - 1)) * 580 + 10;
                                                                    const y = maxDaily > 0 ? 170 - (d.revenue / maxDaily) * 150 : 170;
                                                                    return `${x},${y}`;
                                                                }).join(" ");
                                                                return (
                                                                    <>
                                                                        <polygon points={`10,170 ${pts} 590,170`} className="line-chart-area" />
                                                                        <polyline points={pts} className="line-chart-line" />
                                                                        {dailyRevenue.map((d, i) => {
                                                                            const x = (i / (dailyRevenue.length - 1)) * 580 + 10;
                                                                            const y = maxDaily > 0 ? 170 - (d.revenue / maxDaily) * 150 : 170;
                                                                            const tx = x < 45 ? 35 : x > 555 ? -35 : 0;
                                                                            const ty = y < 40 ? 35 : -35;
                                                                            return (
                                                                                <g key={i} className="line-chart-point">
                                                                                    <circle cx={x} cy={y} r="16" className="line-chart-dot-hover" />
                                                                                    <circle cx={x} cy={y} r="4" className="line-chart-dot" />
                                                                                    <g className="line-chart-tooltip" transform={`translate(${x + tx}, ${y + ty})`}>
                                                                                        <rect x="-35" y="-14" width="70" height="22" rx="4" />
                                                                                        <text x="0" y="2" textAnchor="middle">{formatCurrency(d.revenue)}</text>
                                                                                    </g>
                                                                                </g>
                                                                            );
                                                                        })}
                                                                    </>
                                                                );
                                                            })()}
                                                        </svg>
                                                        <div className="line-chart-labels">
                                                            {dailyRevenue.filter((_, i) => i % 6 === 0 || i === dailyRevenue.length - 1).map((d, i) => (
                                                                <span key={i}>{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="chart-empty"><i className="bi bi-bar-chart"></i><p>No revenue data for this period</p></div>
                                )}
                            </div>
                        </div>

                        <div className="earnings-card chart-card small">
                            <div className="chart-card-header"><h3>Booking Status</h3></div>
                            <div className="chart-card-body">
                                {Object.keys(statusBreakdown).length > 0 ? (
                                    <div className="status-breakdown">
                                        {Object.values(statusBreakdown).map((s, i) => {
                                            const total = Object.values(statusBreakdown).reduce((sum, x) => sum + x.count, 0);
                                            const pct = total > 0 ? (s.count / total) * 100 : 0;
                                            return (
                                                <div key={i} className={`status-item status-${s.status}`}>
                                                    <div className="status-info"><span className="status-name">{s.status}</span><span className="status-count">{s.count}</span></div>
                                                    <div className="status-bar-bg"><div className="status-bar" style={{ width: `${pct}%` }}></div></div>
                                                    <span className="status-revenue">{formatCurrency(s.revenue)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="chart-empty"><i className="bi bi-pie-chart"></i><p>No booking data</p></div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Event Breakdown */}
                    {Object.keys(eventStats).length > 0 && (
                        <div className="earnings-card" style={{ marginBottom: "1.5rem" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>
                                    <i className="bi bi-trophy me-2"></i>Event-wise Breakdown
                                </h3>
                            </div>
                            <div className="earnings-table-wrapper" style={{ padding: "0 16px 16px" }}>
                                <table className="earnings-table">
                                    <thead><tr><th>Event</th><th>Bookings</th><th>Tickets</th><th>Online</th><th>Offline</th><th>Revenue</th></tr></thead>
                                    <tbody>
                                        {Object.values(eventStats).sort((a, b) => b.revenue - a.revenue).map((e, idx) => (
                                            <tr key={idx}>
                                                <td className="kennel-name">{e.title}</td>
                                                <td>{e.count}</td>
                                                <td>{e.tickets}</td>
                                                <td><span className="mode-badge mode-online">{e.online}</span></td>
                                                <td><span className="mode-badge mode-offline">{e.offline}</span></td>
                                                <td className="revenue">{formatCurrency(e.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pie Charts Row */}
                    <div className="earnings-bottom-row">
                        <div className="earnings-card info-card">
                            <div className="info-card-header"><i className="bi bi-credit-card"></i><h3>Payment Modes</h3></div>
                            <div className="info-card-body">
                                {Object.keys(modeBreakdown).length > 0 ? (
                                    <PieChart data={Object.values(modeBreakdown)} valueKey="count" labelKey="mode" colors={["#059669", "#d97706", "#6366f1", "#ec4899"]} />
                                ) : (<div className="info-empty">No payment data</div>)}
                            </div>
                        </div>
                        <div className="earnings-card info-card">
                            <div className="info-card-header"><i className="bi bi-ticket"></i><h3>Ticket Types</h3></div>
                            <div className="info-card-body">
                                {Object.keys(ticketTypeStats).length > 0 ? (
                                    <PieChart data={Object.values(ticketTypeStats)} valueKey="tickets" labelKey="ticket_type" colors={["#D84A39", "#471915", "#f97316", "#eab308", "#84cc16"]} />
                                ) : (<div className="info-empty">No ticket data</div>)}
                            </div>
                        </div>
                    </div>

                    {filtered.length === 0 && (
                        <div className="empty-state"><i className="bi bi-bar-chart"></i><p>No booking data available yet</p></div>
                    )}
                </>
            )}
        </div>
    );
};

export default EventsRevenue;