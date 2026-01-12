import React, { useState } from 'react';
import { callServicesApi } from '../js/servicesApi';
import { getTokenFromApi } from '../js/getToken';
import { getVerificationEmailHtml } from '../js/verificationEmail';

export default function ChangePasswordModal({ user, onClose }) {
    const [mode, setMode] = useState('change'); // 'change' or 'forgot'
    const [step, setStep] = useState(1); // 1: email/verify, 2: code, 3: new password
    
    // Change password states
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Forgot password states
    const [generatedCode, setGeneratedCode] = useState("");
    const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
    const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
    
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);

    const generateCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const startResendTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const sendVerificationEmail = async (code) => {
        const htmlContent = getVerificationEmailHtml(user.first_name, code);
        
        const payload = {
            action: "SEND_EMAIL",
            email: user.email,
            subject: "Verify Your Identity - Wag N Wonder",
            html: htmlContent
        };

        try {
            const token = await getTokenFromApi(payload);
            if (!token) return false;

            const response = await callServicesApi({ ...payload, token });
            return response?.success;
        } catch (err) {
            console.error("Failed to send email:", err);
            return false;
        }
    };

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

    const handleForgotPassword = async () => {
        setError("");
        setSendingCode(true);

        const code = generateCode();
        setGeneratedCode(code);

        const emailSent = await sendVerificationEmail(code);

        if (emailSent) {
            setMode('forgot');
            setStep(2);
            startResendTimer();
        } else {
            setError("Failed to send verification email. Please try again.");
        }

        setSendingCode(false);
    };

    const handleCodeInput = (index, value) => {
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            const newInputs = [...codeInputs];
            pastedCode.forEach((char, i) => {
                if (i < 6) newInputs[i] = char;
            });
            setCodeInputs(newInputs);
            const nextIndex = Math.min(pastedCode.length, 5);
            document.getElementById(`modal-code-input-${nextIndex}`)?.focus();
            return;
        }

        const newInputs = [...codeInputs];
        newInputs[index] = value;
        setCodeInputs(newInputs);

        if (value && index < 5) {
            document.getElementById(`modal-code-input-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
            document.getElementById(`modal-code-input-${index - 1}`)?.focus();
        }
    };

    const handleVerifyCode = () => {
        setError("");
        const enteredCode = codeInputs.join("");
        
        if (enteredCode !== generatedCode) {
            setError("Invalid verification code. Please try again.");
            return;
        }

        setStep(3);
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;

        setSubmitting(true);
        const code = generateCode();
        setGeneratedCode(code);

        const emailSent = await sendVerificationEmail(code);

        if (emailSent) {
            startResendTimer();
            setCodeInputs(["", "", "", "", "", ""]);
            setError("");
        } else {
            setError("Failed to resend code. Please try again.");
        }
        setSubmitting(false);
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const payload = {
                action: "CHANGE_PASSWORD",
                user_id: user.id,
                forgot_redirect: true,
                current_password: "",
                new_password: newPassword
            };

            const token = await getTokenFromApi(payload);
            const response = await callServicesApi({ ...payload, token });

            if (response?.success) {
                setSuccess("Password reset successfully!");
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setError(response?.message || "Failed to reset password.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Something went wrong. Please try again.");
        }

        setSubmitting(false);
    };

    const handleBackToChange = () => {
        setMode('change');
        setStep(1);
        setError("");
        setCodeInputs(["", "", "", "", "", ""]);
        setNewPassword("");
        setConfirmPassword("");
    };

    const passwordsMatch = newPassword === confirmPassword;
    const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

    // Forgot Password - Step 2: Verify Code
    if (mode === 'forgot' && step === 2) {
        return (
            <div className="add-pet-modal-overlay" onClick={onClose}>
                <div className="add-pet-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-pet-modal-header">
                        <div className="add-pet-modal-title">
                            <i className="bi bi-envelope-check"></i>
                            <h3>Verify Email</h3>
                        </div>
                        <button className="add-pet-modal-close" onClick={onClose}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>

                    <div className="change-password-verify-content">
                        <p className="verify-description">
                            We've sent a 6-digit code to<br /><strong>{user.email}</strong>
                        </p>

                        {error && (
                            <div className="add-pet-modal-error" style={{ margin: '0 0 16px 0' }}>
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <div className="change-password-code-inputs">
                            {codeInputs.map((value, index) => (
                                <input
                                    key={index}
                                    id={`modal-code-input-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="change-password-code-input"
                                    value={value}
                                    onChange={(e) => handleCodeInput(index, e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            className="add-pet-submit-btn"
                            onClick={handleVerifyCode}
                            disabled={codeInputs.join("").length !== 6}
                            style={{ width: '100%', marginBottom: '16px' }}
                        >
                            Verify Code
                        </button>

                        <div className="change-password-resend">
                            <span>Didn't receive the code?</span>
                            <button
                                onClick={handleResendCode}
                                disabled={resendTimer > 0 || submitting}
                            >
                                {submitting ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                            </button>
                        </div>

                        <button className="change-password-back-btn" onClick={handleBackToChange}>
                            <i className="bi bi-arrow-left"></i>
                            Back to Change Password
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Forgot Password - Step 3: Set New Password
    if (mode === 'forgot' && step === 3) {
        return (
            <div className="add-pet-modal-overlay" onClick={onClose}>
                <div className="add-pet-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="add-pet-modal-header">
                        <div className="add-pet-modal-title">
                            <i className="bi bi-lock-fill"></i>
                            <h3>Set New Password</h3>
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

                    <form onSubmit={handleForgotPasswordSubmit} className="add-pet-modal-form">
                        <div className="change-password-fields">
                            <div className="add-pet-field">
                                <label>New Password *</label>
                                <div className="change-password-input-wrapper">
                                    <input
                                        type={showForgotNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <i
                                        className={`bi ${showForgotNewPassword ? "bi-eye-slash" : "bi-eye"}`}
                                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                                    ></i>
                                </div>
                                <span className="field-hint">Minimum 6 characters</span>
                            </div>

                            <div className="add-pet-field">
                                <label>Confirm New Password *</label>
                                <div className={`change-password-input-wrapper ${showMismatchError ? 'input-error' : ''} ${confirmPassword.length > 0 && passwordsMatch ? 'input-success' : ''}`}>
                                    <input
                                        type={showForgotConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <i
                                        className={`bi ${showForgotConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                                    ></i>
                                </div>
                                {showMismatchError && (
                                    <span className="field-hint error">Passwords do not match</span>
                                )}
                                {confirmPassword.length > 0 && passwordsMatch && (
                                    <span className="field-hint success">Passwords match</span>
                                )}
                            </div>
                        </div>

                        <div className="add-pet-modal-actions">
                            <button type="submit" className="add-pet-submit-btn" disabled={submitting}>
                                {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                                {submitting ? 'Resetting...' : 'Reset Password'}
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

    // Default: Change Password Form
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

                        <div className="change-password-forgot-link">
                            <a href="#" onClick={(e) => { e.preventDefault(); if (!sendingCode) handleForgotPassword(); }}>
                                {sendingCode ? 'Sending code...' : 'Forgot Password?'}
                            </a>
                        </div>
                    </div>

                    <div className="add-pet-modal-actions">
                        <button type="submit" className="add-pet-submit-btn" disabled={submitting || sendingCode}>
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