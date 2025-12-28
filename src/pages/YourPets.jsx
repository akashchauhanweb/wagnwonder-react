import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";
import AddPetModal from "../assets/components/AddPetModal";
import EditPetModal from "../assets/components/EditPetModal";

const YourPets = () => {
    const [pets, setPets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const { setLoading } = useLoading();
    const [editPetId, setEditPetId] = useState(null);
    const [fetchingPets, setFetchingPets] = useState(true);

    const handleDeletePet = async (petId) => {
        if (!window.confirm("Are you sure you want to delete this pet?")) return;
        setLoading(true);

        try {
            const payload = {
                action: "DELETE_PET",
                session_id: localStorage.getItem("session_id"),
                pet_id: petId,
            };
            const result = await callServicesApi(payload);

            if (!result.success && result.status_code === 498) {
                alert("Session expired. Please login again.");
                localStorage.clear();
                window.location.href = "/login";
                return;
            }

            if (result.success) {
                localStorage.removeItem("pets");
                fetchPets();
            } else {
                alert("Failed to delete pet: " + result.message);
            }
        } catch (error) {
            console.error("Error deleting pet:", error);
            alert("Something went wrong while deleting your pet.");
        }
        setLoading(false);
    };

    useEffect(() => {
        const cachedPets = localStorage.getItem("pets");
        if (cachedPets) {
            const parsed = JSON.parse(cachedPets);
            setFetchingPets(false);
            setPets(parsed);
        } else {
            fetchPets();
        }
    }, []);

    const fetchPets = async () => {
        setFetchingPets(true);
        try {
            const response = await callServicesApi({
                action: "FETCH_PET_LIST",
                session_id: localStorage.getItem("session_id")
            });
            localStorage.setItem("pets", JSON.stringify(response.pet_list));
            setPets(response.pet_list);
        } catch (error) {
            console.error("Error fetching pets:", error);
        }
        setFetchingPets(false);
    };

    const handlePetSaved = () => {
        localStorage.removeItem("pets");
        setShowForm(false);
        fetchPets();
    };

    const handleEditSaved = () => {
        localStorage.removeItem("pets");
        setEditPetId(null);
        fetchPets();
    };

    return (
        <div className="your-pets">
            <div className="pets-header">
                <h2>Your Pets</h2>
                {!showForm && (
                    <button className="pets-add-btn" onClick={() => setShowForm(true)}>
                        <i className="bi bi-plus-lg"></i>
                        Add Pet
                    </button>
                )}
            </div>

            {/* Add Pet Modal */}
            {showForm && (
                <AddPetModal
                    onClose={() => setShowForm(false)}
                    onSaved={handlePetSaved}
                />
            )}

            {/* Pet List */}
            {fetchingPets ? (
                <div className="pets-loading">
                    <div className="spinner-border" role="status" />
                </div>
            ) : pets.length === 0 ? (
                <div className="pets-empty">
                    <div className="pets-empty-icon">
                        <i className="bi bi-heart"></i>
                    </div>
                    <h3>No pets yet</h3>
                    <p>Add your furry friends to get started with bookings.</p>
                    <button onClick={() => setShowForm(true)}>
                        <i className="bi bi-plus-lg"></i>
                        Add Your First Pet
                    </button>
                </div>
            ) : (
                <div className="pets-grid">
                    {pets.map((pet) => (
                        <div key={pet.id} className="pet-card">
                            <div className="pet-card-header">
                                <div className="pet-avatar">
                                    {pet.photo_path ? (
                                        <img src={pet.photo_path} alt={pet.name} />
                                    ) : (
                                        <span>{pet.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="pet-header-info">
                                    <h3>{pet.name}</h3>
                                    <span className="pet-type-badge">{pet.type}</span>
                                </div>
                                <div className="pet-actions">
                                    <button onClick={() => setEditPetId(pet.id)} title="Edit">
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button onClick={() => handleDeletePet(pet.id)} title="Delete" className="delete">
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="pet-details">
                                <div className="pet-detail-item">
                                    <span className="label">Breed</span>
                                    <span className="value">{pet.breed}</span>
                                </div>
                                <div className="pet-detail-item">
                                    <span className="label">Age</span>
                                    <span className="value">{pet.age} {pet.age === 1 ? 'year' : 'years'}</span>
                                </div>
                                <div className="pet-detail-item">
                                    <span className="label">Gender</span>
                                    <span className="value">{pet.gender}</span>
                                </div>
                                <div className="pet-detail-item">
                                    <span className="label">Weight</span>
                                    <span className="value">{pet.weight}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Pet Modal */}
            {editPetId && (
                <EditPetModal
                    pet={pets.find(p => p.id === editPetId)}
                    onClose={() => setEditPetId(null)}
                    onSaved={handleEditSaved}
                />
            )}
        </div>
    );
};

export default YourPets;