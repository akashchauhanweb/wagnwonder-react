import { useLocation, useNavigate } from "react-router-dom";
import KennelCard from "../assets/components/KennelCard";
import { callServicesApi } from "../assets/js/servicesApi";
import { useState } from "react";

export default function SearchResults() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loadingId, setLoadingId] = useState(null);

    const {
        available: availableKennels = [],
        nearby_cities: nearbyKennels = [],
        sold_out: soldOutKennels = []
    } = state?.results?.kennels || {};
    const { petCount, check_in, check_out } = state || {};

    const handleBooking = async (kennel_id) => {
        setLoadingId(kennel_id);
        const sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            localStorage.setItem(
                "pending_booking",
                JSON.stringify({ kennel_id, petCount, check_in, check_out })
            );
            return navigate("/login");
        }

        const payload = {
            action: "GET_KENNEL_BOOKING",
            session_id: sessionId,
            kennel_id: kennel_id,
            pet_count: petCount,
            check_in: check_in,
            check_out: check_out,
        };

        try {
            const res = await callServicesApi(payload);
            if (res?.status_code === 498) {
                localStorage.clear();
                window.location.href = "/login";
                return;
            }
            res.pet_count = petCount;
            res.check_in = check_in;
            res.check_out = check_out;
            navigate(`/search-results/${kennel_id}`, { state: res });
        } catch (err) {
            console.error("Booking fetch error:", err);
        }
    };

    const totalKennels = availableKennels.length + nearbyKennels.length + soldOutKennels.length;

    return (
        <div className="search-results-page">
            {/* Header Section */}
            <div className="search-results-header">
                <div className="search-results-header-content">
                    <button className="search-back-btn" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h1>Results</h1>
                </div>
            </div>

            <div className="search-results-container">
                {totalKennels === 0 ? (
                    <div className="search-empty-state">
                        <div className="search-empty-icon">
                            <i className="bi bi-search"></i>
                        </div>
                        <h2>No kennels found nearby</h2>
                        <p>We're expanding our network soon. Try searching in a different location or check back later!</p>
                        <button className="search-empty-btn" onClick={() => navigate(-1)}>
                            <i className="bi bi-arrow-left"></i>
                            Go Back
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Available Kennels */}
                        {availableKennels.length > 0 && (
                            <div className="search-section">
                                <div className="search-section-header">
                                    <div className="search-section-icon available">
                                        <i className="bi bi-check-circle-fill"></i>
                                    </div>
                                    <div>
                                        <h2>Available Kennels</h2>
                                        <p>{availableKennels.length} {availableKennels.length === 1 ? 'option' : 'options'} in your city</p>
                                    </div>
                                </div>
                                <div className="search-kennels-grid">
                                    {availableKennels.map(k => (
                                        <div key={k.kennel_id} className="search-kennel-item">
                                            <KennelCard
                                                kennel={k}
                                                onBook={() => handleBooking(k.kennel_id)}
                                                bookLabel="Book Now"
                                                isLoading={loadingId === k.kennel_id}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nearby Cities */}
                        {nearbyKennels.length > 0 && (
                            <div className="search-section">
                                <div className="search-section-header">
                                    <div className="search-section-icon nearby">
                                        <i className="bi bi-geo-alt-fill"></i>
                                    </div>
                                    <div>
                                        <h2>{availableKennels.length > 0 ? "Nearby Cities" : "Available in Nearby Cities"}</h2>
                                        <p>{availableKennels.length > 0 
                                            ? "More options just outside your city" 
                                            : "We found these kennels near you"}</p>
                                    </div>
                                </div>
                                <div className="search-kennels-grid">
                                    {nearbyKennels.map(k => (
                                        <div key={k.kennel_id} className="search-kennel-item">
                                            <KennelCard
                                                kennel={k}
                                                onBook={() => handleBooking(k.kennel_id)}
                                                bookLabel="Book Now"
                                                isLoading={loadingId === k.kennel_id}
                                                showCity={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sold Out */}
                        {soldOutKennels.length > 0 && (
                            <div className="search-section">
                                <div className="search-section-header">
                                    <div className="search-section-icon sold-out">
                                        <i className="bi bi-calendar-x-fill"></i>
                                    </div>
                                    <div>
                                        <h2>Sold Out</h2>
                                        <p>These kennels are fully booked for your dates</p>
                                    </div>
                                </div>
                                <div className="search-kennels-grid">
                                    {soldOutKennels.map(k => (
                                        <div key={k.kennel_id} className="search-kennel-item sold-out">
                                            <KennelCard
                                                kennel={k}
                                                bookLabel="Sold Out"
                                                isLoading={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}