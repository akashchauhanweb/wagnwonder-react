import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { callServicesApi } from "../assets/js/servicesApi";
import { getVerificationEmailHtml } from "../assets/js/verificationEmail";

function Signup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: form, 2: verify code
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [generatedCode, setGeneratedCode] = useState("");
    const [codeInputs, setCodeInputs] = useState(["", "", "", "", "", ""]);
    const [resendTimer, setResendTimer] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError("");
    };

    const passwordsMatch = formData.password === formData.confirmPassword;
    const showMismatchError = formData.confirmPassword.length > 0 && !passwordsMatch;

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
        const htmlContent = getVerificationEmailHtml(formData.firstName, code);
        
        try {
            const response = await callServicesApi({
                action: "SEND_VERIFICATION_EMAIL",
                email: formData.email,
                code: code,
                name: formData.firstName,
                html: htmlContent
            });
            console.log(response);
            return response?.success;
        } catch (err) {
            console.error("Failed to send email:", err);
            return false;
        }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!formData.firstName || !formData.lastName || !formData.phoneNumber || !formData.email || !formData.password || !formData.confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (formData.phoneNumber.length < 10) {
            setError("Please enter a valid phone number.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (!passwordsMatch) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        const code = generateCode();
        setGeneratedCode(code);

        const emailSent = await sendVerificationEmail(code);

        if (emailSent) {
            setStep(2);
            startResendTimer();
        } else {
            setError("Failed to send verification email. Please try again.");
        }

        setIsSubmitting(false);
    }

    const handleCodeInput = (index, value) => {
        if (value.length > 1) {
            // Handle paste
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

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`code-input-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
            document.getElementById(`code-input-${index - 1}`)?.focus();
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;

        setIsResending(true);
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

        setIsResending(false);
    };

    const handleVerifyCode = async () => {
        const enteredCode = codeInputs.join("");
        
        if (enteredCode.length !== 6) {
            setError("Please enter the complete 6-digit code.");
            return;
        }

        if (enteredCode !== generatedCode) {
            setError("Invalid verification code. Please try again.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await callServicesApi({
                action: "ADD_USER",
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone_number: formData.phoneNumber,
                email: formData.email,
                user_type: "client",
                password_hashed: formData.password
            });

            if (response?.success) {
                navigate("/login", { 
                    state: { message: "Account created successfully! Please sign in." } 
                });
            } else {
                // Handle duplicate phone or email
                if (response?.message?.includes("Phone Number already registered")) {
                    setStep(1);
                    setError("This phone number is already registered. Please use a different number.");
                    setFormData(prev => ({ ...prev, phoneNumber: "" }));
                } else if (response?.message?.includes("Email already registered")) {
                    setStep(1);
                    setError("This email is already registered. Please use a different email.");
                    setFormData(prev => ({ ...prev, email: "" }));
                } else {
                    setError(response?.message || "Failed to create account. Please try again.");
                }
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Side - Branding */}
                <div className="login-branding">
                    <div className="login-branding-content">
                        <h1>Join<br />Wag N Wonder</h1>
                        <p>Create an account to find trusted pet services and give your furry friend the care they deserve.</p>
                        <div className="login-features">
                            <div className="login-feature">
                                <i className="bi bi-patch-check-fill"></i>
                                <span>Verified Partners</span>
                            </div>
                            <div className="login-feature">
                                <i className="bi bi-camera-video-fill"></i>
                                <span>Live CCTV Access</span>
                            </div>
                            <div className="login-feature">
                                <i className="bi bi-headset"></i>
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form or Verification */}
                <div className="login-form-section">
                    {step === 1 ? (
                        /* Step 1: Signup Form */
                        <div className="login-form-card">
                            <div className="login-form-header">
                                <h2>Create Account</h2>
                                <p>Sign up to get started</p>
                            </div>

                            {error && (
                                <div className="login-error">
                                    <i className="bi bi-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="signup-name-row">
                                    <div className="login-input-group">
                                        <label className="login-label">First Name</label>
                                        <div className="login-input-wrapper">
                                            <i className="bi bi-person"></i>
                                            <input
                                                type="text"
                                                name="firstName"
                                                className="login-input"
                                                placeholder="First name"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="login-input-group">
                                        <label className="login-label">Last Name</label>
                                        <div className="login-input-wrapper">
                                            <i className="bi bi-person"></i>
                                            <input
                                                type="text"
                                                name="lastName"
                                                className="login-input"
                                                placeholder="Last name"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="login-input-group">
                                    <label className="login-label">Email</label>
                                    <div className="login-input-wrapper">
                                        <i className="bi bi-envelope"></i>
                                        <input
                                            type="email"
                                            name="email"
                                            className="login-input"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="login-input-group">
                                    <label className="login-label">Phone Number</label>
                                    <div className="login-input-wrapper">
                                        <i className="bi bi-phone"></i>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            className="login-input"
                                            placeholder="Enter your phone number"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="login-input-group">
                                    <label className="login-label">Password</label>
                                    <div className="login-input-wrapper">
                                        <i className="bi bi-lock"></i>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            className="login-input"
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                        <i
                                            className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} login-toggle-password`}
                                            onClick={() => setShowPassword((v) => !v)}
                                        ></i>
                                    </div>
                                </div>

                                <div className="login-input-group">
                                    <label className="login-label">Confirm Password</label>
                                    <div className={`login-input-wrapper ${showMismatchError ? 'input-error' : ''} ${formData.confirmPassword.length > 0 && passwordsMatch ? 'input-success' : ''}`}>
                                        <i className="bi bi-lock-fill"></i>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            className="login-input"
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        <i
                                            className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"} login-toggle-password`}
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                        ></i>
                                    </div>
                                    {showMismatchError && (
                                        <span className="input-hint error">Passwords do not match</span>
                                    )}
                                    {formData.confirmPassword.length > 0 && passwordsMatch && (
                                        <span className="input-hint success">Passwords match</span>
                                    )}
                                </div>

                                <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting && (
                                        <span className="spinner-border spinner-border-sm" role="status" />
                                    )}
                                    {isSubmitting ? 'Sending Code...' : 'Create Account'}
                                </button>
                            </form>

                            <div className="login-divider">
                                <span>or</span>
                            </div>

                            <p className="login-signup-text">
                                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
                            </p>
                        </div>
                    ) : (
                        /* Step 2: Verification Code */
                        <div className="login-form-card verification-card">
                            <div className="verification-icon">
                                <i className="bi bi-envelope-check"></i>
                            </div>

                            <div className="login-form-header" style={{ textAlign: 'center' }}>
                                <h2>Check Your Email</h2>
                                <p>We've sent a 6-digit code to<br /><strong>{formData.email}</strong></p>
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
                                disabled={isSubmitting || codeInputs.join("").length !== 6}
                            >
                                {isSubmitting && (
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                )}
                                {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                            </button>

                            <div className="resend-section">
                                <p>Didn't receive the code?</p>
                                <button 
                                    className="resend-btn"
                                    onClick={handleResendCode}
                                    disabled={resendTimer > 0 || isResending}
                                >
                                    {isResending ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                </button>
                            </div>

                            <button 
                                className="back-btn"
                                onClick={() => setStep(1)}
                            >
                                <i className="bi bi-arrow-left"></i>
                                Back to signup
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Signup;