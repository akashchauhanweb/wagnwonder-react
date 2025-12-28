import { updateUser } from "../assets/js/updateUser";
import { useLoading } from "../contexts/LoadingContext";
import { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { getTokenFromApi } from "../assets/js/getToken";
import { getVerificationEmailHtml } from "../assets/js/verificationEmail";

function AccountInfo() {
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const { setLoading } = useLoading();
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: ""
    });
    const [originalEmail, setOriginalEmail] = useState("");

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    // Email verification states
    const [generatedCode, setGeneratedCode] = useState("");
    const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("user_data");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setOriginalEmail(parsed.email || "");
            setFormData({
                first_name: parsed.first_name || "",
                last_name: parsed.last_name || "",
                email: parsed.email || "",
                phone_number: parsed.phone_number || ""
            });
        }
    }, []);

    const handleEdit = () => {
        setFormData({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            phone_number: user.phone_number || "",
        });
        setOriginalEmail(user.email || "");
        setEditMode(true);
        setError("");
    };

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
        const htmlContent = getVerificationEmailHtml(formData.first_name, code);
        
        const payload = {
            action: "SEND_VERIFICATION_EMAIL",
            email: formData.email,
            code: code,
            name: formData.first_name,
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

    const handleSave = async () => {
        setError("");
        
        // Check if email changed
        if (formData.email !== originalEmail) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError("Please enter a valid email address.");
                return;
            }

            // Send verification code
            setIsSending(true);
            const code = generateCode();
            setGeneratedCode(code);

            const emailSent = await sendVerificationEmail(code);
            setIsSending(false);

            if (emailSent) {
                setVerifyingEmail(true);
                startResendTimer();
            } else {
                setError("Failed to send verification email. Please try again.");
            }
            return;
        }

        // No email change, save directly
        await saveUserData();
    };

    const saveUserData = async () => {
        setLoading(true);
        const updatedUser = { ...user, ...formData };
        const result = await updateUser(updatedUser);
        
        if (result === true) {
            setUser(updatedUser);
            localStorage.setItem("user_data", JSON.stringify(updatedUser));
            setEditMode(false);
            setVerifyingEmail(false);
            setError("");
        } else if (result && result.duplicate) {
            setError(`${formData.email} is registered with a different account.`);
            setVerifyingEmail(false);
            setCodeInputs(["", "", "", "", "", ""]);
        } else {
            setError("Unable to update. Please try again.");
        }
        setLoading(false);
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
            document.getElementById(`code-input-${nextIndex}`)?.focus();
            return;
        }

        const newInputs = [...codeInputs];
        newInputs[index] = value;
        setCodeInputs(newInputs);

        if (value && index < 5) {
            document.getElementById(`code-input-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
            document.getElementById(`code-input-${index - 1}`)?.focus();
        }
    };

    const handleVerifyCode = async () => {
        const enteredCode = codeInputs.join("");
        if (enteredCode !== generatedCode) {
            setError("Invalid verification code. Please try again.");
            return;
        }

        await saveUserData();
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;

        setIsSending(true);
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
        setIsSending(false);
    };

    const handleCancelVerification = () => {
        setVerifyingEmail(false);
        setCodeInputs(["", "", "", "", "", ""]);
        setError("");
        setFormData({ ...formData, email: originalEmail });
    };

    if (!user) return null;

    // Email Verification Step
    if (verifyingEmail) {
        return (
            <div className="account-info">
                <div className="account-info-verify">
                    <div className="verify-icon">
                        <i className="bi bi-envelope-check"></i>
                    </div>
                    <h2>Verify Your New Email</h2>
                    <p>We've sent a 6-digit code to<br /><strong>{formData.email}</strong></p>

                    {error && (
                        <div className="account-info-error">
                            <i className="bi bi-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    <div className="verify-code-inputs">
                        {codeInputs.map((value, index) => (
                            <input
                                key={index}
                                id={`code-input-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className="code-input"
                                value={value}
                                onChange={(e) => handleCodeInput(index, e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <button 
                        className="account-info-save-btn"
                        onClick={handleVerifyCode}
                        disabled={codeInputs.join("").length !== 6}
                    >
                        Verify & Save
                    </button>

                    <div className="verify-resend">
                        <span>Didn't receive the code?</span>
                        <button 
                            onClick={handleResendCode}
                            disabled={resendTimer > 0 || isSending}
                        >
                            {isSending ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                    </div>

                    <button className="account-info-back-btn" onClick={handleCancelVerification}>
                        <i className="bi bi-arrow-left"></i>
                        Back to editing
                    </button>
                </div>
            </div>
        );
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (!passwordData.current_password) {
            setPasswordError("Current password is required.");
            return;
        }

        if (passwordData.new_password.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setSavingPassword(true);

        try {
            const payload = {
                action: "CHANGE_PASSWORD",
                session_id: localStorage.getItem("session_id"),
                user_id: user.id,
                forgot_redirect: false,
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            };

            const response = await callServicesApi(payload);

            if (response?.success) {
                setPasswordSuccess("Password changed successfully!");
                setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                setTimeout(() => {
                    setShowPasswordForm(false);
                    setPasswordSuccess("");
                }, 2000);
            } else {
                setPasswordError(response?.message || "Failed to change password.");
            }
        } catch (err) {
            console.log(err);
            setPasswordError("Something went wrong. Please try again.");
        }

        setSavingPassword(false);
    };

    return (
        <div className="account-info">
            <div className="account-info-header">
                <h2>Personal Information</h2>
                {!editMode && (
                    <button className="account-info-edit-btn" onClick={handleEdit}>
                        <i className="bi bi-pencil"></i>
                        Edit
                    </button>
                )}
            </div>

            {error && (
                <div className="account-info-error">
                    <i className="bi bi-exclamation-circle"></i>
                    {error}
                </div>
            )}

            {editMode ? (
                <div className="account-info-form">
                    <div className="account-info-row">
                        <div className="account-info-field">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="account-info-field">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="account-info-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {formData.email !== originalEmail && (
                            <span className="field-hint">Email change requires verification</span>
                        )}
                    </div>

                    <div className="account-info-field">
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>

                    <div className="account-info-actions">
                        <button className="account-info-save-btn" onClick={handleSave} disabled={isSending}>
                            {isSending ? "Sending Code..." : "Save Changes"}
                        </button>
                        <button className="account-info-cancel-btn" onClick={() => { setEditMode(false); setError(""); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="account-info-display">
                    <div className="account-info-item">
                        <div className="account-info-icon">
                            <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="account-info-detail">
                            <span className="label">Full Name</span>
                            <span className="value">{user.first_name} {user.last_name}</span>
                        </div>
                    </div>

                    <div className="account-info-item">
                        <div className="account-info-icon">
                            <i className="bi bi-envelope-fill"></i>
                        </div>
                        <div className="account-info-detail">
                            <span className="label">Email Address</span>
                            <span className="value">
                                {user.email}
                                <span className="verified-badge">
                                    <i className="bi bi-patch-check-fill"></i>
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="account-info-item">
                        <div className="account-info-icon">
                            <i className="bi bi-phone-fill"></i>
                        </div>
                        <div className="account-info-detail">
                            <span className="label">Phone Number</span>
                            <span className="value">{user.phone_number || "Not provided"}</span>
                        </div>
                    </div>
                    {/* Change Password Section */}
                    <div className="account-password-section">
                        <div className="account-password-header" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                            <div className="account-password-title">
                                <i className="bi bi-shield-lock-fill"></i>
                                <span>Change Password</span>
                            </div>
                            <i className={`bi bi-chevron-${showPasswordForm ? 'up' : 'down'}`}></i>
                        </div>

                        {showPasswordForm && (
                            <form className="account-password-form" onSubmit={handlePasswordChange}>
                                {passwordError && (
                                    <div className="account-info-error">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="account-info-success">
                                        <i className="bi bi-check-circle"></i>
                                        {passwordSuccess}
                                    </div>
                                )}

                                <div className="account-info-field">
                                    <label>Current Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                        <i
                                            className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="account-info-field">
                                    <label>New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            placeholder="Enter new password"
                                        />
                                        <i
                                            className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="account-info-field">
                                    <label>Confirm New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            placeholder="Confirm new password"
                                        />
                                        <i
                                            className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="account-info-actions">
                                    <button type="submit" className="account-info-save-btn" disabled={savingPassword}>
                                        {savingPassword && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                                        {savingPassword ? "Saving..." : "Update Password"}
                                    </button>
                                    <button
                                        type="button"
                                        className="account-info-cancel-btn"
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                                            setPasswordError("");
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccountInfo;