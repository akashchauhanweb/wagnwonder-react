import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import { getTokenFromApi } from "../assets/js/getToken";
import { getVerificationEmailHtml } from "../assets/js/verificationEmail";

function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: email, 2: verify code, 3: new password
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Verification states
    const [generatedCode, setGeneratedCode] = useState("");
    const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);
    
    // New password states
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const sendVerificationEmail = async (code, name) => {
        const htmlContent = getVerificationEmailHtml(name, code);
        
        const payload = {
            action: "SEND_VERIFICATION_EMAIL",
            email: email,
            code: code,
            name: name,
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

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Check if email exists
            const payload = { action: "CHECK_EMAIL_EXISTS", email };
            const token = await getTokenFromApi(payload);
            const response = await callServicesApi({ ...payload, token });

            if (!response?.success) {
                setError(response?.message || "Email not found.");
                setIsSubmitting(false);
                return;
            }

            setUserId(response.user_id);
            setFirstName(response.first_name);

            // Send verification code
            const code = generateCode();
            setGeneratedCode(code);

            const emailSent = await sendVerificationEmail(code, response.first_name);

            if (emailSent) {
                setStep(2);
                startResendTimer();
            } else {
                setError("Failed to send verification email. Please try again.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
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

        setIsSubmitting(true);
        const code = generateCode();
        setGeneratedCode(code);

        const emailSent = await sendVerificationEmail(code, firstName);

        if (emailSent) {
            startResendTimer();
            setCodeInputs(["", "", "", "", "", ""]);
            setError("");
        } else {
            setError("Failed to resend code. Please try again.");
        }
        setIsSubmitting(false);
    };

    const handlePasswordSubmit = async (e) => {
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

        setIsSubmitting(true);

        try {
            const payload = {
                action: "CHANGE_PASSWORD",
                user_id: userId,
                forgot_redirect: true,
                current_password: "",
                new_password: newPassword
            };

            const token = await getTokenFromApi(payload);
            const response = await callServicesApi({ ...payload, token });

            if (response?.success) {
                navigate("/login", { state: { message: "Password reset successful. Please login with your new password." } });
            } else {
                setError(response?.message || "Failed to reset password.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Something went wrong. Please try again.");
        }

        setIsSubmitting(false);
    };

    const passwordsMatch = newPassword === confirmPassword;
    const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Side - Branding */}
                <div className="login-branding">
                    <div className="login-branding-content">
                        <h1>Reset Your<br />Password</h1>
                        <p>Don't worry, it happens to the best of us. We'll help you get back into your account.</p>
                        <div className="login-features">
                            <div className="login-feature">
                                <i className="bi bi-shield-check"></i>
                                <span>Secure Reset</span>
                            </div>
                            <div className="login-feature">
                                <i className="bi bi-envelope-check"></i>
                                <span>Email Verification</span>
                            </div>
                            <div className="login-feature">
                                <i className="bi bi-lock"></i>
                                <span>New Password</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Forms */}
                <div className="login-form-section">
                    {step === 1 && (
                        <div className="login-form-card">
                            <div className="login-form-header">
                                <h2>Forgot Password?</h2>
                                <p>Enter your email address and we'll send you a verification code.</p>
                            </div>

                            {error && (
                                <div className="login-error">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleEmailSubmit}>
                                <div className="login-input-group">
                                    <label className="login-label">Email Address</label>
                                    <div className="login-input-wrapper">
                                        <i className="bi bi-envelope"></i>
                                        <input
                                            type="text"
                                            className="login-input"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting && <span className="spinner-border spinner-border-sm" role="status" />}
                                    {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            </form>

                            <div className="login-divider"><span>or</span></div>

                            <p className="login-signup-text">
                                Remember your password? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="login-form-card verification-card">
                            <div className="verification-icon">
                                <i className="bi bi-envelope-check"></i>
                            </div>

                            <div className="login-form-header" style={{ textAlign: 'center' }}>
                                <h2>Check Your Email</h2>
                                <p>We've sent a 6-digit code to<br /><strong>{email}</strong></p>
                            </div>

                            {error && (
                                <div className="login-error">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}

                            <div className="verification-code-inputs">
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
                                className="login-submit-btn"
                                onClick={handleVerifyCode}
                                disabled={codeInputs.join("").length !== 6}
                            >
                                Verify Code
                            </button>

                            <div className="resend-section">
                                <p>Didn't receive the code?</p>
                                <button
                                    className="resend-btn"
                                    onClick={handleResendCode}
                                    disabled={resendTimer > 0 || isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                </button>
                            </div>

                            <button className="back-btn" onClick={() => setStep(1)}>
                                <i className="bi bi-arrow-left"></i>
                                Back
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="login-form-card">
                            <div className="login-form-header">
                                <h2>Set New Password</h2>
                                <p>Create a strong password for your account.</p>
                            </div>

                            {error && (
                                <div className="login-error">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="login-input-group">
                                    <label className="login-label">New Password</label>
                                    <div className="login-input-wrapper">
                                        <i className="bi bi-lock"></i>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="login-input"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                                        />
                                        <i
                                            className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} login-toggle-password`}
                                            onClick={() => setShowPassword(v => !v)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="login-input-group">
                                    <label className="login-label">Confirm Password</label>
                                    <div className={`login-input-wrapper ${showMismatchError ? 'input-error' : ''} ${confirmPassword.length > 0 && passwordsMatch ? 'input-success' : ''}`}>
                                        <i className="bi bi-lock-fill"></i>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="login-input"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                        />
                                        <i
                                            className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"} login-toggle-password`}
                                            onClick={() => setShowConfirmPassword(v => !v)}
                                        ></i>
                                    </div>
                                    {showMismatchError && (
                                        <span className="input-hint error">Passwords do not match</span>
                                    )}
                                    {confirmPassword.length > 0 && passwordsMatch && (
                                        <span className="input-hint success">Passwords match</span>
                                    )}
                                </div>

                                <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting && <span className="spinner-border spinner-border-sm" role="status" />}
                                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;