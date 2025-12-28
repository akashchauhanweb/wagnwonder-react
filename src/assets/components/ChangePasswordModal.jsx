import React, { useState } from 'react';
import { callServicesApi } from '../js/servicesApi';

export default function ChangePasswordModal({ user, onClose }) {
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setError("");
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!passwordData.current_password) {
            setError("Current password is required.");
            return;
        }

        if (passwordData.new_password.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                action: "CHANGE_PASSWORD",
                session_id: localStorage.getItem("session_id"),
                user_id: user.id,
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            };

            const response = await callServicesApi(payload);

            if (response?.success) {
                setSuccess("Password changed successfully!");
                setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError(response?.message || "Failed to change password.");
            }
        } catch (err) {
            console.log(err);
            setError("Something went wrong. Please try again.");
        }

        setSubmitting(false);
    };

    return (
        <div className="add-pet-modal-overlay" onClick={onClose}>
            <div className="add-pet-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-pet-modal-header">
                    <div className="add-pet-modal-title">
                        <i className="bi bi-shield-lock-fill"></i>
                        <h3>Change Password</h3>
                    </div>
                    <button className="add-pet-modal-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {error && (
                    <div className="add-pet-modal-error">
                        <i className="bi bi-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="change-password-success">
                        <i className="bi bi-check-circle"></i>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="add-pet-modal-form">
                    <div className="change-password-fields">
                        <div className="add-pet-field">
                            <label>Current Password *</label>
                            <div className="change-password-input-wrapper">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    name="current_password"
                                    value={passwordData.current_password}
                                    onChange={handleChange}
                                    placeholder="Enter current password"
                                    required
                                />
                                <i
                                    className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                ></i>
                            </div>
                        </div>

                        <div className="add-pet-field">
                            <label>New Password *</label>
                            <div className="change-password-input-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="new_password"
                                    value={passwordData.new_password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    required
                                />
                                <i
                                    className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                ></i>
                            </div>
                            <span className="field-hint">Minimum 6 characters</span>
                        </div>

                        <div className="add-pet-field">
                            <label>Confirm New Password *</label>
                            <div className="change-password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirm_password"
                                    value={passwordData.confirm_password}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    required
                                />
                                <i
                                    className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                ></i>
                            </div>
                        </div>
                    </div>

                    <div className="add-pet-modal-actions">
                        <button type="submit" className="add-pet-submit-btn" disabled={submitting}>
                            {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                            {submitting ? 'Updating...' : 'Update Password'}
                        </button>
                        <button type="button" className="add-pet-cancel-btn" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}