import React, { useState } from "react";
import { callServicesApi } from "../js/servicesApi";
import { getVerificationEmailHtml } from "../js/verificationEmail";
import { getWelcomeUserEmailHtml } from "../js/welcomeUserEmail";

const AddUserModal = ({ onClose, onUserCreated, session_id }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [form, setForm] = useState({ first_name: "", last_name: "", phone_number: "", password: "" });
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [generatedOtp, setGeneratedOtp] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

    const handleSendOtp = async () => {
        if (!email.trim()) { setError("Please enter an email."); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { setError("Please enter a valid email."); return; }

        setSendingOtp(true);
        setError("");

        const checkRes = await callServicesApi({
            action: "CHECK_EMAIL_EXISTS",
            session_id,
            email
        });
        if (checkRes?.success) {
            setError("This email is already registered. Please select the user from the dropdown.");
            setSendingOtp(false);
            return;
        }

        const code = generateOtp();
        setGeneratedOtp(code);

        const emailHtml = getVerificationEmailHtml(email.split("@")[0], code);
        const emailRes = await callServicesApi({
            action: "SEND_EMAIL",
            session_id,
            email,
            subject: "Verify Your Email - Wag N Wonder",
            html: emailHtml
        });

        if (emailRes?.success) {
            setStep(2);
        } else {
            setError("Failed to send verification email. Please try again.");
        }
        setSendingOtp(false);
    };

    const handleOtpInput = (index, value) => {
        if (value.length > 1) return;
        const updated = [...otp];
        updated[index] = value;
        setOtp(updated);
        if (value && index < 5) {
            document.getElementById(`add-user-modal-otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            document.getElementById(`add-user-modal-otp-${index - 1}`)?.focus();
        }
    };

    const handleSubmit = async () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
        if (enteredOtp !== generatedOtp) { setError("Invalid verification code."); return; }
        if (!form.first_name || !form.last_name || !form.phone_number || !form.password) {
            setError("Please fill in all fields."); return;
        }
        if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }

        setSubmitting(true);
        setError("");

        const res = await callServicesApi({
            action: "ADD_USER",
            session_id,
            first_name: form.first_name,
            last_name: form.last_name,
            phone_number: form.phone_number,
            email,
            user_type: "client",
            password_hashed: form.password
        });

        if (res?.success) {
            // Send welcome email
            try {
                await callServicesApi({
                    action: "SEND_EMAIL",
                    session_id,
                    email,
                    subject: "Welcome to Wag N Wonder - Your Account Details",
                    html: getWelcomeUserEmailHtml({
                        firstName: form.first_name,
                        lastName: form.last_name,
                        email: email,
                        phoneNumber: form.phone_number,
                        password: form.password
                    })
                });
            } catch (err) {
                console.error("Failed to send welcome email:", err);
            }
            onUserCreated(res.user_id);
        } else {
            setError(res?.message || "Failed to create user.");
        }
        setSubmitting(false);
    };

    return (
        <div className="event-modal-overlay" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
                <div className="event-modal-header">
                    <h3>{step === 1 ? "Add New User" : "Complete Registration"}</h3>
                    <button onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="event-modal-body">
                    {error && (
                        <div style={{
                            padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
                            background: "#fef2f2", border: "1px solid #fecaca",
                            color: "#dc2626", fontSize: "0.85rem"
                        }}>
                            <i className="bi bi-exclamation-circle me-2"></i>{error}
                        </div>
                    )}

                    {step === 1 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Email Address *</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                    placeholder="Enter email address"
                                    className="manual-entry-select"
                                    autoFocus
                                />
                            </div>
                            <button
                                className="manual-entry-submit"
                                onClick={handleSendOtp}
                                disabled={sendingOtp || !email.trim()}
                            >
                                {sendingOtp ? (
                                    <><span className="spinner-border spinner-border-sm"></span> Sending OTP...</>
                                ) : (
                                    <><i className="bi bi-envelope"></i> Send Verification Code</>
                                )}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{
                                padding: "10px 14px", borderRadius: "8px",
                                background: "#f0fdf4", border: "1px solid #bbf7d0",
                                color: "#16a34a", fontSize: "0.85rem"
                            }}>
                                <i className="bi bi-check-circle me-2"></i>
                                Verification code sent to <strong>{email}</strong>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>First Name *</label>
                                    <input
                                        type="text"
                                        value={form.first_name}
                                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                        placeholder="First name"
                                        className="manual-entry-select"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Last Name *</label>
                                    <input
                                        type="text"
                                        value={form.last_name}
                                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                        placeholder="Last name"
                                        className="manual-entry-select"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Phone Number *</label>
                                <input
                                    type="tel"
                                    value={form.phone_number}
                                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                    placeholder="10-digit phone number"
                                    className="manual-entry-select"
                                    maxLength={10}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Password *</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="Min 6 characters"
                                    className="manual-entry-select"
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", marginBottom: "6px" }}>Verification Code *</label>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`add-user-modal-otp-${idx}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpInput(idx, e.target.value.replace(/\D/g, ""))}
                                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                            style={{
                                                width: "44px", height: "48px", textAlign: "center",
                                                fontSize: "1.2rem", fontWeight: 700, borderRadius: "10px",
                                                border: "2px solid #e2e8f0", outline: "none",
                                                transition: "border-color 0.2s",
                                                borderColor: digit ? "#1e293b" : "#e2e8f0"
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = "#1e293b"}
                                            onBlur={(e) => e.target.style.borderColor = digit ? "#1e293b" : "#e2e8f0"}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                className="manual-entry-submit"
                                onClick={handleSubmit}
                                disabled={submitting || otp.join("").length !== 6}
                            >
                                {submitting ? (
                                    <><span className="spinner-border spinner-border-sm"></span> Creating User...</>
                                ) : (
                                    <><i className="bi bi-person-plus"></i> Verify & Create User</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddUserModal;