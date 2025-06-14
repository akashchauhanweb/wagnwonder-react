import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AddPetModal from "../assets/components/AddPetModal";
import { callServicesApi } from '../assets/js/servicesApi';

export default function SearchDetails() {
    const { kennelId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const booking = location.state;
    // ─── Pet selection state ───
    const [petList, setPetList] = useState([]);
    const [selectedPets, setSelectedPets] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFetchingPets, setIsFetchingPets] = useState(true);

    const loadPets = async () => {
        setIsFetchingPets(true);
        try {
            const res = await callServicesApi({
                action: "FETCH_PET_LIST",
                session_id: localStorage.getItem("session_id"),
            });
            // adjust based on your API shape:
            const list = res.pet_list ?? res.data ?? [];
            localStorage.setItem("pets", JSON.stringify(list));
            setPetList(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Error fetching pets:", err);
            setPetList([]);
        }
        setIsFetchingPets(false);
    };
    // ─── Fetch pet list on mount ───
    useEffect(() => {
        loadPets();
    }, []);
    // If no booking data, show basic fallback
    if (!booking) {
        return (
            <section className="container py-5">
                <button className="btn mb-4" onClick={() => navigate(-1)}>
                    {"<"} Back to Results
                </button>
                <p className="text-muted">No booking details available.</p>
            </section>
        );
    }
    // booking state from API has changed to include `features` array as well
    const { kennel, room_types } = booking;
    const petCount = parseInt(booking.pet_count) ?? 1;
    const images = Array.isArray(kennel.images) ? kennel.images : [];
    const getNumberOfDays = () => {
        const checkin = new Date(booking.check_in);
        const checkout = new Date(booking.check_out);
        const diffTime = Math.abs(checkout - checkin);
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))); // always at least 1 day
    };

    const getRoomPriceKey = (weight) => {
        if (weight === "below 15kgs") return "price_small";
        if (weight === "above 15kgs and below 40kgs") return "price_medium";
        if (weight === "above 40kgs") return "price_large";
        return null;
    };

    const calculateRoomPrice = (roomType) => {
        const days = getNumberOfDays();
        return selectedPets.reduce((total, petId) => {
            const pet = petList.find((p) => p.id === petId);
            const priceKey = getRoomPriceKey(pet?.weight || "");
            const pricePerDay = roomType[priceKey] || 0;
            return total + pricePerDay * days;
        }, 0);
    };


    // ─── Handle pet button click ───
    const handlePetClick = (id) => {
        setSelectedPets((prev) => {
            if (prev.includes(id)) {
                // unselect
                return prev.filter((p) => p !== id);
            }
            // select new, FIFO if over limit
            if (prev.length < petCount) {
                return [...prev, id];
            }
            const [, ...rest] = prev;
            return [...rest, id];
        });
    };

    return (
        <section className="container py-5">
            <button className="btn mb-4" onClick={() => navigate(-1)}>
                {"<"} Back to Results
            </button>
            {/* ——— Image Carousel ——— */}
            <div
                id={`carousel-${kennelId}`}
                className="carousel slide mb-3 rounded"
                data-bs-ride="carousel"
                data-bs-interval="3000"
            >
                <div className="carousel-indicators">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            data-bs-target={`#carousel-${kennelId}`}
                            data-bs-slide-to={idx}
                            className={idx === 0 ? "active" : ""}
                            aria-current={idx === 0 ? "true" : undefined}
                            aria-label={`Slide ${idx + 1}`}
                        />
                    ))}
                </div>
                <div className="carousel-inner overflow-hidden">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className={`carousel-item${idx === 0 ? " active" : ""}`}
                        >
                            <img
                                src={img}
                                className="d-block w-100"
                                alt={`Slide ${idx + 1}`}
                                style={{ maxHeight: "400px", objectFit: "cover" }}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="mb-3">
                <h2 className="display-5 fw-bold">{kennel.kennel_name}</h2>
            </div>
            {/* ——— Features ——— */}
            {Array.isArray(kennel.features) && kennel.features.length > 0 && (
                <div className="mb-5">
                    <h5 className="fw-semibold mb-3">Features</h5>
                    <div className="d-flex flex-wrap gap-2">
                        {kennel.features.map((feat, idx) => (
                            <span
                                key={idx}
                                className="badge rounded-pill px-3 py-2"
                                style={{ backgroundColor: "#471915", color: "#fff" }}
                            >
                                {feat}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {/* ——— Pet Selection ——— */}
            <div className="mb-5">
                <h5 className="fw-semibold mb-3">
                    Select the pet you’re booking boarding for
                </h5>

                {isFetchingPets ? (
                    <div className="text-center py-4">
                        <div
                            className="spinner-border"
                            role="status"
                            style={{ color: "#471915" }}
                        />
                    </div>
                ) : petList.length === 0 ? (
                    <div className="text-muted mb-3">
                        <p className="mb-2">You haven’t added any pets yet.</p>
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="mx-2 my-2 px-4 py-2 rounded-pill"
                            style={{
                                backgroundColor: "transparent",
                                color: "#471915",
                                border: "2px solid #471915",
                                fontSize: "1.1rem",
                            }}
                        >
                            + Add a Pet
                        </button>
                    </div>
                ) : (
                    <div className="d-flex flex-wrap gap-2">
                        {petList.map((pet) => {
                            const isSelected = selectedPets.includes(pet.id);
                            return (
                                <button
                                    key={pet.id}
                                    type="button"
                                    className="mx-2 my-2 px-4 py-2 rounded-pill"
                                    style={{
                                        backgroundColor: isSelected ? "#471915" : "transparent",
                                        color: isSelected ? "#fff" : "#471915",
                                        border: "2px solid #471915",
                                        fontSize: "1.1rem",
                                    }}
                                    onClick={() => handlePetClick(pet.id)}
                                >
                                    {pet.name}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="mx-2 my-2 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: "40px",
                                height: "40px",
                                border: "2px solid #471915",
                                color: "#471915",
                                backgroundColor: "transparent",
                                fontSize: "1.5rem",
                                lineHeight: 1,
                            }}
                            aria-label="Add More Pets"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>

            {/* ——— Room Types ——— */}
            <div className="mb-5">
                <h5 className="fw-semibold mb-3">Room Types</h5>
                <div className="row g-4">
                    {Array.isArray(room_types) &&
                        room_types.map((room) => {
                            const isAvailable = room.available_rooms >= petCount;
                            return (
                                <div key={room.room_type_id} className="col-md-6 col-lg-4">
                                    <div
                                        className={`card h-100 shadow-sm ${!isAvailable ? "opacity-50" : ""
                                            }`}
                                    >
                                        <div className="card-body d-flex flex-column">
                                            <h6 className="card-title">{room.room_type}</h6>
                                            <p className="text-muted mb-2">
                                                Available: {room.available_rooms}
                                            </p>
                                            <ul className="list-unstyled mb-4">
                                                <li>Small Breed: ₹{room.price_small}</li>
                                                <li>Medium Breed: ₹{room.price_medium}</li>
                                                <li>Large Breed: ₹{room.price_large}</li>
                                            </ul>
                                            <button
                                                className="mt-auto btn py-2"
                                                style={{ backgroundColor: "#471915", color: "#fff" }}
                                                disabled={!isAvailable}
                                                onClick={() => {
                                                    if (selectedPets.length !== petCount) {
                                                        alert(`Please select ${petCount} pet(s) before continuing.`);
                                                        return;
                                                    }
                                                    const days = getNumberOfDays();
                                                    const breakdown = selectedPets.map((id) => {
                                                        const pet = petList.find((p) => p.id === id);
                                                        const priceKey = getRoomPriceKey(pet?.weight || "");
                                                        const perDay = Number(room?.[priceKey]) || 0; // <- ensure numeric fallback
                                                        return {
                                                            id,
                                                            name: pet?.name,
                                                            weight: pet?.weight,
                                                            breed: pet?.breed,
                                                            perDay,
                                                            total: perDay * days,
                                                        };
                                                    });

                                                    const total = breakdown.reduce((sum, p) => sum + (p.total || 0), 0);

                                                    navigate("/booking-review", {
                                                        state: {
                                                            kennel: kennel,
                                                            checkin: booking.check_in,
                                                            checkout: booking.check_out,
                                                            breakdown: breakdown,
                                                            total: total,
                                                            days: days,
                                                            room_type_id: room.room_type_id
                                                        },
                                                    });
                                                }}
                                            >
                                                {isAvailable ? `Continue – ₹${calculateRoomPrice(room)}` : "Sold Out"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
            {/* ——— Add Pet Modal Invocation ——— */}
            {showAddModal && (
                <AddPetModal
                    limit={petCount - selectedPets.length}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => {
                        setShowAddModal(false);
                        // re-fetch pets so the new pet appears in the selection
                        loadPets();
                    }}
                />
            )}
        </section>
    );
}
