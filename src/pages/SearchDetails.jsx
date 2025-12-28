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

    const [petList, setPetList] = useState([]);
    const [selectedPets, setSelectedPets] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFetchingPets, setIsFetchingPets] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const loadPets = async () => {
        setIsFetchingPets(true);
        try {
            const res = await callServicesApi({
                action: "FETCH_PET_LIST",
                session_id: localStorage.getItem("session_id"),
            });
            const list = res.pet_list ?? res.data ?? [];
            localStorage.setItem("pets", JSON.stringify(list));
            setPetList(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Error fetching pets:", err);
            setPetList([]);
        }
        setIsFetchingPets(false);
    };

    useEffect(() => {
        loadPets();
    }, []);

    if (!booking) {
        return (
            <div className="search-details-page">
                <div className="search-results-header">
                    <div className="search-results-header-content">
                        <button className="search-back-btn" onClick={() => navigate(-1)}>
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <h1>Kennel</h1>
                    </div>
                </div>
                <div className="search-details-container">
                    <div className="search-details-empty">
                        <i className="bi bi-exclamation-circle"></i>
                        <p>No booking details available.</p>
                        <button onClick={() => navigate(-1)}>Go Back</button>
                    </div>
                </div>
            </div>
        );
    }

    const { kennel, room_types } = booking;
    const petCount = parseInt(booking.pet_count) ?? 1;
    const images = Array.isArray(kennel.images) ? kennel.images : [];

    const getNumberOfDays = () => {
        const checkin = new Date(booking.check_in);
        const checkout = new Date(booking.check_out);
        const diffTime = Math.abs(checkout - checkin);
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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

    const handlePetClick = (id) => {
        setSelectedPets((prev) => {
            if (prev.includes(id)) {
                return prev.filter((p) => p !== id);
            }
            if (prev.length < petCount) {
                return [...prev, id];
            }
            const [, ...rest] = prev;
            return [...rest, id];
        });
    };

    return (
        <div className="search-details-page">
            {/* Header */}
            <div className="search-results-header">
                <div className="search-results-header-content">
                    <button className="search-back-btn" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h1>{kennel.kennel_name}</h1>
                </div>
            </div>

            <div className="search-details-container">
                {/* Image Carousel */}
                <div className="search-details-carousel" onClick={(e) => e.stopPropagation()}>
                    {images.length > 0 ? (
                        <div
                            id={`carousel-${kennelId}`}
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
                                        data-bs-target={`#carousel-${kennelId}`}
                                        data-bs-slide-to={idx}
                                        className={idx === 0 ? "active" : ""}
                                        aria-current={idx === 0 ? "true" : undefined}
                                        aria-label={`Slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                            <div className="carousel-inner">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`carousel-item${idx === 0 ? " active" : ""}`}
                                    >
                                        <img src={img} alt={`Slide ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="search-details-no-image">
                            <i className="bi bi-image"></i>
                            <span>No Images Available</span>
                        </div>
                    )}
                </div>

                {/* Kennel Info */}
                <div className="search-details-info">
                    <h2 className="search-details-title">{kennel.kennel_name}</h2>
                    
                    <div className="search-details-meta">
                        <div className="search-details-meta-item">
                            <i className="bi bi-calendar-check"></i>
                            <span>{booking.check_in} → {booking.check_out}</span>
                        </div>
                        <div className="search-details-meta-item">
                            <i className="bi bi-moon-stars"></i>
                            <span>{getNumberOfDays()} {getNumberOfDays() === 1 ? 'night' : 'nights'}</span>
                        </div>
                        <div className="search-details-meta-item">
                            <i className="bi bi-heart"></i>
                            <span>{petCount} {petCount === 1 ? 'pet' : 'pets'}</span>
                        </div>
                    </div>
                </div>

                {/* Features */}
                {Array.isArray(kennel.features) && kennel.features.length > 0 && (
                    <div className="search-details-section">
                        <div className="search-details-section-header">
                            <i className="bi bi-stars"></i>
                            <h3>Features & Amenities</h3>
                        </div>
                        <div className="search-details-features">
                            {kennel.features.map((feat, idx) => (
                                <span key={idx} className="search-details-feature-tag">
                                    {feat}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pet Selection */}
                <div className="search-details-section">
                    <div className="search-details-section-header">
                        <i className="bi bi-heart-fill"></i>
                        <h3>Select Your {petCount === 1 ? 'Pet' : 'Pets'}</h3>
                    </div>
                    <p className="search-details-section-subtitle">
                        {selectedPets.length === petCount 
                            ? `✓ ${petCount} ${petCount === 1 ? 'pet' : 'pets'} selected` 
                            : `Choose ${petCount} ${petCount === 1 ? 'pet' : 'pets'} for this booking`}
                    </p>

                    {isFetchingPets ? (
                        <div className="search-details-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : petList.length === 0 ? (
                        <div className="search-details-no-pets">
                            <i className="bi bi-emoji-frown"></i>
                            <p>You haven't added any pets yet.</p>
                            <div className="search-details-add-wrapper">
                                <button
                                    className="search-details-pet-add"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <i className="bi bi-plus"></i>
                                </button>
                                <span>Add a Pet</span>
                            </div>
                        </div>
                    ) : (
                        <div className="search-details-pets">
                            {petList.map((pet) => {
                                const isSelected = selectedPets.includes(pet.id);
                                return (
                                    <button
                                        key={pet.id}
                                        className={`search-details-pet-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handlePetClick(pet.id)}
                                    >
                                        <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'}`}></i>
                                        {pet.name}
                                    </button>
                                );
                            })}
                            <button
                                className="search-details-pet-add"
                                onClick={() => setShowAddModal(true)}
                            >
                                <i className="bi bi-plus"></i>
                            </button>
                        </div>
                    )}
                </div>

                {/* Room Types */}
                <div className="search-details-section">
                    <div className="search-details-section-header">
                        <i className="bi bi-door-open-fill"></i>
                        <h3>Choose a Room</h3>
                    </div>
                    <div className="search-details-rooms">
                        {Array.isArray(room_types) &&
                            room_types.map((room) => {
                                const isAvailable = room.available_rooms >= petCount;
                                const price = calculateRoomPrice(room);
                                return (
                                    <div 
                                        key={room.room_type_id} 
                                        className={`search-details-room-card ${!isAvailable ? 'sold-out' : ''}`}
                                    >
                                        <div className="search-details-room-header">
                                            <h4>{room.room_type}</h4>
                                            <span className={`search-details-room-availability ${isAvailable ? 'available' : 'unavailable'}`}>
                                                {isAvailable ? `${room.available_rooms} available` : 'Sold Out'}
                                            </span>
                                        </div>
                                        
                                        <div className="search-details-room-prices">
                                            <div className="search-details-room-price-item">
                                                <span>Small Breed</span>
                                                <span>₹{room.price_small}/day</span>
                                            </div>
                                            <div className="search-details-room-price-item">
                                                <span>Medium Breed</span>
                                                <span>₹{room.price_medium}/day</span>
                                            </div>
                                            <div className="search-details-room-price-item">
                                                <span>Large Breed</span>
                                                <span>₹{room.price_large}/day</span>
                                            </div>
                                        </div>

                                        <button
                                            className="search-details-room-btn"
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
                                                    const perDay = Number(room?.[priceKey]) || 0;
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
                                            {isAvailable ? (
                                                <>
                                                    Continue
                                                    {selectedPets.length > 0 && <span className="search-details-room-total">₹{price}</span>}
                                                </>
                                            ) : (
                                                'Sold Out'
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Add Pet Modal */}
            {showAddModal && (
                <AddPetModal
                    limit={petCount - selectedPets.length}
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => {
                        setShowAddModal(false);
                        loadPets();
                    }}
                />
            )}
        </div>
    );
}