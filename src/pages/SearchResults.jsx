
import { useLocation, useNavigate } from "react-router-dom";
import KennelCard from "../assets/components/KennelCard";
import { callServicesApi } from "../assets/js/servicesApi";
import { useState } from "react";


export default function SearchResults() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loadingId, setLoadingId] = useState(null);
    // pull kennels array from the router state
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
            // save pending booking info and redirect to login
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
        console.log(payload);
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
            // navigate to your booking detail page, passing the full response
            navigate(`/search-results/${kennel_id}`, { state: res });
        } catch (err) {
            console.error("Booking fetch error:", err);
        }
    };

    return (
        <section className="container py-5">
            <button className="btn mb-4" onClick={() => navigate(-1)}>
                {"<"} Back to Search
            </button>

            {availableKennels.length + nearbyKennels.length + soldOutKennels.length === 0 ? (
                <div className="text-center my-5">
                    <h2 className="fw-bold" style={{ color: "#471915" }}>
                        Oops! No kennels found nearby.
                    </h2>
                    <p className="lead text-muted">
                        We’re expanding our network soon. Stay tuned!
                    </p>
                    <button
                        className="btn btn-secondary mt-3"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <>
                    {availableKennels.length > 0 && (
                        <>
                            <h2 className="fw-bold mb-4">Available Kennels</h2>
                            <div className="row g-4">
                                {availableKennels.map(k => (
                                    <div key={k.kennel_id} className="col-md-6">
                                        <KennelCard
                                            kennel={k}
                                            onBook={() => handleBooking(k.kennel_id)}
                                            bookLabel="Book Now"
                                            isLoading={loadingId === k.kennel_id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {nearbyKennels.length > 0 && (
                        <>
                            <div className="text-center my-5">
                                <h2 className="fw-bold" style={{ color: "#471915" }}>
                                    Oops! No availability in your city.
                                </h2>
                                <p className="lead text-muted">
                                    But we’ve found these kennels near you:
                                </p>
                            </div>

                            <div className="row g-4">
                                {nearbyKennels.map(k => (
                                    <div key={k.kennel_id} className="col-md-6">
                                        <KennelCard
                                            kennel={k}
                                            onBook={() => handleBooking(k.kennel_id)}
                                            bookLabel="Book Now"
                                            isLoading={loadingId === k.kennel_id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {soldOutKennels.length > 0 && (
                        <>
                            <h2 className="fw-bold mt-5 mb-4">Sold Out</h2>
                            <div className="row g-4">
                                {soldOutKennels.map(k => (
                                    <div key={k.kennel_id} className="col-md-6" style={{ opacity: 0.6 }}>
                                        <KennelCard
                                            kennel={k}
                                            bookLabel="Sold Out"
                                            isLoading={false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </section>

    );
}
