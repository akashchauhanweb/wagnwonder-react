const FEATURES = [
    {
        icon: "bi-patch-check-fill",
        title: "Verified & Trusted",
        description: "We partner only with carefully vetted service providers—from crèches and boardings to groomers and trainers.",
    },
    {
        icon: "bi-camera-video-fill",
        title: "Live CCTV Access",
        description: "Enjoy real-time peace of mind! Check in on your pet anytime with live CCTV access at selected facilities.",
    },
    {
        icon: "bi-phone-fill",
        title: "Seamless Booking",
        description: "Find, compare, and confirm pet services in a few clicks with our user-friendly interface.",
    },
    {
        icon: "bi-bullseye",
        title: "Personalized Match",
        description: "Tell us about your pet, and we'll match you with services tailored to their breed, age, and preferences.",
    },
    {
        icon: "bi-people-fill",
        title: "Paw-sitive Community",
        description: "Join a growing tribe of responsible pet parents. Get tips, reviews, and recommendations from real pet lovers.",
    },
    {
        icon: "bi-headset",
        title: "24/7 Support",
        description: "Our dedicated support team is always available to help you with any questions or concerns.",
    },
];

const UPCOMING_FEATURES = [
    {
        icon: "bi-shield-check",
        title: "Pet Insurance",
        description: "Protect your furry family with insurance covering emergencies and illnesses.",
    },
    {
        icon: "bi-airplane-fill",
        title: "Travel Tie-Ups",
        description: "Going on vacation? Our partners ensure your pet is cared for in loving facilities.",
    },
    {
        icon: "bi-bag-fill",
        title: "Pet Shop",
        description: "Shop handpicked products from accessories to food, delivered to your doorstep.",
    },
];

const GALLERY_PHOTOS = [
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/1.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/2.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/3.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/4.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/5.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/8.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/6.png",
    "https://wagnwonder.s3.ap-south-1.amazonaws.com/gallery/7.png",
];

function HeroInfo() {
    return (
        <>
            {/* Why Choose Us Section */}
            <section className="info-section">
                <div className="info-container">
                    <div className="info-header">
                        <span className="info-badge">Why Choose Us</span>
                        <h2 className="info-title">Everything Your Pet Deserves</h2>
                        <p className="info-subtitle">
                            We're redefining pet parenting with a curated platform that connects 
                            pet lovers with the most trusted services.
                        </p>
                    </div>

                    <div className="features-grid">
                        {FEATURES.map((feature, idx) => (
                            <div key={idx} className="feature-card">
                                <div className="feature-icon">
                                    <i className={`bi ${feature.icon}`}></i>
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="gallery-section">
                <div className="info-container">
                    <div className="info-header">
                        <span className="info-badge">Gallery</span>
                        <h2 className="info-title">Happy Moments</h2>
                        <p className="info-subtitle">
                            See our furry guests enjoying their stay at our partner facilities.
                        </p>
                    </div>

                    <div className="gallery-grid">
                        {GALLERY_PHOTOS.map((src, idx) => (
                            <div key={idx} className="gallery-item">
                                <img src={src} alt={`Gallery ${idx + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Upcoming Features Section */}
            <section className="upcoming-section">
                <div className="info-container">
                    <div className="info-header">
                        <span className="info-badge light">Coming Soon</span>
                        <h2 className="info-title light">Exciting Features Ahead</h2>
                        <p className="info-subtitle light">
                            We're constantly working to make your pet parenting journey even better.
                        </p>
                    </div>

                    <div className="upcoming-grid">
                        {UPCOMING_FEATURES.map((feature, idx) => (
                            <div key={idx} className="upcoming-card">
                                <div className="upcoming-icon">
                                    <i className={`bi ${feature.icon}`}></i>
                                </div>
                                <h3 className="upcoming-title">{feature.title}</h3>
                                <p className="upcoming-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

export default HeroInfo;
