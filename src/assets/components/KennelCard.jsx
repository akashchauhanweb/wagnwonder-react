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
        <div
            className="card h-100 shadow-sm"
            style={{ cursor: "pointer" }}
            onClick={handleClick}
        >
            {images.length > 0 ? (
                <div
                    id={carouselId}
                    className="carousel slide"
                    data-bs-ride="carousel"
                    data-bs-interval="3000"
                >
                    {/* Dots Indicators */}
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
                                    className="d-block w-100"
                                    alt={`${kennel_name} image ${idx + 1}`}
                                    style={{ height: "200px", objectFit: "cover" }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <img
                    src="https://via.placeholder.com/400x200?text=No+Image"
                    className="card-img-top"
                    alt="No Image"
                    style={{ height: "200px", objectFit: "cover" }}
                />
            )}

            <div className="card-body d-flex flex-column">
                <h5 className="card-title">{kennel_name}</h5>
                {typeof distance_km === "number" && !isNaN(distance_km) && (
                    <p className="card-text text-muted mb-1">
                        {distance_km.toFixed(2)} km away
                    </p>
                )}
                <p className="card-text fw-bold mb-3">
                    Starting from ₹{starting_price} per day.
                </p>
                <button
                    className="mt-auto btn py-2"
                    style={{ backgroundColor: "#471915", color: "#fff" }}
                    disabled={isLoading}
                    onClick={(e) => {
                        e.stopPropagation();
                        onBook();
                    }}
                >
                    {isLoading ? (
                        <>
                            <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                            />
                        </>
                    ) : (
                        bookLabel
                    )}
                </button>
            </div>
        </div>
    );
}
