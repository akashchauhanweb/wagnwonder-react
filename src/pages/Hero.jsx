import HeroForm from "./HeroForm.jsx";
import HeroInfo from "./HeroInfo.jsx";
import HeroReviews from "./HeroReviews.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Hero() {
    const navigate = useNavigate();
    const [showBanner, setShowBanner] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const bannerMessages = [
        { icon: "🎉", text: "New! Discover exciting pet events near you", cta: "Explore Events", path: "/events", expiresOn: "2026-01-31" },
        { icon: "🏆", text: "Registrations for 3rd All Breed Open Championship is now open!", cta: "Register Now", path: "/events", expiresOn: "2026-01-31" },
    ].filter(msg => !msg.expiresOn || new Date(msg.expiresOn) >= new Date());

    const handleBannerClick = (path) => {
        if (path === "/events") {
            localStorage.setItem("activeNav", "Events");
        }
        navigate(path);
    };

    return (
        <>
            {showBanner && bannerMessages.length > 0 && (
                <div className="promo-banner">
                    <div className="promo-banner-track">
                        {[...bannerMessages, ...bannerMessages].map((msg, idx) => (
                            <div 
                                key={idx} 
                                className="promo-banner-item"
                                onClick={() => handleBannerClick(msg.path)}
                            >
                                <span className="promo-banner-icon">{msg.icon}</span>
                                <span className="promo-banner-text">{msg.text}</span>
                                <span className="promo-banner-cta">{msg.cta} →</span>
                                <span className="promo-banner-divider">•</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        className="promo-banner-close" 
                        onClick={(e) => { e.stopPropagation(); setShowBanner(false); }}
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>
            )}
            <HeroForm />
            <HeroInfo />
            <HeroReviews />
        </>
    );
}

export default Hero;