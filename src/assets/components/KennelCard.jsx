import { useEffect, useRef } from 'react';

export default function KennelCard({
    kennel,
    onBook,
    bookLabel = "View Details",
    isLoading = false,
    showCity = false,
    coupon = null,
}) {
    const {
        kennel_id,
        kennel_name,
        starting_price,
        distance_km,
        images = [],
        kennel_city,
    } = kennel;

    const carouselId = `carousel-${kennel_id}`;
    const carouselRef = useRef(null);

    useEffect(() => {
        if (images.length > 1 && carouselRef.current && window.bootstrap) {
            const carousel = new window.bootstrap.Carousel(carouselRef.current, {
                interval: 3000,
                ride: 'carousel',
                touch: true
            });
            return () => carousel.dispose();
        }
    }, [images.length]);

    const handleClick = () => {
    if (onBook) onBook();
};

return (
    <div className="kennel-card" onClick={bookLabel !== "Sold Out" ? handleClick : undefined}>
            {/* Image Section */}
            <div className="kennel-card-image" onClick={(e) => e.stopPropagation()}>
                {images.length > 0 ? (
                    <div
                        ref={carouselRef}
                        id={carouselId}
                        className="carousel slide"
                    >
                        <div className="carousel-indicators">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    data-bs-target={`#${carouselId}`}
                                    data-bs-slide-to={idx}
                                    className={idx === 0 ? "active" : ""}
                                    aria-current={idx === 0 ? "true" : undefined}
                                    aria-label={`Slide ${idx + 1}`}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ))}
                        </div>

                        <div className="carousel-inner">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`carousel-item${idx === 0 ? " active" : ""}`}
                                >
                                    <img
                                        src={img}
                                        alt={`${kennel_name} image ${idx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {images.length > 1 && (
                            <>
                                <button
                                    className="carousel-control-prev carousel-nav-btn"
                                    type="button"
                                    data-bs-target={`#${carouselId}`}
                                    data-bs-slide="prev"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                                <button
                                    className="carousel-control-next carousel-nav-btn"
                                    type="button"
                                    data-bs-target={`#${carouselId}`}
                                    data-bs-slide="next"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="kennel-card-no-image">
                        <i className="bi bi-image"></i>
                        <span>No Image</span>
                    </div>
                )}

                {/* Badges */}
                <div className="kennel-card-badges">
                    {typeof distance_km === "number" && !isNaN(distance_km) && (
                        <div className="kennel-card-badge">
                            <i className="bi bi-geo-alt-fill"></i>
                            {distance_km.toFixed(1)} km
                        </div>
                    )}
                    {showCity && kennel_city && (
                        <div className="kennel-card-badge">
                            <i className="bi bi-building"></i>
                            {kennel_city}
                        </div>
                    )}
                    {coupon && (
                        <div className="kennel-card-badge" style={{ background: "linear-gradient(135deg, #D84A39, #471915)", color: "white" }}>
                            <i className="bi bi-tag-fill" style={{ color: "white" }}></i>
                            {coupon.discount_type === "flat" ? `₹${coupon.discount_value} off` : `${coupon.discount_value}% off`}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="kennel-card-content">
                <h3 className="kennel-card-title">{kennel_name}</h3>
                
                <div className="kennel-card-price">
                    <span className="kennel-card-price-label">Starting from</span>
                    <span className="kennel-card-price-value">₹{starting_price}</span>
                    <span className="kennel-card-price-unit">/ day</span>
                </div>

                <button
                    className={`kennel-card-btn ${bookLabel === "Sold Out" ? "sold-out" : ""}`}
                    disabled={isLoading || bookLabel === "Sold Out"}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onBook) onBook();
                    }}
                >
                    {isLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                        <>
                            {bookLabel === "Sold Out" ? (
                                <i className="bi bi-calendar-x"></i>
                            ) : (
                                <i className="bi bi-calendar-check"></i>
                            )}
                            {bookLabel}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}