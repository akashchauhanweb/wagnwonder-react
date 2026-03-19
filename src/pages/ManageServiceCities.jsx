import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import stateCityMap from "../assets/js/stateCityMap";

const ManageServiceCities = () => {
    const session_id = localStorage.getItem("session_id");
    const stateCityMapJson = stateCityMap();

    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Add form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newState, setNewState] = useState("");
    const [newCity, setNewCity] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const states = Object.keys(stateCityMapJson).sort();
    const citiesForState = newState ? Object.keys(stateCityMapJson[newState] || {}).sort() : [];

    useEffect(() => {
        fetchCities();
    }, []);

    useEffect(() => {
        if (successMsg || errorMsg) {
            const timer = setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, errorMsg]);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const response = await callServicesApi({
                action: "GET_SERVICE_CITIES",
                session_id
            });
            if (response?.success) {
                setCities(response.cities || []);
            }
        } catch (err) {
            console.error("Error fetching cities:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newState || !newCity) {
            setErrorMsg("Please select state and city.");
            return;
        }

        const coords = stateCityMapJson[newState]?.[newCity];
        if (!coords) {
            setErrorMsg("Could not find coordinates for this city.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await callServicesApi({
                action: "ADD_SERVICE_CITY",
                session_id,
                state: newState,
                city: newCity,
                latitude: coords.latitude,
                longitude: coords.longitude
            });
            if (response?.success) {
                setSuccessMsg(response.message);
                setNewState("");
                setNewCity("");
                setShowAddForm(false);
                // Clear cached city_data so HeroForm fetches fresh
                localStorage.removeItem("city_data");
                fetchCities();
            } else {
                setErrorMsg(response?.message || "Failed to add city.");
            }
        } catch { setErrorMsg("Error adding city."); }
        finally { setSubmitting(false); }
    };

    const handleToggle = async (cityId) => {
        try {
            const response = await callServicesApi({
                action: "TOGGLE_SERVICE_CITY",
                session_id,
                city_id: cityId,
                action_type: "toggle"
            });
            if (response?.success) {
                setSuccessMsg(response.message);
                localStorage.removeItem("city_data");
                fetchCities();
            } else {
                setErrorMsg(response?.message || "Failed to update city.");
            }
        } catch { setErrorMsg("Error updating city."); }
    };

    const handleDelete = async (cityId, cityName) => {
        if (!window.confirm(`Remove ${cityName} from service cities?`)) return;
        try {
            const response = await callServicesApi({
                action: "TOGGLE_SERVICE_CITY",
                session_id,
                city_id: cityId,
                action_type: "delete"
            });
            if (response?.success) {
                setSuccessMsg(response.message);
                localStorage.removeItem("city_data");
                fetchCities();
            } else {
                setErrorMsg(response?.message || "Failed to remove city.");
            }
        } catch { setErrorMsg("Error removing city."); }
    };

    // Group by state
    const grouped = {};
    cities.forEach(c => {
        if (!grouped[c.state]) grouped[c.state] = [];
        grouped[c.state].push(c);
    });

    const filteredStates = Object.keys(grouped).sort().filter(state => {
        if (!searchQuery.trim()) return true;
        const s = searchQuery.toLowerCase();
        return state.toLowerCase().includes(s) || grouped[state].some(c => c.city.toLowerCase().includes(s));
    });

    return (
        <div className="manage-events-page">
            <div className="manage-events-header">
                <h2>Service Cities</h2>
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

            <div className="events-filters">
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input
                        type="text"
                        placeholder="Search by state or city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    className="earnings-refresh-btn"
                    onClick={() => {
                        if (showAddForm) {
                            setShowAddForm(false);
                        } else {
                            setShowAddForm(true);
                        }
                    }}
                    style={{ marginLeft: "auto" }}
                >
                    <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
                    {showAddForm ? " Cancel" : " Add City"}
                </button>
                <button
                    className="earnings-refresh-btn"
                    onClick={fetchCities}
                    disabled={loading}
                    style={{ minWidth: "unset" }}
                >
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div style={{
                    background: "white", borderRadius: "12px", padding: "20px",
                    border: "1px solid #e2e8f0", marginBottom: "20px"
                }}>
                    <h4 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>Add Service City</h4>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>State</label>
                            <select
                                value={newState}
                                onChange={(e) => { setNewState(e.target.value); setNewCity(""); }}
                                className="manual-entry-select"
                            >
                                <option value="">Select state...</option>
                                {states.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>City</label>
                            <select
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                className="manual-entry-select"
                                disabled={!newState}
                            >
                                <option value="">Select city...</option>
                                {citiesForState.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="manual-entry-submit"
                            onClick={handleAdd}
                            disabled={submitting || !newState || !newCity}
                        >
                            {submitting ? (
                                <><span className="spinner-border spinner-border-sm"></span> Adding...</>
                            ) : (
                                <><i className="bi bi-plus-circle"></i> Add City</>
                            )}
                        </button>
                    </div>
                    {newState && newCity && stateCityMapJson[newState]?.[newCity] && (
                        <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#94a3b8" }}>
                            <i className="bi bi-geo-alt me-1"></i>
                            Coordinates: {stateCityMapJson[newState][newCity].latitude}, {stateCityMapJson[newState][newCity].longitude}
                        </div>
                    )}
                </div>
            )}

            {/* Cities List */}
            {loading ? (
                <div className="loading-spinner">
                    <div className="spinner-border" role="status"></div>
                </div>
            ) : filteredStates.length === 0 ? (
                <div className="empty-state">
                    <i className="bi bi-geo-alt"></i>
                    <p>{searchQuery ? "No cities match your search" : "No service cities added yet"}</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {filteredStates.map(state => (
                        <div key={state} style={{
                            background: "white", borderRadius: "12px",
                            border: "1px solid #e2e8f0", overflow: "hidden"
                        }}>
                            <div style={{
                                padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
                                display: "flex", alignItems: "center", gap: "10px"
                            }}>
                                <i className="bi bi-pin-map-fill" style={{ color: "#1e293b" }}></i>
                                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>{state}</h4>
                                <span style={{
                                    padding: "2px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                                    background: "#f1f5f9", color: "#64748b"
                                }}>
                                    {grouped[state].length} {grouped[state].length === 1 ? "city" : "cities"}
                                </span>
                            </div>
                            <div style={{ padding: "12px" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                                    {grouped[state].filter(c => {
                                        if (!searchQuery.trim()) return true;
                                        return c.city.toLowerCase().includes(searchQuery.toLowerCase());
                                    }).map(city => (
                                        <div key={city.id} style={{
                                            display: "flex", alignItems: "center", gap: "12px",
                                            padding: "12px 14px", borderRadius: "10px",
                                            border: city.is_active ? "1px solid #d1fae5" : "1px solid #e2e8f0",
                                            background: city.is_active ? "#f0fdf4" : "#f8fafc",
                                            opacity: city.is_active ? 1 : 0.6
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e293b" }}>
                                                    {city.city}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                                    {city.latitude}, {city.longitude}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                                <button
                                                    onClick={() => handleToggle(city.id)}
                                                    title={city.is_active ? "Deactivate" : "Activate"}
                                                    style={{
                                                        padding: "4px 10px", borderRadius: "6px",
                                                        border: city.is_active ? "1px solid #d1fae5" : "1px solid #fde68a",
                                                        background: city.is_active ? "#f0fdf4" : "#fffbeb",
                                                        color: city.is_active ? "#059669" : "#d97706",
                                                        fontSize: "0.78rem", cursor: "pointer", fontWeight: 600
                                                    }}
                                                >
                                                    <i className={`bi ${city.is_active ? 'bi-eye-fill' : 'bi-eye-slash'}`}></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(city.id, city.city)}
                                                    style={{
                                                        padding: "4px 10px", borderRadius: "6px",
                                                        border: "1px solid #fecaca", background: "#fef2f2",
                                                        color: "#dc2626", fontSize: "0.78rem", cursor: "pointer"
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageServiceCities;