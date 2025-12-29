import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getTokenFromApi } from "../assets/js/getToken";
import { callServicesApi } from "../assets/js/servicesApi";

function ContactUs() {
    const location = useLocation();
    const prefilledSubject = location.state?.subject || "";
    const formRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: prefilledSubject,
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (prefilledSubject && formRef.current) {
            formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            window.scrollTo(0, 0);
        }
    }, [prefilledSubject]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("Please enter a valid email address.");
            setIsSubmitting(false);
            return;
        }
        if (formData.phone && formData.phone.length !== 10) {
            setError("Phone number must be 10 digits.");
            setIsSubmitting(false);
            return;
        }
        try {
            const payload = {
                action: "SEND_ENQUIRY",
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                subject: formData.subject,
                message: formData.message
            };

            const sessionId = localStorage.getItem("session_id");
            if (sessionId) {
                payload.session_id = sessionId;
            } else {
                const token = await getTokenFromApi(payload);
                if (!token) {
                    setError("Unable to process request. Please try again.");
                    setIsSubmitting(false);
                    return;
                }
                payload.token = token;
            }

            const response = await callServicesApi(payload);

            if (response?.success) {
                setSubmitted(true);
                setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
            } else {
                setError(response?.message || "Something went wrong. Please try again.");
            }
        } catch (err) {
            console.error("Contact form error:", err);
            setError("Unable to send message. Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-page">
            <div className="contact-container">
                {/* Header */}
                <div className="contact-header">
                    <h1>Contact Us</h1>
                    <p>We'd love to hear from you! Get in touch with our team.</p>
                </div>

                <div className="contact-content">
                    {/* Contact Info Cards */}
                    <div className="contact-info-grid">
                        <div className="contact-info-card">
                            <div className="contact-info-icon">
                                <i className="bi bi-geo-alt-fill"></i>
                            </div>
                            <h3>Our Location</h3>
                            <p>Sikha Road, Ballam Para, Farabari, West Bengal, 735135</p>
                        </div>

                        <div className="contact-info-card">
                            <div className="contact-info-icon">
                                <i className="bi bi-envelope-fill"></i>
                            </div>
                            <h3>Email Us</h3>
                            <p>
                                <a href="mailto:customersupport@wagnwonder.co">customersupport@wagnwonder.co</a>
                            </p>
                        </div>

                        <div className="contact-info-card">
                            <div className="contact-info-icon">
                                <i className="bi bi-phone-fill"></i>
                            </div>
                            <h3>Call Us</h3>
                            <p>
                                <a href="tel:+919339960164">+91 93399 60164</a>
                            </p>
                        </div>

                        <div className="contact-info-card">
                            <div className="contact-info-icon">
                                <i className="bi bi-clock-fill"></i>
                            </div>
                            <h3>Working Hours</h3>
                            <p>Mon - Sat: 9:00 AM - 7:00 PM</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="contact-form-section" ref={formRef}>
                        <div className="contact-form-header">
                            <h2>Send us a Message</h2>
                            <p>Fill out the form below and we'll get back to you as soon as possible.</p>
                        </div>

                        {submitted ? (
                            <div className="contact-success">
                                <div className="contact-success-icon">
                                    <i className="bi bi-check-circle-fill"></i>
                                </div>
                                <h3>Thank You!</h3>
                                <p>Your message has been sent successfully. We'll get back as soon as possible.</p>
                                <button onClick={() => setSubmitted(false)}>
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="contact-error">
                                        <i className="bi bi-exclamation-circle"></i>
                                        {error}
                                    </div>
                                )}
                                <div className="contact-form-row">
                                    <div className="contact-input-group">
                                        <label>Your Name *</label>
                                        <div className="contact-input-wrapper">
                                            <i className="bi bi-person"></i>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="Enter your name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="contact-input-group">
                                        <label>Email Address *</label>
                                        <div className="contact-input-wrapper">
                                            <i className="bi bi-envelope"></i>
                                            <input
                                                type="text"
                                                name="email"
                                                placeholder="Enter your email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="contact-form-row">
                                    <div className="contact-input-group">
                                        <label>Phone Number *</label>
                                        <div className="contact-input-wrapper">
                                            <i className="bi bi-phone"></i>
                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="Enter your phone number"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="contact-input-group">
                                        <label>Subject *</label>
                                        <div className="contact-input-wrapper">
                                            <i className="bi bi-chat-left-text"></i>
                                            <select
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Select a subject</option>
                                                <option value="general">General Inquiry</option>
                                                <option value="booking">Booking Related</option>
                                                <option value="support">Customer Support</option>
                                                <option value="partnership">Partnership</option>
                                                <option value="feedback">Feedback</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="contact-input-group">
                                    <label>Your Message *</label>
                                    <div className="contact-input-wrapper textarea">
                                        <i className="bi bi-pencil"></i>
                                        <textarea
                                            name="message"
                                            placeholder="Write your message here..."
                                            rows="5"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                <button type="submit" className="contact-submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send-fill"></i>
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Social Links */}
                    <div className="contact-social">
                        <h3>Follow Us</h3>
                        <div className="contact-social-links">
                            <a href="https://www.instagram.com/wagnwonder.co" target="_blank" rel="noopener noreferrer">
                                <i className="bi bi-instagram"></i>
                            </a>
                            <a href="https://www.facebook.com/share/17yjD1igH5/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
                                <i className="bi bi-facebook"></i>
                            </a>
                            {/* <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <i className="bi bi-twitter-x"></i>
                            </a> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;