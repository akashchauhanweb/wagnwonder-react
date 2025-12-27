import React from "react";
import { useNavigate } from "react-router-dom";

export default function KennelCard({
    kennel,
    onBook,
    bookLabel = "View Details",
    isLoading = false,
}) {
    const navigate = useNavigate();
    const {
        kennel_id,
        kennel_name,
        starting_price,
        distance_km,
        images = [],
    } = kennel;

    const carouselId = `carousel-${kennel_id}`;

    const handleClick = () => {
        navigate(`/kennels/${kennel_id}`);
    };

    return (
        <div className="kennel-card" onClick={handleClick}>
            {/* Image Section */}
            <div className="kennel-card-image" onClick={(e) => e.stopPropagation()}>
                {images.length > 0 ? (
                    <div
                        id={carouselId}
                        className="carousel slide"
                        data-bs-ride="carousel"
                        data-bs-interval="3000"
                        data-bs-touch="true"
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
                    </div>
                ) : (
                    <div className="kennel-card-no-image">
                        <i className="bi bi-image"></i>
                        <span>No Image</span>
                    </div>
                )}

                {/* Distance Badge */}
                {typeof distance_km === "number" && !isNaN(distance_km) && (
                    <div className="kennel-card-badge">
                        <i className="bi bi-geo-alt-fill"></i>
                        {distance_km.toFixed(1)} km
                    </div>
                )}
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