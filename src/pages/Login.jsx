import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import isEmail from "../assets/js/isEmail";
import { getTokenFromApi } from "../assets/js/getToken";
import { verifyUser } from "../assets/js/servicesApi";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        
        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        setIsSubmitting(true);
        
        let credentials = {
            action: "VERIFY_USER",
            client: "browser",
            password_hashed: password
        };

        if (isEmail(email)) {
            credentials.email = email;
        } else {
            credentials.phone_number = email;
        }

        try {
            let token = await getTokenFromApi(credentials);
            if (!token) {
                setError("Authentication failed. Please try again.");
                setIsSubmitting(false);
                return;
            }

            let response = await verifyUser(credentials, token);
            if (response && response.success) {
                localStorage.setItem("session_id", response.session_id);
                localStorage.setItem("user_data", JSON.stringify(response.user_data));
                localStorage.setItem("woof_balance", response.woof_balance || 0);
                
                // Check for redirect destination
                const redirectPath = localStorage.getItem("redirect_after_login");
                if (redirectPath) {
                    localStorage.removeItem("redirect_after_login");
                    navigate(redirectPath);
                } else {
                    navigate("/");
                }
            } else {
                setIsSubmitting(false);
                setError("Incorrect email or password.");
            }
        } catch (err) {
            setIsSubmitting(false);
            console.log(err);
            setError("Something went wrong. Please try again.");
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">

                {/* Left Side - Branding */}
                <div className="login-branding">
                    <div className="login-branding-content">
                        <h1>Welcome to<br />Wag N Wonder</h1>
                        <p>Premium care for your furry family. Find trusted pet services near you.</p>
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

                {/* Right Side - Form */}
                <div className="login-form-section">
                    <div className="login-form-card">
                        <div className="login-form-header">
                            <h2>Welcome back!</h2>
                            <p>Sign in to continue to your account</p>
                        </div>
                        {successMessage && (
                            <div className="login-success">
                                <i className="bi bi-check-circle"></i>
                                {successMessage}
                            </div>
                        )}
                        {error && (
                            <div className="login-error">
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="login-input-group">
                                <label className="login-label">Email or Phone</label>
                                <div className="login-input-wrapper">
                                    <i className="bi bi-person"></i>
                                    <input
                                        type="text"
                                        className="login-input"
                                        placeholder="Enter your email or phone"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="login-input-group">
                                <label className="login-label">Password</label>
                                <div className="login-input-wrapper">
                                    <i className="bi bi-lock"></i>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="login-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <i
                                        className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} login-toggle-password`}
                                        onClick={() => setShowPassword((v) => !v)}
                                    ></i>
                                </div>
                                <div className="login-forgot">
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a>
                                </div>
                            </div>

                            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                                {isSubmitting && (
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                )}
                                {isSubmitting ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="login-divider">
                            <span>or</span>
                        </div>

                        <p className="login-signup-text">
                            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Create account</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;