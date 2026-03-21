import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";

const ManageCoupons = () => {
    const session_id = localStorage.getItem("session_id");

    const [coupons, setCoupons] = useState([]);
    const [kennels, setKennels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("active");
    const [togglingId, setTogglingId] = useState(null);

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [form, setForm] = useState({
        code: "", auto_generate: false, discount_type: "flat", discount_value: "",
        max_discount: "", min_booking_value: "", min_nights: "",
        usage_limit: "", per_user_limit: "1", valid_from: "", valid_until: "",
        is_public: true, scope: "platform", kennel_ids: []
    });

    useEffect(() => { fetchCoupons(); fetchKennels(); }, []);

    useEffect(() => {
        if (successMsg || errorMsg) {
            const timer = setTimeout(() => { setSuccessMsg(""); setErrorMsg(""); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [successMsg, errorMsg]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await callServicesApi({ action: "GET_COUPONS", session_id });
            if (res?.success) setCoupons(res.coupons || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchKennels = async () => {
        try {
            const res = await callServicesApi({ action: "GET_KENNELS", session_id });
            if (res?.success) setKennels(res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async () => {
        if (!form.discount_value || parseFloat(form.discount_value) <= 0) { setErrorMsg("Please enter a discount value."); return; }
        if (!form.valid_from || !form.valid_until) { setErrorMsg("Please select valid dates."); return; }
        if (!form.auto_generate && !form.code.trim()) { setErrorMsg("Please enter a coupon code or use auto-generate."); return; }
        if (form.scope === "kennel" && form.kennel_ids.length === 0) { setErrorMsg("Please select at least one kennel."); return; }
        setSubmitting(true);
        try {
            const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
            const res = await callServicesApi({
                action: "CREATE_COUPON", session_id,
                code: form.code.trim().toUpperCase(),
                auto_generate: form.auto_generate,
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value),
                max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
                min_booking_value: form.min_booking_value ? parseFloat(form.min_booking_value) : null,
                min_nights: form.min_nights ? parseInt(form.min_nights) : null,
                usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
                per_user_limit: form.per_user_limit === "0" ? null : 1,
                valid_from: form.valid_from, valid_until: form.valid_until,
                is_public: form.is_public ? 1 : 0,
                scope: form.scope,
                kennel_ids: form.scope === "kennel" ? form.kennel_ids.map(Number) : [],
                created_by: userData.id
            });
            if (res?.success) {
                setSuccessMsg(`Coupon "${res.code}" created!`);
                setShowCreate(false);
                setForm({ code: "", auto_generate: false, discount_type: "flat", discount_value: "", max_discount: "", min_booking_value: "", min_nights: "", usage_limit: "", per_user_limit: "1", valid_from: "", valid_until: "", is_public: true, scope: "platform", kennel_ids: [] });
                setShowAdvanced(false);
                await fetchCoupons();
            } else { setErrorMsg(res?.message || "Failed to create coupon."); }
        } catch { setErrorMsg("Error creating coupon."); }
        finally { setSubmitting(false); }
    };

    const handleToggle = async (id) => {
        setTogglingId(id);
        try {
            const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
            const res = await callServicesApi({ action: "TOGGLE_COUPON", session_id, coupon_id: id, user_id: userData.id });
            if (res?.success) {
                setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: res.is_active } : c));
                setSuccessMsg(res.message);
            } else { setErrorMsg(res?.message || "Failed."); }
        } catch { setErrorMsg("Error toggling coupon."); }
        finally { setTogglingId(null); }
    };

    const handleKennelToggle = (kennelId) => {
        const id = String(kennelId);
        setForm(prev => ({
            ...prev,
            kennel_ids: prev.kennel_ids.includes(id)
                ? prev.kennel_ids.filter(k => k !== id)
                : [...prev.kennel_ids, id]
        }));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    const today = new Date().toISOString().split("T")[0];
    const filtered = coupons.filter(c => {
        if (filterStatus === "active" && (!c.is_active || c.valid_until < today)) return false;
        if (filterStatus === "expired" && c.is_active && c.valid_until >= today) return false;
        if (searchQuery.trim()) {
            const s = searchQuery.toLowerCase();
            return c.code?.toLowerCase().includes(s) || c.kennel_names?.toLowerCase().includes(s);
        }
        return true;
    });

    return (
        <div className="manage-users-page">
            <div className="manage-events-header">
                <h2>Manage Coupons</h2>
            </div>

            {successMsg && (
                <div className="manage-users-alert success">
                    <i className="bi bi-check-circle-fill"></i>{successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="manage-users-alert error">
                    <i className="bi bi-exclamation-circle-fill"></i>{errorMsg}
                </div>
            )}

            {/* Filters */}
            <div className="events-filters" style={{ marginBottom: "16px" }}>
                <div className="search-box">
                    <i className="bi bi-search"></i>
                    <input type="text" placeholder="Search by code or kennel..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "8px", padding: "3px" }}>
                    {["active", "expired", "all"].map(f => (
                        <button key={f} onClick={() => setFilterStatus(f)}
                            style={{ padding: "4px 14px", borderRadius: "6px", border: "none", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: filterStatus === f ? "white" : "transparent", color: filterStatus === f ? "#1e293b" : "#64748b", boxShadow: filterStatus === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none", textTransform: "capitalize" }}>
                            {f}
                        </button>
                    ))}
                </div>
                <button className="earnings-refresh-btn" onClick={fetchCoupons} disabled={loading} style={{ minWidth: "unset" }}>
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spinning' : ''}`}></i>
                </button>
                <button onClick={() => setShowCreate(!showCreate)}
                    style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className={`bi ${showCreate ? 'bi-x-lg' : 'bi-plus-lg'}`}></i>
                    {showCreate ? "Cancel" : "Create Coupon"}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 600, color: "#1e293b" }}>New Coupon</h4>

                    {/* Scope */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Applies To</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[{ key: "platform", label: "All Kennels (Platform-wide)", icon: "bi-globe" }, { key: "kennel", label: "Specific Kennels", icon: "bi-house-door" }].map(s => (
                                <button key={s.key} onClick={() => setForm(prev => ({ ...prev, scope: s.key, kennel_ids: [] }))}
                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", cursor: "pointer", border: form.scope === s.key ? "2px solid #1e293b" : "1px solid #e2e8f0", background: form.scope === s.key ? "#f8fafc" : "white", color: "#1e293b", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <i className={`bi ${s.icon}`}></i> {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kennel Picker */}
                    {form.scope === "kennel" && (
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>
                                Select Kennels ({form.kennel_ids.length} selected)
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "160px", overflowY: "auto", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                {kennels.map(k => {
                                    const isSelected = form.kennel_ids.includes(String(k.id));
                                    return (
                                        <button key={k.id} onClick={() => handleKennelToggle(k.id)}
                                            style={{ padding: "6px 14px", borderRadius: "20px", border: isSelected ? "1.5px solid #1e293b" : "1px solid #e2e8f0", background: isSelected ? "#1e293b" : "white", color: isSelected ? "white" : "#475569", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <i className={`bi ${isSelected ? "bi-check-circle-fill" : "bi-circle"}`} style={{ fontSize: "0.7rem" }}></i>
                                            {k.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Coupon Code */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Coupon Code</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input type="text" value={form.code}
                                onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase(), auto_generate: false }))}
                                placeholder={form.auto_generate ? "" : "e.g. SUMMER25"} disabled={form.auto_generate}
                                style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem", fontFamily: "monospace", letterSpacing: "1px", background: form.auto_generate ? "#f8fafc" : "white" }} />
                            <button onClick={() => {
                                if (form.auto_generate) {
                                    setForm(prev => ({ ...prev, auto_generate: false, code: "" }));
                                } else {
                                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                                    let code = "WNW";
                                    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                                    setForm(prev => ({ ...prev, auto_generate: true, code }));
                                }
                            }}
                                style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: form.auto_generate ? "#1e293b" : "white", color: form.auto_generate ? "white" : "#475569", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                <i className="bi bi-shuffle me-1"></i> Auto
                            </button>
                        </div>
                    </div>

                    {/* Discount Type */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Discount Type</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[{ key: "flat", label: "Flat Off", icon: "bi-currency-rupee" }, { key: "percentage", label: "Percentage Off", icon: "bi-percent" }].map(t => (
                                <button key={t.key} onClick={() => setForm(prev => ({ ...prev, discount_type: t.key, max_discount: "" }))}
                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", cursor: "pointer", border: form.discount_type === t.key ? "2px solid #1e293b" : "1px solid #e2e8f0", background: form.discount_type === t.key ? "#f8fafc" : "white", color: "#1e293b", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <i className={`bi ${t.icon}`}></i> {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Discount Value + Max */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>
                                {form.discount_type === "flat" ? "Discount Amount (₹)" : "Discount Percentage (%)"}
                            </label>
                            <input type="number" value={form.discount_value} onChange={(e) => setForm(prev => ({ ...prev, discount_value: e.target.value }))}
                                placeholder={form.discount_type === "flat" ? "e.g. 200" : "e.g. 10"} min="0" max={form.discount_type === "percentage" ? "100" : undefined}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                        </div>
                        {form.discount_type === "percentage" && (
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Max Discount (₹) <span style={{ color: "#94a3b8" }}>optional</span></label>
                                <input type="number" value={form.max_discount} onChange={(e) => setForm(prev => ({ ...prev, max_discount: e.target.value }))}
                                    placeholder="e.g. 500" min="0" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                            </div>
                        )}
                    </div>

                    {/* Valid Dates */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Valid From</label>
                            <input type="date" value={form.valid_from} onChange={(e) => setForm(prev => ({ ...prev, valid_from: e.target.value }))}
                                min={today} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Valid Until</label>
                            <input type="date" value={form.valid_until} onChange={(e) => setForm(prev => ({ ...prev, valid_until: e.target.value }))}
                                min={form.valid_from || today} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                        </div>
                    </div>

                    {/* Usage Per Customer */}
                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Usage Per Customer</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[{ key: "1", label: "One-time per customer" }, { key: "0", label: "Unlimited per customer" }].map(o => (
                                <button key={o.key} onClick={() => setForm(prev => ({ ...prev, per_user_limit: o.key }))}
                                    style={{ flex: 1, padding: "12px", borderRadius: "10px", cursor: "pointer", border: form.per_user_limit === o.key ? "2px solid #1e293b" : "1px solid #e2e8f0", background: form.per_user_limit === o.key ? "#f8fafc" : "white", color: "#1e293b", fontSize: "0.85rem", fontWeight: 600 }}>
                                    {o.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Show Publicly */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                        <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1e293b" }}>Show on booking page</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Customers will see this coupon when browsing kennels</div>
                        </div>
                        <div onClick={() => setForm(prev => ({ ...prev, is_public: !prev.is_public }))}
                            style={{ width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer", background: form.is_public ? "#1e293b" : "#cbd5e1", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", position: "absolute", top: "2px", left: form.is_public ? "22px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}></div>
                        </div>
                    </div>

                    {/* Advanced */}
                    <button onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: showAdvanced ? "16px" : "20px" }}>
                        <i className={`bi bi-chevron-${showAdvanced ? "up" : "down"}`}></i>
                        {showAdvanced ? "Hide" : "Show"} Advanced Options
                    </button>

                    {showAdvanced && (
                        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Min. Booking Amount (₹) <span style={{ color: "#94a3b8" }}>optional</span></label>
                                <input type="number" value={form.min_booking_value} onChange={(e) => setForm(prev => ({ ...prev, min_booking_value: e.target.value }))}
                                    placeholder="e.g. 2000" min="0" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Min. Nights <span style={{ color: "#94a3b8" }}>optional</span></label>
                                <input type="number" value={form.min_nights} onChange={(e) => setForm(prev => ({ ...prev, min_nights: e.target.value }))}
                                    placeholder="e.g. 3" min="1" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "0.82rem", color: "#64748b", marginBottom: "6px" }}>Total Usage Limit <span style={{ color: "#94a3b8" }}>optional</span></label>
                                <input type="number" value={form.usage_limit} onChange={(e) => setForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                                    placeholder="Unlimited" min="1" style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.88rem" }} />
                            </div>
                        </div>
                    )}

                    <button onClick={handleCreate} disabled={submitting}
                        style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: submitting ? "#cbd5e1" : "linear-gradient(135deg, #1e293b, #0f172a)", color: submitting ? "#94a3b8" : "white", fontSize: "0.9rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        {submitting ? (<><span className="spinner-border spinner-border-sm"></span> Creating...</>) : (<><i className="bi bi-plus-lg"></i> Create Coupon</>)}
                    </button>
                </div>
            )}

            {/* Coupons List */}
            {loading ? (
                <div className="loading-spinner"><div className="spinner-border" role="status"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <i className="bi bi-ticket-perforated"></i>
                    <p>No {filterStatus !== "all" ? filterStatus : ""} coupons found</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map(c => {
                        const isExpired = c.valid_until < today;
                        const isExhausted = c.usage_limit !== null && c.times_used >= c.usage_limit;
                        const isInactive = !c.is_active;
                        const statusColor = isExpired ? "#dc2626" : isExhausted ? "#d97706" : isInactive ? "#64748b" : "#059669";
                        const statusBg = isExpired ? "#fef2f2" : isExhausted ? "#fffbeb" : isInactive ? "#f1f5f9" : "#ecfdf5";
                        const statusText = isExpired ? "Expired" : isExhausted ? "Limit Reached" : isInactive ? "Disabled" : "Active";

                        return (
                            <div key={c.id} style={{ background: "white", borderRadius: "12px", padding: "18px 20px", border: "1px solid #e2e8f0", opacity: (isExpired || isInactive) ? 0.7 : 1 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                            <span style={{ fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 700, color: "#1e293b", letterSpacing: "1px" }}>{c.code}</span>
                                            <span style={{ padding: "2px 10px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600, background: statusBg, color: statusColor }}>{statusText}</span>
                                            {c.is_public ? <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.68rem", fontWeight: 600, background: "#dbeafe", color: "#2563eb" }}>Public</span> : null}
                                            <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.68rem", fontWeight: 600, background: c.scope === "platform" ? "#f0fdf4" : "#f8fafc", color: c.scope === "platform" ? "#059669" : "#64748b" }}>
                                                {c.scope === "platform" ? "Platform-wide" : "Kennel-specific"}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                                            {c.discount_type === "flat" ? `₹${c.discount_value} off` : `${c.discount_value}% off`}
                                            {c.discount_type === "percentage" && c.max_discount && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#64748b" }}> (max ₹{c.max_discount})</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <button onClick={() => { navigator.clipboard.writeText(c.code); setSuccessMsg("Code copied!"); }}
                                            style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", color: "#475569", fontSize: "0.75rem", cursor: "pointer" }}>
                                            <i className="bi bi-clipboard"></i>
                                        </button>
                                        {!isExpired && (
                                            <button onClick={() => handleToggle(c.id)} disabled={togglingId === c.id}
                                                style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: c.is_active ? "#fef2f2" : "#ecfdf5", color: c.is_active ? "#dc2626" : "#059669", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                                                {togglingId === c.id ? <span className="spinner-border spinner-border-sm"></span> : c.is_active ? "Disable" : "Enable"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem", color: "#64748b" }}>
                                    <span><i className="bi bi-calendar me-1"></i>{formatDate(c.valid_from)} → {formatDate(c.valid_until)}</span>
                                    <span><i className="bi bi-people me-1"></i>{c.times_used}{c.usage_limit ? `/${c.usage_limit}` : ""} used</span>
                                    {c.per_user_limit && <span><i className="bi bi-person me-1"></i>{c.per_user_limit}x per user</span>}
                                    {c.min_booking_value && <span><i className="bi bi-cart me-1"></i>Min ₹{c.min_booking_value}</span>}
                                    {c.min_nights && <span><i className="bi bi-moon me-1"></i>Min {c.min_nights} night{c.min_nights > 1 ? "s" : ""}</span>}
                                    {c.scope === "kennel" && c.kennel_names && <span><i className="bi bi-house-door me-1"></i>{c.kennel_names}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ManageCoupons;