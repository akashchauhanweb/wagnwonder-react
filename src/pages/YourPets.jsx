import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { imageCompressor } from "../assets/js/imageCompressor";
import { useLoading } from "../contexts/LoadingContext";

const YourPets = () => {
    const [pets, setPets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const { setLoading } = useLoading();
    const [breedOptions, setBreedOptions] = useState([]);
    const [editPetId, setEditPetId] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [fetchingPets, setFetchingPets] = useState(true);

    const breeds = {
        dog: ["Labrador", "German Shepherd", "Golden Retriever", "Poodle", "Bulldog", "Beagle"],
        cat: ["Indian", "Persian", "Siamese", "Maine Coon", "Ragdoll", "Bengal", "Sphynx", "British Shorthair", "Scottish Fold", "Abyssinian", "Norwegian Forest Cat", "American Shorthair", "Russian Blue", "Devon Rex"]
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        setBreedOptions(breeds[type] || []);
    };

    const handleAddPet = async (e) => {
        setLoading(true);
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            let vaccineCardFile = formData.get("vaccine_card");
            let photoFile = formData.get("photo");
            vaccineCardFile = await imageCompressor(vaccineCardFile);
            photoFile = await imageCompressor(photoFile);

            const vaccineCardPath = vaccineCardFile
                ? await uploadImageToS3(vaccineCardFile, "pets/")
                : "";
            const photoPath =
                photoFile && photoFile.size > 0
                    ? await uploadImageToS3(photoFile, "pets/")
                    : "";

            const payload = {
                action: "ADD_PET",
                session_id: localStorage.getItem("session_id"),
                user_id: JSON.parse(localStorage.getItem("user_data"))["id"],
                name: formData.get("name"),
                age: parseInt(formData.get("age")),
                type: formData.get("type"),
                breed: formData.get("breed"),
                weight: formData.get("weight"),
                gender: formData.get("gender"),
                aggression: formData.get("aggression"),
                vaccine_card_path: vaccineCardPath,
                photo_path: photoPath,
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
                form.reset();
                setShowForm(false);
                fetchPets();
            } else {
                alert("Failed to add pet: " + result.message);
            }
        } catch (error) {
            console.error("Error adding pet:", error);
            alert("Something went wrong while adding your pet.");
        }
        setLoading(false);
    };

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

    const handleSaveEdit = async (e, petId) => {
        e.preventDefault();
        setLoading(true);
        let vaccineCardPath = editFormData.vaccine_card_path || "";
        let photoPath = editFormData.photo_path || "";

        if (editFormData.vaccine_card instanceof File) {
            try {
                const vaccineCardFile = await imageCompressor(editFormData.vaccine_card);
                vaccineCardPath = await uploadImageToS3(vaccineCardFile, "pets/");
            } catch (error) {
                console.error("Vaccine card compression failed:", error);
                alert("Failed to upload vaccine card image.");
                setLoading(false);
                return;
            }
        }

        if (editFormData.photo instanceof File) {
            try {
                const photoFile = await imageCompressor(editFormData.photo);
                photoPath = await uploadImageToS3(photoFile, "pets/");
            } catch (error) {
                console.error("Photo compression failed:", error);
                alert("Failed to upload pet photo.");
                setLoading(false);
                return;
            }
        }

        const payload = {
            action: "EDIT_PET",
            session_id: localStorage.getItem("session_id"),
            user_id: JSON.parse(localStorage.getItem("user_data"))["id"],
            pet_id: petId,
            name: editFormData.name,
            age: parseInt(editFormData.age),
            type: editFormData.type,
            breed: editFormData.breed,
            weight: editFormData.weight,
            gender: editFormData.gender,
            aggression: editFormData.aggression,
            vaccine_card_path: vaccineCardPath,
            photo_path: photoPath,
        };

        try {
            const result = await callServicesApi(payload);

            if (!result.success && result.status_code === 498) {
                alert("Session expired. Please login again.");
                localStorage.clear();
                window.location.href = "/login";
                return;
            }

            if (result.success) {
                localStorage.removeItem("pets");
                setEditPetId(null);
                setEditFormData({});
                fetchPets();
            } else {
                alert("Failed to update pet: " + result.message);
            }
        } catch (error) {
            console.error("Error updating pet:", error);
            alert("Something went wrong while editing your pet.");
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

    const startEdit = (pet) => {
        setEditPetId(pet.id);
        setBreedOptions(breeds[pet.type] || []);
        setEditFormData({
            ...pet,
            vaccine_card_path: pet.vaccine_card_path || "",
            photo_path: pet.photo_path || "",
        });
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

            {/* Add Pet Form */}
            {showForm && (
                <div className="pets-form-card">
                    <div className="pets-form-header">
                        <h3>Add New Pet</h3>
                        <button className="pets-form-close" onClick={() => { setShowForm(false); window.scrollTo(0, 0); }}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <form onSubmit={handleAddPet}>
                        <div className="pets-form-grid">
                            <div className="pets-field">
                                <label>Pet Name *</label>
                                <input type="text" name="name" placeholder="Enter pet name" required />
                            </div>
                            <div className="pets-field">
                                <label>Age (years) *</label>
                                <input type="number" name="age" min="0" max="30" placeholder="Age" required />
                            </div>
                            <div className="pets-field">
                                <label>Type *</label>
                                <select name="type" onChange={handleTypeChange} required>
                                    <option value="">Select Type</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="bird">Bird</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="pets-field">
                                <label>Breed *</label>
                                <select name="breed" required disabled={breedOptions.length === 0}>
                                    <option value="">Select Breed</option>
                                    {breedOptions.map((breed, i) => (
                                        <option key={i} value={breed}>{breed}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pets-field">
                                <label>Weight *</label>
                                <select name="weight" required>
                                    <option value="">Select Weight</option>
                                    <option value="below 15kgs">Below 15 kgs</option>
                                    <option value="above 15kgs and below 40kgs">15 - 40 kgs</option>
                                    <option value="above 40kgs">Above 40 kgs</option>
                                </select>
                            </div>
                            <div className="pets-field">
                                <label>Gender *</label>
                                <select name="gender" required>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div className="pets-field">
                                <label>Aggression Level *</label>
                                <select name="aggression" required>
                                    <option value="">Select Level</option>
                                    <option value="low">Low</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="pets-field">
                                <label>Vaccine Card *</label>
                                <input type="file" name="vaccine_card" accept="image/*" required />
                            </div>
                            <div className="pets-field full-width">
                                <label>Pet Photo (Optional)</label>
                                <input type="file" name="photo" accept="image/*" />
                            </div>
                        </div>
                        <div className="pets-form-actions">
                            <button type="submit" className="pets-submit-btn">
                                <i className="bi bi-plus-circle"></i>
                                Add Pet
                            </button>
                            <button type="button" className="pets-cancel-btn" onClick={() => { setShowForm(false); window.scrollTo(0, 0); }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
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
                        <div key={pet.id} className={`pet-card ${editPetId === pet.id ? 'editing' : ''}`}>
                            {editPetId === pet.id ? (
                                /* Edit Mode */
                                <form onSubmit={(e) => handleSaveEdit(e, pet.id)} className="pet-edit-form">
                                    <div className="pet-edit-header">
                                        <h4>Edit Pet</h4>
                                        <button type="button" onClick={() => { setEditPetId(null); window.scrollTo(0, 0); }}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                    <div className="pets-form-grid">
                                        <div className="pets-field">
                                            <label>Name</label>
                                            <input
                                                type="text"
                                                value={editFormData.name || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="pets-field">
                                            <label>Age</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="30"
                                                value={editFormData.age || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                                            />
                                        </div>
                                        <div className="pets-field">
                                            <label>Type</label>
                                            <select
                                                value={editFormData.type || ""}
                                                onChange={(e) => {
                                                    const newType = e.target.value;
                                                    setEditFormData({ ...editFormData, type: newType, breed: "" });
                                                    setBreedOptions(breeds[newType] || []);
                                                }}
                                            >
                                                <option value="">Select Type</option>
                                                <option value="dog">Dog</option>
                                                <option value="cat">Cat</option>
                                                <option value="bird">Bird</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="pets-field">
                                            <label>Breed</label>
                                            <select
                                                value={editFormData.breed || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, breed: e.target.value })}
                                                disabled={!(editFormData.type === "dog" || editFormData.type === "cat")}
                                            >
                                                <option value="">Select Breed</option>
                                                {breedOptions.map((breed, i) => (
                                                    <option key={i} value={breed}>{breed}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="pets-field">
                                            <label>Weight</label>
                                            <select
                                                value={editFormData.weight || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                                            >
                                                <option value="">Select Weight</option>
                                                <option value="below 15kgs">Below 15 kgs</option>
                                                <option value="above 15kgs and below 40kgs">15 - 40 kgs</option>
                                                <option value="above 40kgs">Above 40 kgs</option>
                                            </select>
                                        </div>
                                        <div className="pets-field">
                                            <label>Gender</label>
                                            <select
                                                value={editFormData.gender || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                        </div>
                                        <div className="pets-field">
                                            <label>Aggression</label>
                                            <select
                                                value={editFormData.aggression || ""}
                                                onChange={(e) => setEditFormData({ ...editFormData, aggression: e.target.value })}
                                            >
                                                <option value="">Select Level</option>
                                                <option value="low">Low</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        <div className="pets-field">
                                            {editFormData.vaccine_card_path ? (
                                                <div className="pets-image-preview">
                                                    <label>Vaccine Card</label>
                                                    <img src={editFormData.vaccine_card_path} alt="Vaccine Card" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditFormData({ ...editFormData, vaccine_card_path: "", vaccine_card: null })}
                                                    >
                                                        <i className="bi bi-trash"></i> Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <label>Vaccine Card</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setEditFormData({ ...editFormData, vaccine_card: e.target.files[0] })}
                                                    />
                                                </>
                                            )}
                                        </div>
                                        <div className="pets-field">
                                            {editFormData.photo_path ? (
                                                <div className="pets-image-preview">
                                                    <label>Pet Photo</label>
                                                    <img src={editFormData.photo_path} alt="Pet" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditFormData({ ...editFormData, photo_path: "", photo: null })}
                                                    >
                                                        <i className="bi bi-trash"></i> Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <label>Pet Photo</label>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => setEditFormData({ ...editFormData, photo: e.target.files[0] })}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pets-form-actions">
                                        <button type="submit" className="pets-submit-btn">Save Changes</button>
                                        <button type="button" className="pets-cancel-btn" onClick={() => { setEditPetId(null); window.scrollTo(0, 0); }}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                /* Display Mode */
                                <>
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
                                            <button onClick={() => startEdit(pet)} title="Edit">
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
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YourPets;