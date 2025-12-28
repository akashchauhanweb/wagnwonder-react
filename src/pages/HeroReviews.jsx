import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import meetaSharmaPhoto from "../assets/images/reviews/meeta-sharma.png";
import jayeetaMitraPhoto from "../assets/images/reviews/jayeeta-mitra.png";

const REVIEWS = [
    {
        name: "Meeta Sharma",
        role: "Entrepreneur",
        photo: meetaSharmaPhoto,
        rating: 5,
        content: "We boarded our pet here, and the experience was truly exceptional. He had an amazing time exploring the wide, open spaces. Our furry friend came back happy and full of energy!",
    },
    {
        name: "Jayeeta Mitra",
        role: "Homemaker",
        photo: jayeetaMitraPhoto,
        rating: 5,
        content: "The facility is beautifully designed with pets' comfort in mind. My dog usually takes time to settle in, but here he felt at home from day one. Highly recommended!",
    },
];

function HeroReviews() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const session = localStorage.getItem("session_id");
        const userData = localStorage.getItem("user_data");
        setIsLoggedIn(!!(session && userData));
    }, []);

    return (
        <section className="reviews-section">
            <div className="info-container">
                <div className="info-header">
                    <span className="info-badge">Testimonials</span>
                    <h2 className="info-title">What Pet Parents Say</h2>
                    <p className="info-subtitle">
                        Hear from our happy customers who've experienced the Wag N Wonder difference.
                    </p>
                </div>

                <div className="reviews-grid">
                    {REVIEWS.map((review, idx) => (
                        <div key={idx} className="review-card">
                            <div className="review-stars">
                                {[...Array(review.rating)].map((_, i) => (
                                    <i key={i} className="bi bi-star-fill"></i>
                                ))}
                            </div>
                            <p className="review-content">"{review.content}"</p>
                            <div className="review-author">
                                <img src={review.photo} alt={review.name} className="review-avatar" />
                                <div>
                                    <div className="review-name">{review.name}</div>
                                    <div className="review-role">{review.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reviews-cta">
                    <p>Your pet's comfort is our biggest reward.</p>
                    <button className="cta-button" onClick={() => navigate(isLoggedIn ? "/account" : "/signup")}>
                        {isLoggedIn ? "View your Account" : "Join the Family"}
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </div>
            </div>
        </section>
    );
}

export default HeroReviews;
