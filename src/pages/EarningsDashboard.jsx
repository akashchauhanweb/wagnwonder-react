import React, { useState, useEffect, useMemo } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const DATE_RANGES = [
    { value: "all_time", label: "All Time" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
];

const EarningsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState(null);
    const [error, setError] = useState("");
    
    // Filters
    const [dateRange, setDateRange] = useState("all_time");
    const [selectedState, setSelectedState] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [selectedKennel, setSelectedKennel] = useState("");

    // Fetch data once on mount
    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");
        
        try {
            const response = await callServicesApi({
                action: "GET_EARNINGS_DASHBOARD",
                session_id: localStorage.getItem("session_id")
            });
            
            if (response?.success) {
                setRawData(response.data);
            } else {
                setError(response?.message || "Failed to fetch dashboard data");
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError("Something went wrong while fetching data");
        }
        
        setLoading(false);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Reset dependent filters when parent changes
    useEffect(() => {
        setSelectedCity("");
        setSelectedKennel("");
    }, [selectedState]);

    useEffect(() => {
        setSelectedKennel("");
    }, [selectedCity]);

    // ============ COMPUTED VALUES ============
    
    // Get date boundaries
    const dateBoundaries = useMemo(() => {
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
        
        return {
            today,
            thisWeekStart,
            lastWeekStart,
            lastWeekEnd,
            thisMonthStart,
            lastMonthStart,
            lastMonthEnd
        };
    }, []);

    // Filter options from raw data
    const filterOptions = useMemo(() => {
        if (!rawData?.kennels) return { states: [], cities: [], kennels: [] };
        
        const states = [...new Set(rawData.kennels.map(k => k.state).filter(Boolean))].sort();
        
        const cities = rawData.kennels
            .filter(k => k.city && (!selectedState || k.state === selectedState))
            .map(k => ({ city: k.city, state: k.state }))
            .filter((v, i, a) => a.findIndex(t => t.city === v.city) === i)
            .sort((a, b) => a.city.localeCompare(b.city));
        
        const kennels = rawData.kennels
            .filter(k => {
                if (selectedCity) return k.city === selectedCity;
                if (selectedState) return k.state === selectedState;
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
        
        return { states, cities, kennels };
    }, [rawData, selectedState, selectedCity]);

    // Filtered bookings based on all filters
    const filteredBookings = useMemo(() => {
        if (!rawData?.bookings) return [];
        
        return rawData.bookings.filter(booking => {
            // Status filter - only booked and completed
            if (!['booked', 'completed'].includes(booking.status)) return false;
            
            // Location filters
            if (selectedState && booking.kennel_state !== selectedState) return false;
            if (selectedCity && booking.kennel_city !== selectedCity) return false;
            if (selectedKennel && booking.kennel_id !== parseInt(selectedKennel)) return false;
            
            // Date filter
            const bookingDate = new Date(booking.created_at);
            bookingDate.setHours(0, 0, 0, 0);
            
            switch (dateRange) {
                case "this_week":
                    return bookingDate >= dateBoundaries.thisWeekStart;
                case "last_week":
                    return bookingDate >= dateBoundaries.lastWeekStart && bookingDate <= dateBoundaries.lastWeekEnd;
                case "this_month":
                    return bookingDate >= dateBoundaries.thisMonthStart;
                case "last_month":
                    return bookingDate >= dateBoundaries.lastMonthStart && bookingDate <= dateBoundaries.lastMonthEnd;
                default:
                    return true;
            }
        });
    }, [rawData, selectedState, selectedCity, selectedKennel, dateRange, dateBoundaries]);

    // All bookings for status breakdown (ignoring status filter)
    const allFilteredBookings = useMemo(() => {
        if (!rawData?.bookings) return [];
        
        return rawData.bookings.filter(booking => {
            if (selectedState && booking.kennel_state !== selectedState) return false;
            if (selectedCity && booking.kennel_city !== selectedCity) return false;
            if (selectedKennel && booking.kennel_id !== parseInt(selectedKennel)) return false;
            
            const bookingDate = new Date(booking.created_at);
            bookingDate.setHours(0, 0, 0, 0);
            
            switch (dateRange) {
                case "this_week":
                    return bookingDate >= dateBoundaries.thisWeekStart;
                case "last_week":
                    return bookingDate >= dateBoundaries.lastWeekStart && bookingDate <= dateBoundaries.lastWeekEnd;
                case "this_month":
                    return bookingDate >= dateBoundaries.thisMonthStart;
                case "last_month":
                    return bookingDate >= dateBoundaries.lastMonthStart && bookingDate <= dateBoundaries.lastMonthEnd;
                default:
                    return true;
            }
        });
    }, [rawData, selectedState, selectedCity, selectedKennel, dateRange, dateBoundaries]);

    // Summary metrics
    const summary = useMemo(() => {
        if (!filteredBookings.length) {
            return {
                total_bookings: 0,
                total_revenue: 0,
                net_profit: 0,
                vendor_payout: 0,
                avg_booking_value: 0,
                avg_stay_duration: 0
            };
        }
        
        const total_revenue = filteredBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
        const net_profit = filteredBookings.reduce((sum, b) => {
            if (b.mode === "offline") return sum;
            const markup = parseFloat(b.kennel_markup || 0);
            return sum + (parseFloat(b.total_price || 0) * (markup / 100));
        }, 0);
        const total_days = filteredBookings.reduce((sum, b) => sum + parseInt(b.days || 0), 0);
        
        return {
            total_bookings: filteredBookings.length,
            total_revenue,
            net_profit,
            vendor_payout: total_revenue - net_profit,
            avg_booking_value: total_revenue / filteredBookings.length,
            avg_stay_duration: total_days / filteredBookings.length
        };
    }, [filteredBookings]);

    // Kennel offline collection breakdown
    const offlineCollection = useMemo(() => {
        if (!filteredBookings.length) return { total: 0, bookings: 0, kennels: [] };

        const offlineBookings = filteredBookings.filter(b => b.mode === "offline");
        if (!offlineBookings.length) return { total: 0, bookings: 0, kennels: [] };

        const total = offlineBookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

        const kennelStats = {};
        offlineBookings.forEach(b => {
            const id = b.kennel_id;
            if (!kennelStats[id]) {
                kennelStats[id] = {
                    kennel_id: id,
                    kennel_name: b.kennel_name,
                    city: b.kennel_city,
                    booking_count: 0,
                    total_collected: 0
                };
            }
            kennelStats[id].booking_count++;
            kennelStats[id].total_collected += parseFloat(b.total_price || 0);
        });

        return {
            total,
            bookings: offlineBookings.length,
            kennels: Object.values(kennelStats).sort((a, b) => b.total_collected - a.total_collected)
        };
    }, [filteredBookings]);

    // Status breakdown
    const statusBreakdown = useMemo(() => {
        if (!allFilteredBookings.length) return [];
        
        const breakdown = {};
        allFilteredBookings.forEach(b => {
            if (!breakdown[b.status]) {
                breakdown[b.status] = { status: b.status, count: 0, revenue: 0 };
            }
            breakdown[b.status].count++;
            breakdown[b.status].revenue += parseFloat(b.total_price || 0);
        });
        
        return Object.values(breakdown);
    }, [allFilteredBookings]);

    // Mode breakdown
    const modeBreakdown = useMemo(() => {
        if (!filteredBookings.length) return [];
        
        const breakdown = {};
        filteredBookings.forEach(b => {
            const mode = b.mode || 'unknown';
            if (!breakdown[mode]) {
                breakdown[mode] = { mode, count: 0, revenue: 0 };
            }
            breakdown[mode].count++;
            breakdown[mode].revenue += parseFloat(b.total_price || 0);
        });
        
        return Object.values(breakdown);
    }, [filteredBookings]);

    // Top 5 kennels
    const topKennels = useMemo(() => {
        if (!filteredBookings.length) return [];
        
        const kennelStats = {};
        filteredBookings.forEach(b => {
            const id = b.kennel_id;
            if (!kennelStats[id]) {
                kennelStats[id] = {
                    kennel_id: id,
                    kennel_name: b.kennel_name,
                    city: b.kennel_city,
                    state: b.kennel_state,
                    markup: b.kennel_markup,
                    booking_count: 0,
                    total_revenue: 0,
                    net_profit: 0
                };
            }
            kennelStats[id].booking_count++;
            const revenue = parseFloat(b.total_price || 0);
            kennelStats[id].total_revenue += revenue;
            kennelStats[id].net_profit += b.mode === "offline" ? 0 : revenue * (parseFloat(b.kennel_markup || 0) / 100);
        });
        
        return Object.values(kennelStats)
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);
    }, [filteredBookings]);

    // Top 5 cities
    const topCities = useMemo(() => {
        if (!filteredBookings.length) return [];
        
        const cityStats = {};
        filteredBookings.forEach(b => {
            const city = b.kennel_city;
            if (!cityStats[city]) {
                cityStats[city] = { city, state: b.kennel_state, booking_count: 0, total_revenue: 0 };
            }
            cityStats[city].booking_count++;
            cityStats[city].total_revenue += parseFloat(b.total_price || 0);
        });
        
        return Object.values(cityStats)
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);
    }, [filteredBookings]);

    // Top 5 states
    const topStates = useMemo(() => {
        if (!filteredBookings.length) return [];
        
        const stateStats = {};
        filteredBookings.forEach(b => {
            const state = b.kennel_state;
            if (!stateStats[state]) {
                stateStats[state] = { state, booking_count: 0, total_revenue: 0 };
            }
            stateStats[state].booking_count++;
            stateStats[state].total_revenue += parseFloat(b.total_price || 0);
        });
        
        return Object.values(stateStats)
            .sort((a, b) => b.total_revenue - a.total_revenue)
            .slice(0, 5);
    }, [filteredBookings]);

    // Daily revenue (last 30 days) - always based on location filter only
    const dailyRevenue = useMemo(() => {
        if (!rawData?.bookings) return [];
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        
        const relevantBookings = rawData.bookings.filter(b => {
            if (!['booked', 'completed'].includes(b.status)) return false;
            if (selectedState && b.kennel_state !== selectedState) return false;
            if (selectedCity && b.kennel_city !== selectedCity) return false;
            if (selectedKennel && b.kennel_id !== parseInt(selectedKennel)) return false;
            
            const bookingDate = new Date(b.created_at);
            return bookingDate >= thirtyDaysAgo;
        });
        
        const dailyStats = {};
        relevantBookings.forEach(b => {
            const dateKey = new Date(b.created_at).toISOString().split('T')[0];
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { date: dateKey, revenue: 0, bookings: 0 };
            }
            dailyStats[dateKey].revenue += parseFloat(b.total_price || 0);
            dailyStats[dateKey].bookings++;
        });
        
        return Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
    }, [rawData, selectedState, selectedCity, selectedKennel]);

    // Room types
    const roomTypes = useMemo(() => {
        if (!filteredBookings.length) return [];
        
        const roomStats = {};
        filteredBookings.forEach(b => {
            const roomType = b.room_type_name || 'Unknown';
            if (!roomStats[roomType]) {
                roomStats[roomType] = { room_type: roomType, booking_count: 0, revenue: 0 };
            }
            roomStats[roomType].booking_count++;
            roomStats[roomType].revenue += parseFloat(b.total_price || 0);
        });
        
        return Object.values(roomStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [filteredBookings]);

    // Pet types
    const petTypes = useMemo(() => {
        if (!rawData?.booking_pets || !filteredBookings.length) return [];
        
        const filteredBookingIds = new Set(filteredBookings.map(b => b.booking_id));
        const relevantPets = rawData.booking_pets.filter(bp => filteredBookingIds.has(bp.booking_id));
        
        const petStats = {};
        relevantPets.forEach(bp => {
            const type = bp.pet_type || 'Unknown';
            if (!petStats[type]) {
                petStats[type] = { type, count: 0 };
            }
            petStats[type].count++;
        });
        
        return Object.values(petStats).sort((a, b) => b.count - a.count);
    }, [rawData, filteredBookings]);

    // Customer stats
    const customerStats = useMemo(() => {
        if (!filteredBookings.length) return { total_customers: 0, repeat_customers: 0 };
        
        const userBookings = {};
        filteredBookings.forEach(b => {
            if (!userBookings[b.user_id]) userBookings[b.user_id] = 0;
            userBookings[b.user_id]++;
        });
        
        const total_customers = Object.keys(userBookings).length;
        const repeat_customers = Object.values(userBookings).filter(count => count > 1).length;
        
        return { total_customers, repeat_customers };
    }, [filteredBookings]);

    // Comparison metrics (always uses location filter only, ignores date filter)
    const comparisons = useMemo(() => {
        if (!rawData?.bookings) {
            return {
                this_week: 0, last_week: 0, week_growth: 0,
                this_month: 0, last_month: 0, month_growth: 0
            };
        }
        
        const locationFiltered = rawData.bookings.filter(b => {
            if (!['booked', 'completed'].includes(b.status)) return false;
            if (selectedState && b.kennel_state !== selectedState) return false;
            if (selectedCity && b.kennel_city !== selectedCity) return false;
            if (selectedKennel && b.kennel_id !== parseInt(selectedKennel)) return false;
            return true;
        });
        
        const calcRevenue = (bookings, startDate, endDate = null) => {
            return bookings
                .filter(b => {
                    const date = new Date(b.created_at);
                    date.setHours(0, 0, 0, 0);
                    if (endDate) {
                        return date >= startDate && date <= endDate;
                    }
                    return date >= startDate;
                })
                .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);
        };
        
        const this_week = calcRevenue(locationFiltered, dateBoundaries.thisWeekStart);
        const last_week = calcRevenue(locationFiltered, dateBoundaries.lastWeekStart, dateBoundaries.lastWeekEnd);
        const this_month = calcRevenue(locationFiltered, dateBoundaries.thisMonthStart);
        const last_month = calcRevenue(locationFiltered, dateBoundaries.lastMonthStart, dateBoundaries.lastMonthEnd);
        
        const calcGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 1000) / 10;
        };
        
        return {
            this_week,
            last_week,
            week_growth: calcGrowth(this_week, last_week),
            this_month,
            last_month,
            month_growth: calcGrowth(this_month, last_month)
        };
    }, [rawData, selectedState, selectedCity, selectedKennel, dateBoundaries]);

    // ============ HELPER FUNCTIONS ============
    
    const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    const formatNumber = (num) => parseFloat(num || 0).toLocaleString('en-IN');

    const getGrowthClass = (growth) => {
        if (growth > 0) return "positive";
        if (growth < 0) return "negative";
        return "neutral";
    };

    const clearFilters = () => {
        setDateRange("all_time");
        setSelectedState("");
        setSelectedCity("");
        setSelectedKennel("");
    };

    return (
        <div className="earnings-dashboard">
            {/* Header */}
            <div className="earnings-header">
                <div className="earnings-header-left">
                    <h2>Earnings Dashboard</h2>
                    <p className="earnings-subtitle">Track revenue, profits, and performance metrics</p>
                </div>
                <button className="earnings-refresh-btn" onClick={fetchDashboardData} disabled={loading}>
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="earnings-filters">
                <div className="earnings-filters-row">
                    <div className="earnings-filter-group">
                        <label>Time Period</label>
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                            {DATE_RANGES.map(range => (
                                <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="earnings-filter-group">
                        <label>State</label>
                        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                            <option value="">All States</option>
                            {filterOptions.states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="earnings-filter-group">
                        <label>City</label>
                        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                            <option value="">All Cities</option>
                            {filterOptions.cities.map(c => (
                                <option key={c.city} value={c.city}>{c.city}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="earnings-filter-group">
                        <label>Kennel</label>
                        <select value={selectedKennel} onChange={(e) => setSelectedKennel(e.target.value)}>
                            <option value="">All Kennels</option>
                            {filterOptions.kennels.map(k => (
                                <option key={k.id} value={k.id}>{k.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="earnings-filter-actions">
                        <button className="earnings-clear-btn" onClick={clearFilters}>
                            <i className="bi bi-x-circle"></i>
                            Clear
                        </button>
                    </div>
                </div>
                
                {(selectedState || selectedCity || selectedKennel || dateRange !== "all_time") && (
                    <div className="earnings-active-filters">
                        <span className="active-filters-label">Active filters:</span>
                        {dateRange !== "all_time" && (
                            <span className="filter-tag">{DATE_RANGES.find(r => r.value === dateRange)?.label}</span>
                        )}
                        {selectedState && <span className="filter-tag">{selectedState}</span>}
                        {selectedCity && <span className="filter-tag">{selectedCity}</span>}
                        {selectedKennel && (
                            <span className="filter-tag">
                                {filterOptions.kennels.find(k => k.id === parseInt(selectedKennel))?.name}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="earnings-loading">
                    <div className="spinner-border" role="status" />
                    <p>Loading dashboard data...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="earnings-error">
                    <i className="bi bi-exclamation-triangle"></i>
                    <p>{error}</p>
                    <button onClick={fetchDashboardData}>Try Again</button>
                </div>
            )}

            {/* Dashboard Content */}
            {!loading && !error && rawData && (
                <>
                    {/* Summary Cards */}
                    <div className="earnings-summary-grid">
                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon revenue">
                                <i className="bi bi-currency-rupee"></i>
                            </div>
                            <div className="summary-card-content">
                                <span className="summary-label">Total Revenue</span>
                                <span className="summary-value">{formatCurrency(summary.total_revenue)}</span>
                                <div className={`summary-growth ${getGrowthClass(comparisons.month_growth)}`}>
                                    <i className={`bi bi-arrow-${comparisons.month_growth >= 0 ? 'up' : 'down'}`}></i>
                                    {Math.abs(comparisons.month_growth)}% vs last month
                                </div>
                            </div>
                        </div>

                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon profit">
                                <i className="bi bi-graph-up-arrow"></i>
                            </div>
                            <div className="summary-card-content">
                                <span className="summary-label">Net Profit</span>
                                <span className="summary-value">{formatCurrency(summary.net_profit)}</span>
                                <span className="summary-subtext">Wag N Wonder's earnings</span>
                            </div>
                        </div>

                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon payout">
                                <i className="bi bi-wallet2"></i>
                            </div>
                            <div className="summary-card-content">
                                <span className="summary-label">Vendor Payout</span>
                                <span className="summary-value">{formatCurrency(summary.vendor_payout)}</span>
                                <span className="summary-subtext">Due to kennel partners</span>
                            </div>
                        </div>

                        <div className="earnings-card summary-card">
                            <div className="summary-card-icon bookings">
                                <i className="bi bi-calendar-check"></i>
                            </div>
                            <div className="summary-card-content">
                                <span className="summary-label">Total Bookings</span>
                                <span className="summary-value">{formatNumber(summary.total_bookings)}</span>
                                <span className="summary-subtext">Avg: {formatCurrency(summary.avg_booking_value)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Kennel Offline Collection */}
                    {offlineCollection.bookings > 0 && (
                        <div className="earnings-card" style={{ marginBottom: "1.5rem" }}>
                            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid #f1f5f9" }}>
                                <div className="summary-card-icon" style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", color: "#ea580c" }}>
                                    <i className="bi bi-shop"></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Kennel Offline Collection</h3>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                                        Collected directly by kennels — no Wag N Wonder markup
                                    </p>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ea580c" }}>{formatCurrency(offlineCollection.total)}</span>
                                    <span style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8" }}>{offlineCollection.bookings} booking{offlineCollection.bookings !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                            <div style={{ padding: "16px 24px" }}>
                                <div className="earnings-table-wrapper">
                                    <table className="earnings-table">
                                        <thead>
                                            <tr>
                                                <th>Kennel</th>
                                                <th>City</th>
                                                <th>Bookings</th>
                                                <th>Collected</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {offlineCollection.kennels.map(k => (
                                                <tr key={k.kennel_id}>
                                                    <td className="kennel-name">{k.kennel_name}</td>
                                                    <td>{k.city}</td>
                                                    <td>{k.booking_count}</td>
                                                    <td className="revenue">{formatCurrency(k.total_collected)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Comparison Cards */}
                    <div className="earnings-comparison-grid">
                        <div className="earnings-card comparison-card">
                            <div className="comparison-header">
                                <i className="bi bi-calendar-week"></i>
                                <span>Weekly Comparison</span>
                            </div>
                            <div className="comparison-body">
                                <div className="comparison-item">
                                    <span className="comparison-label">This Week</span>
                                    <span className="comparison-value">{formatCurrency(comparisons.this_week)}</span>
                                </div>
                                <div className="comparison-item">
                                    <span className="comparison-label">Last Week</span>
                                    <span className="comparison-value muted">{formatCurrency(comparisons.last_week)}</span>
                                </div>
                            </div>
                            <div className={`comparison-growth ${getGrowthClass(comparisons.week_growth)}`}>
                                <i className={`bi bi-arrow-${comparisons.week_growth >= 0 ? 'up' : 'down'}-circle-fill`}></i>
                                <span>{comparisons.week_growth >= 0 ? '+' : ''}{comparisons.week_growth}%</span>
                            </div>
                        </div>

                        <div className="earnings-card comparison-card">
                            <div className="comparison-header">
                                <i className="bi bi-calendar-month"></i>
                                <span>Monthly Comparison</span>
                            </div>
                            <div className="comparison-body">
                                <div className="comparison-item">
                                    <span className="comparison-label">This Month</span>
                                    <span className="comparison-value">{formatCurrency(comparisons.this_month)}</span>
                                </div>
                                <div className="comparison-item">
                                    <span className="comparison-label">Last Month</span>
                                    <span className="comparison-value muted">{formatCurrency(comparisons.last_month)}</span>
                                </div>
                            </div>
                            <div className={`comparison-growth ${getGrowthClass(comparisons.month_growth)}`}>
                                <i className={`bi bi-arrow-${comparisons.month_growth >= 0 ? 'up' : 'down'}-circle-fill`}></i>
                                <span>{comparisons.month_growth >= 0 ? '+' : ''}{comparisons.month_growth}%</span>
                            </div>
                        </div>

                        <div className="earnings-card comparison-card">
                            <div className="comparison-header">
                                <i className="bi bi-people"></i>
                                <span>Customer Stats</span>
                            </div>
                            <div className="comparison-body">
                                <div className="comparison-item">
                                    <span className="comparison-label">Total Customers</span>
                                    <span className="comparison-value">{formatNumber(customerStats.total_customers)}</span>
                                </div>
                                <div className="comparison-item">
                                    <span className="comparison-label">Repeat Customers</span>
                                    <span className="comparison-value highlight">{formatNumber(customerStats.repeat_customers)}</span>
                                </div>
                            </div>
                            <div className="comparison-stat">
                                <span>Avg Stay: {(summary.avg_stay_duration || 0).toFixed(1)} days</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="earnings-charts-row">
                        <div className="earnings-card chart-card">
                            <div className="chart-card-header">
                                <h3>Revenue Trend (Last 30 Days)</h3>
                            </div>
                            <div className="chart-card-body">
                                {dailyRevenue.length > 0 ? (
                                    <div className="line-chart">
                                        {(() => {
                                            const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
                                            const yLabels = [maxRevenue, maxRevenue * 0.5, 0];
                                            return (
                                                <>
                                                    <div className="line-chart-y-labels">
                                                        {yLabels.map((val, idx) => (
                                                            <span key={idx}>{formatCurrency(val)}</span>
                                                        ))}
                                                    </div>
                                                    <div className="line-chart-main">
                                                        <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="line-chart-svg">
                                                            {(() => {
                                                                const points = dailyRevenue.map((day, idx) => {
                                                                    const x = (idx / (dailyRevenue.length - 1)) * 580 + 10;
                                                                    const y = maxRevenue > 0 ? 170 - (day.revenue / maxRevenue) * 150 : 170;
                                                                    return `${x},${y}`;
                                                                }).join(' ');
                                                                const areaPoints = `10,170 ${points} 590,170`;
                                                                return (
                                                                    <>
                                                                        <polygon points={areaPoints} className="line-chart-area" />
                                                                        <polyline points={points} className="line-chart-line" />
                                                                        {dailyRevenue.map((day, idx) => {
                                                                            const x = (idx / (dailyRevenue.length - 1)) * 580 + 10;
                                                                            const y = maxRevenue > 0 ? 170 - (day.revenue / maxRevenue) * 150 : 170;
                                                                            const tooltipX = x < 45 ? 35 : x > 555 ? -35 : 0;
                                                                            const tooltipY = y < 40 ? 35 : -35;
                                                                            return (
                                                                                <g key={idx} className="line-chart-point">
                                                                                    <circle cx={x} cy={y} r="16" className="line-chart-dot-hover" />
                                                                                    <circle cx={x} cy={y} r="4" className="line-chart-dot" />
                                                                                    <g className="line-chart-tooltip" transform={`translate(${x + tooltipX}, ${y + tooltipY})`}>
                                                                                        <rect x="-35" y="-14" width="70" height="22" rx="4" />
                                                                                        <text x="0" y="2" textAnchor="middle">{formatCurrency(day.revenue)}</text>
                                                                                    </g>
                                                                                </g>
                                                                            );
                                                                        })}
                                                                    </>
                                                                );
                                                            })()}
                                                        </svg>
                                                        <div className="line-chart-labels">
                                                            {dailyRevenue.filter((_, idx) => idx % 6 === 0 || idx === dailyRevenue.length - 1).map((day, idx) => (
                                                                <span key={idx}>{new Date(day.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="chart-empty">
                                        <i className="bi bi-bar-chart"></i>
                                        <p>No revenue data for this period</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="earnings-card chart-card small">
                            <div className="chart-card-header">
                                <h3>Booking Status</h3>
                            </div>
                            <div className="chart-card-body">
                                {statusBreakdown.length > 0 ? (
                                    <div className="status-breakdown">
                                        {statusBreakdown.map((status, idx) => {
                                            const total = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
                                            const percentage = total > 0 ? (status.count / total) * 100 : 0;
                                            return (
                                                <div key={idx} className={`status-item status-${status.status}`}>
                                                    <div className="status-info">
                                                        <span className="status-name">{status.status}</span>
                                                        <span className="status-count">{status.count}</span>
                                                    </div>
                                                    <div className="status-bar-bg">
                                                        <div className="status-bar" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                    <span className="status-revenue">{formatCurrency(status.revenue)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="chart-empty">
                                        <i className="bi bi-pie-chart"></i>
                                        <p>No booking data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tables Row */}
                    <div className="earnings-tables-row">
                        <div className="earnings-card table-card">
                            <div className="table-card-header">
                                <h3><i className="bi bi-trophy"></i> Top 5 Kennels</h3>
                            </div>
                            <div className="table-card-body">
                                {topKennels.length > 0 ? (
                                    <div className="earnings-table-wrapper">
                                        <table className="earnings-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Kennel</th>
                                                    <th>City</th>
                                                    <th>Bookings</th>
                                                    <th>Revenue</th>
                                                    <th>Profit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topKennels.map((kennel, idx) => (
                                                    <tr key={kennel.kennel_id}>
                                                        <td><span className={`rank rank-${idx + 1}`}>{idx + 1}</span></td>
                                                        <td className="kennel-name">{kennel.kennel_name}</td>
                                                        <td>{kennel.city}</td>
                                                        <td>{kennel.booking_count}</td>
                                                        <td className="revenue">{formatCurrency(kennel.total_revenue)}</td>
                                                        <td className="profit">{formatCurrency(kennel.net_profit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="table-empty">
                                        <i className="bi bi-building"></i>
                                        <p>No kennel data available</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="earnings-card table-card small">
                            <div className="table-card-header">
                                <h3><i className="bi bi-geo-alt"></i> Top Locations</h3>
                            </div>
                            <div className="table-card-body">
                                {topCities.length > 0 ? (
                                    <div className="location-rankings">
                                        <div className="location-section">
                                            <h4>By City</h4>
                                            {topCities.map((city, idx) => (
                                                <div key={idx} className="location-item">
                                                    <span className="location-rank">{idx + 1}</span>
                                                    <span className="location-name">{city.city}</span>
                                                    <span className="location-revenue">{formatCurrency(city.total_revenue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="location-section">
                                            <h4>By State</h4>
                                            {topStates.map((state, idx) => (
                                                <div key={idx} className="location-item">
                                                    <span className="location-rank">{idx + 1}</span>
                                                    <span className="location-name">{state.state}</span>
                                                    <span className="location-revenue">{formatCurrency(state.total_revenue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-empty">
                                        <i className="bi bi-map"></i>
                                        <p>No location data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="earnings-bottom-row">
                        <div className="earnings-card info-card">
                            <div className="info-card-header">
                                <i className="bi bi-credit-card"></i>
                                <h3>Payment Modes</h3>
                            </div>
                            <div className="info-card-body">
                                {modeBreakdown.length > 0 ? (
                                    <div className="pie-chart-container">
                                        <div className="pie-chart-wrapper">
                                            <svg viewBox="0 0 100 100" className="pie-chart-svg">
                                                {(() => {
                                                    const total = modeBreakdown.reduce((sum, m) => sum + m.count, 0);
                                                    let cumulative = 0;
                                                    const colors = ['#059669', '#d97706', '#6366f1', '#ec4899'];
                                                    return modeBreakdown.map((mode, idx) => {
                                                        const percentage = total > 0 ? (mode.count / total) * 100 : 0;
                                                        const startAngle = (cumulative / 100) * 360;
                                                        cumulative += percentage;
                                                        const endAngle = (cumulative / 100) * 360;
                                                        const largeArc = percentage > 50 ? 1 : 0;
                                                        const startRad = (startAngle - 90) * (Math.PI / 180);
                                                        const endRad = (endAngle - 90) * (Math.PI / 180);
                                                        const x1 = 50 + 40 * Math.cos(startRad);
                                                        const y1 = 50 + 40 * Math.sin(startRad);
                                                        const x2 = 50 + 40 * Math.cos(endRad);
                                                        const y2 = 50 + 40 * Math.sin(endRad);
                                                        const d = percentage === 100 
                                                            ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
                                                            : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                                        return (
                                                            <path 
                                                                key={idx}
                                                                d={d} 
                                                                fill={colors[idx % colors.length]} 
                                                                className="pie-slice"
                                                                onMouseEnter={(e) => {
                                                                    const tooltip = e.target.closest('.pie-chart-wrapper').querySelector('.pie-hover-tooltip');
                                                                    tooltip.textContent = `${mode.mode} ${percentage.toFixed(0)}%`;
                                                                    tooltip.style.opacity = 1;
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    const tooltip = e.target.closest('.pie-chart-wrapper').querySelector('.pie-hover-tooltip');
                                                                    tooltip.style.opacity = 0;
                                                                }}
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </svg>
                                            <div className="pie-hover-tooltip"></div>
                                        </div>
                                        <div className="pie-chart-legend">
                                            {modeBreakdown.map((mode, idx) => {
                                                const total = modeBreakdown.reduce((sum, m) => sum + m.count, 0);
                                                const percentage = total > 0 ? (mode.count / total) * 100 : 0;
                                                const colors = ['#059669', '#d97706', '#6366f1', '#ec4899'];
                                                return (
                                                    <div key={idx} className="pie-legend-item">
                                                        <span className="pie-legend-color" style={{ background: colors[idx % colors.length] }}></span>
                                                        <span className="pie-legend-label">{mode.mode}</span>
                                                        <span className="pie-legend-value">{percentage.toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="info-empty">No payment data</div>
                                )}
                            </div>
                        </div>

                        <div className="earnings-card info-card">
                            <div className="info-card-header">
                                <i className="bi bi-heart"></i>
                                <h3>Pet Types</h3>
                            </div>
                            <div className="info-card-body">
                                {petTypes.length > 0 ? (
                                    <div className="pie-chart-container">
                                        <div className="pie-chart-wrapper">
                                            <svg viewBox="0 0 100 100" className="pie-chart-svg">
                                                {(() => {
                                                    const total = petTypes.reduce((sum, p) => sum + p.count, 0);
                                                    let cumulative = 0;
                                                    const colors = ['#D84A39', '#471915', '#f97316', '#eab308', '#84cc16'];
                                                    return petTypes.map((pet, idx) => {
                                                        const percentage = total > 0 ? (pet.count / total) * 100 : 0;
                                                        const startAngle = (cumulative / 100) * 360;
                                                        cumulative += percentage;
                                                        const endAngle = (cumulative / 100) * 360;
                                                        const largeArc = percentage > 50 ? 1 : 0;
                                                        const startRad = (startAngle - 90) * (Math.PI / 180);
                                                        const endRad = (endAngle - 90) * (Math.PI / 180);
                                                        const x1 = 50 + 40 * Math.cos(startRad);
                                                        const y1 = 50 + 40 * Math.sin(startRad);
                                                        const x2 = 50 + 40 * Math.cos(endRad);
                                                        const y2 = 50 + 40 * Math.sin(endRad);
                                                        const d = percentage === 100 
                                                            ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
                                                            : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                                        return (
                                                            <path 
                                                                key={idx}
                                                                d={d} 
                                                                fill={colors[idx % colors.length]} 
                                                                className="pie-slice"
                                                                onMouseEnter={(e) => {
                                                                    const tooltip = e.target.closest('.pie-chart-wrapper').querySelector('.pie-hover-tooltip');
                                                                    tooltip.textContent = `${pet.type} ${percentage.toFixed(0)}%`;
                                                                    tooltip.style.opacity = 1;
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    const tooltip = e.target.closest('.pie-chart-wrapper').querySelector('.pie-hover-tooltip');
                                                                    tooltip.style.opacity = 0;
                                                                }}
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </svg>
                                            <div className="pie-hover-tooltip"></div>
                                        </div>
                                        <div className="pie-chart-legend">
                                            {petTypes.map((pet, idx) => {
                                                const total = petTypes.reduce((sum, p) => sum + p.count, 0);
                                                const percentage = total > 0 ? (pet.count / total) * 100 : 0;
                                                const colors = ['#D84A39', '#471915', '#f97316', '#eab308', '#84cc16'];
                                                return (
                                                    <div key={idx} className="pie-legend-item">
                                                        <span className="pie-legend-color" style={{ background: colors[idx % colors.length] }}></span>
                                                        <span className="pie-legend-label">{pet.type}</span>
                                                        <span className="pie-legend-value">{percentage.toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="info-empty">No pet data</div>
                                )}
                            </div>
                        </div>

                        <div className="earnings-card info-card">
                            <div className="info-card-header">
                                <i className="bi bi-door-open"></i>
                                <h3>Room Types</h3>
                            </div>
                            <div className="info-card-body">
                                {roomTypes.length > 0 ? (
                                    <div className="pie-chart-container">
                                        <div className="pie-chart-wrapper">
                                            <svg viewBox="0 0 100 100" className="pie-chart-svg">
                                                {(() => {
                                                    const total = roomTypes.reduce((sum, r) => sum + r.booking_count, 0);
                                                    let cumulative = 0;
                                                    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
                                                    return roomTypes.map((room, idx) => {
                                                        const percentage = total > 0 ? (room.booking_count / total) * 100 : 0;
                                                        const startAngle = (cumulative / 100) * 360;
                                                        cumulative += percentage;
                                                        const endAngle = (cumulative / 100) * 360;
                                                        const largeArc = percentage > 50 ? 1 : 0;
                                                        const startRad = (startAngle - 90) * (Math.PI / 180);
                                                        const endRad = (endAngle - 90) * (Math.PI / 180);
                                                        const x1 = 50 + 40 * Math.cos(startRad);
                                                        const y1 = 50 + 40 * Math.sin(startRad);
                                                        const x2 = 50 + 40 * Math.cos(endRad);
                                                        const y2 = 50 + 40 * Math.sin(endRad);
                                                        const d = percentage === 100 
                                                            ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
                                                            : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                                        return (
                                                            <path 
                                                                key={idx}
                                                                d={d} 
                                                                fill={colors[idx % colors.length]} 
                                                                className="pie-slice"
                                                                onMouseEnter={(e) => {
                                                                    const tooltip = e.target.closest('.pie-chart-wrapper').querySelector('.pie-hover-tooltip');
                                                                    tooltip.textContent = `${room.room_type} ${percentage.toFixed(0)}%`;
                                                                    tooltip.style.opacity = 1;
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    const tooltip = e.target.closest('.pie-chart-wrapper').querySelector('.pie-hover-tooltip');
                                                                    tooltip.style.opacity = 0;
                                                                }}
                                                            />
                                                        );
                                                    });
                                                })()}
                                            </svg>
                                            <div className="pie-hover-tooltip"></div>
                                        </div>
                                        <div className="pie-chart-legend">
                                            {roomTypes.map((room, idx) => {
                                                const total = roomTypes.reduce((sum, r) => sum + r.booking_count, 0);
                                                const percentage = total > 0 ? (room.booking_count / total) * 100 : 0;
                                                const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
                                                return (
                                                    <div key={idx} className="pie-legend-item">
                                                        <span className="pie-legend-color" style={{ background: colors[idx % colors.length] }}></span>
                                                        <span className="pie-legend-label">{room.room_type}</span>
                                                        <span className="pie-legend-value">{percentage.toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="info-empty">No room data</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default EarningsDashboard;