import { useState } from "react";
import { useNavigate } from "react-router-dom";
import isEmail from "../assets/js/isEmail";
import { getTokenFromApi } from "../assets/js/getToken";
import { verifyUser } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { setLoading } = useLoading();

    async function handleSubmit(e) {
        setLoading(true);
        e.preventDefault();
        if (email && password) {
            let credentials = {
                action: "VERIFY_USER",
                client: "browser",
                password_hashed: password
            }
            if (isEmail(email)) {
                credentials.email = email;
            } else {
                credentials.phone_number = email;
            }
            let token = await getTokenFromApi(credentials);
            if (!token) {
                alert("Authentication Failed!");
            }
            let response = await verifyUser(credentials, token);
            if (response && response.success) {
                localStorage.setItem("session_id", response.session_id);
                localStorage.setItem("user_data", JSON.stringify(response.user_data));
                setLoading(false);
                navigate("/");
            } else {
                setLoading(false);
                alert("Login failed: Incorrect credentials.");
            }
        } else {
            alert("Please enter valid email and password.");
        }
    };

    return (
        <div id="login-form" className="container">
            <div className="justify-content-center align-items-center" style={{ backgroundColor: "#FAF4EF" }}>
                <div className="bg-white p-4 rounded" style={{ color: "#471915" }}>
                    <h2 className="fw-bold mb-1">Welcome back!</h2>
                    <p className="mb-4" style={{ color: "#999" }}>Hello, great to see you again !</p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Email or Phone</label>
                            <input
                                type="text"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="mb-3 position-relative">
                            <label className="form-label fw-semibold">Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <i
                                className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} position-absolute`}
                                style={{
                                    top: "50%",
                                    right: "1rem",
                                    transform: "translateY(-50%)",
                                    cursor: "pointer",
                                    color: "#000"
                                }}
                                onClick={() => setShowPassword(v => !v)}
                            />
                            <div className="text-end mt-1">
                                <a href="#" style={{ color: "#E94E1B", fontSize: "0.9rem" }}>
                                    Forgot password
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn w-100 fw-bold"
                            style={{ backgroundColor: "#471915", color: "#fff" }}
                        >
                            LOGIN
                        </button>
                    </form>

                    <p className="text-center mt-4" style={{ color: "#999" }}>
                        Don't have an account? <a href="#" style={{ color: "#000", fontWeight: "600" }}>Create account</a>
                    </p>
                </div>
            </div>
        </div>

    );
}

export default Login;
