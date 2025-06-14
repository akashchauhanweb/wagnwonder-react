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
            // Get files
            let vaccineCardFile = formData.get("vaccine_card");
            let photoFile = formData.get("photo");
            vaccineCardFile = await imageCompressor(vaccineCardFile);
            photoFile = await imageCompressor(photoFile);
            // Upload images
            const vaccineCardPath = vaccineCardFile
                ? await uploadImageToS3(vaccineCardFile, "pets/")
                : "";
            const photoPath =
                photoFile && photoFile.size > 0
                    ? await uploadImageToS3(photoFile, "pets/")
                    : "";

            // Prepare payload
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
            const result = await callServicesApi(payload)
            if (!result.success && result.status_code === 498) {
                alert("Session expired. Please login again.");
                localStorage.clear();
                window.location.href = "/login.html";
                return;
            }

            if (result.success) {
                alert("Pet added successfully!");
                localStorage.removeItem("pets");
                form.reset();
                setShowForm(false);
                fetchPets(); // refresh pet list
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
        setLoading(true);
        if (!window.confirm("Are you sure you want to delete this pet?")) return;

        try {
            const payload = {
                action: "DELETE_PET",
                session_id: localStorage.getItem("session_id"),
                pet_id: petId,
            };
            console.log(payload);
            const result = await callServicesApi(payload);

            if (!result.success && result.status_code === 498) {
                alert("Session expired. Please login again.");
                localStorage.clear();
                window.location.href = "/login.html";
                return;
            }

            if (result.success) {
                alert("Pet deleted successfully!");
                localStorage.removeItem("pets");
                fetchPets(); // refresh list
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

        // 🧠 Upload if new file selected
        if (editFormData.vaccine_card instanceof File) {
            try {
                const vaccineCardFile = await imageCompressor(editFormData.vaccine_card);
                vaccineCardPath = await uploadImageToS3(vaccineCardFile, "pets/");
            } catch (error) {
                console.error("Vaccine card compression failed:", error);
                alert("Failed to upload vaccine card image.");
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
            console.log(payload);
            const result = await callServicesApi(payload);

            if (!result.success && result.status_code === 498) {
                alert("Session expired. Please login again.");
                localStorage.clear();
                window.location.href = "/login.html";
                return;
            }

            if (result.success) {
                alert("Pet updated successfully!");
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
            // Replace this with actual API call later
            const response = await callServicesApi({
                action: "FETCH_PET_LIST",
                session_id: localStorage.getItem("session_id")
            })
            localStorage.setItem("pets", JSON.stringify(response.pet_list));
            console.log(response.pet_list);
            setPets(response.pet_list);
        } catch (error) {
            console.error("Error fetching pets:", error);
        }
        setFetchingPets(false);
    };

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                {/* <h2 className="mb-0">Your Pets</h2> */}
                <h3 className="mb-4 fw-bold">Your Pets</h3>
                <div className="position-relative">
                    <div className="psition-absolute top-0 end-0 pe-2 pt-1">
                        {showForm ? (
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>

                        ) : (
                            <i
                                className="bi bi-plus-circle me-2 fs-4"
                                onClick={() => setShowForm(!showForm)}
                            ></i>

                        )}
                    </div>
                </div>
            </div>

            {showForm && (
                <form className="border rounded p-4 mb-4" onSubmit={handleAddPet}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="name" className="form-label">Pet Name</label>
                            <input type="text" className="form-control" id="name" name="name" required />
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="age" className="form-label">Age (in years)</label>
                            <input type="number" className="form-control" id="age" name="age" min="0" max="30" required />
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="type" className="form-label">Type</label>
                            <select className="form-select" id="type" name="type" onChange={handleTypeChange} required>
                                <option value="">Select Type</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="bird">Bird</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="breed" className="form-label">Breed</label>
                            <select
                                className="form-select"
                                id="breed"
                                name="breed"
                                required
                                disabled={breedOptions.length === 0}
                            >
                                <option value="">Select Breed</option>
                                {breedOptions.map((breed, i) => (
                                    <option key={i} value={breed}>{breed}</option>
                                ))}
                            </select>
                        </div>


                        <div className="col-md-6">
                            <label htmlFor="weight" className="form-label">Weight (kg)</label>
                            <select className="form-select" id="weight" name="weight" required>
                                <option value="">Select Weight</option>
                                <option value="below 15kgs">below 15kgs</option>
                                <option value="above 15kgs and below 40kgs">15-40kgs</option>
                                <option value="above 40kgs">above 40kgs</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="gender" className="form-label">Gender</label>
                            <select className="form-select" id="gender" name="gender" required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="aggression" className="form-label">Aggression Level</label>
                            <select className="form-select" id="aggression" name="aggression" required>
                                <option value="">Select Level</option>
                                <option value="low">Low</option>
                                <option value="moderate">Moderate</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="vaccine_card" className="form-label">Vaccine Card (Image)</label>
                            <input type="file" className="form-control" id="vaccine_card" name="vaccine_card" accept="image/*" required />
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="photo" className="form-label">Pet Photo (Optional)</label>
                            <input type="file" className="form-control" id="photo" name="photo" accept="image/*" />
                        </div>
                    </div>

                    <div className="mt-4 col-12">
                        <button
                            type="submit"
                            className="btn w-100"
                            style={{ backgroundColor: "#471915", color: "#fff" }}
                        >
                            Add Pet
                        </button>
                    </div>
                </form>

            )}


            {fetchingPets ? (
                <div className="text-center my-4">
                    <div className="spinner-border" role="status" style={{ color: "#471915" }} />
                </div>
            ) : pets.length === 0 ? (
                <div className="alert alert-info">You have not added any pets yet.</div>
            ) : (
                <div className="row g-4">
                    {pets.map((pet) => (
                        <div className="col-lg-6" key={pet.id}>
                            <div
                                className={`card shadow-sm position-relative p-4`}
                                style={editPetId === pet.pet_id ? { minHeight: "auto", paddingBottom: "2rem" } : {}}
                            >
                                {/* Name + Icons */}
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">

                                    <div className="d-flex align-items-center">
                                        {pet.photo_path ? (
                                            <img
                                                src={pet.photo_path}
                                                alt={pet.name}
                                                className="rounded-circle me-3"
                                                style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                                                style={{ width: "50px", height: "50px", fontSize: "20px" }}
                                            >
                                                {pet.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <h4 className="mb-0">{pet.name}</h4>
                                    </div>

                                    <div className="d-flex align-items-center gap-0">
                                        {editPetId !== pet.id && (
                                            <i
                                                className="bi bi-pencil-square fs-5 me-3 text-dark"
                                                role="button"
                                                title="Edit"
                                                onClick={() => {
                                                    setEditPetId(pet.id);
                                                    setBreedOptions(breeds[pet.type]);
                                                    setEditFormData({
                                                        ...pet,
                                                        vaccine_card_path: pet.vaccine_card_path || "",
                                                        photo_path: pet.photo_path || "",
                                                    });
                                                }}
                                            ></i>
                                        )}

                                        <i
                                            className="bi bi-trash"
                                            role="button"
                                            title="Delete"
                                            style={{ fontSize: "1.3rem", color: "black", backgroundColor: "white", borderRadius: "4px", padding: "4px" }}
                                            onClick={() => handleDeletePet(pet.id)}
                                        ></i>
                                    </div>

                                </div>


                                {/* Info */}
                                <div className="mt-4">
                                    <p className="mb-1 text-capitalize"><strong>Type:</strong> {pet.type}</p>
                                    <p className="mb-1 text-capitalize"><strong>Breed:</strong> {pet.breed}</p>
                                    <p className="mb-1 text-capitalize"><strong>Age:</strong> {pet.age}</p>
                                    <p className="mb-1 text-capitalize"><strong>Gender:</strong> {pet.gender}</p>
                                    {/* Add more fields as needed */}
                                </div>
                                {editPetId === pet.id && (
                                    <form onSubmit={(e) => handleSaveEdit(e, pet.id)} className="mt-3 border-top pt-3">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editFormData.name || ""}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Age</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    max="30"
                                                    value={editFormData.age || ""}
                                                    onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Type</label>
                                                <select
                                                    className="form-select"
                                                    value={editFormData.type || ""}
                                                    onChange={(e) => {
                                                        const newType = e.target.value;
                                                        setEditFormData({ ...editFormData, type: newType, breed: "" });
                                                        const breeds = {
                                                            dog: ["Labrador", "German Shepherd", "Golden Retriever", "Poodle", "Bulldog", "Beagle"],
                                                            cat: ["Indian", "Persian", "Siamese", "Maine Coon", "Ragdoll", "Bengal", "Sphynx", "British Shorthair", "Scottish Fold", "Abyssinian", "Norwegian Forest Cat", "American Shorthair", "Russian Blue", "Devon Rex"]
                                                        };
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

                                            <div className="col-md-6">
                                                <label className="form-label">Breed</label>
                                                <select
                                                    className="form-select"
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

                                            <div className="col-md-6">
                                                <label className="form-label">Weight</label>
                                                <select
                                                    className="form-select"
                                                    value={editFormData.weight || ""}
                                                    onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                                                >
                                                    <option value="">Select Weight</option>
                                                    <option value="below 15kgs">below 15kgs</option>
                                                    <option value="above 15kgs and below 40kgs">15-40kgs</option>
                                                    <option value="above 40kgs">above 40kgs</option>
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Gender</label>
                                                <select
                                                    className="form-select"
                                                    value={editFormData.gender || ""}
                                                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Aggression Level</label>
                                                <select
                                                    className="form-select"
                                                    value={editFormData.aggression || ""}
                                                    onChange={(e) => setEditFormData({ ...editFormData, aggression: e.target.value })}
                                                >
                                                    <option value="">Select Level</option>
                                                    <option value="low">Low</option>
                                                    <option value="moderate">Moderate</option>
                                                    <option value="high">High</option>
                                                </select>
                                            </div>

                                            {editFormData.vaccine_card_path ? (
                                                <div className="col-md-6">
                                                    <label className="form-label d-flex justify-content-between">
                                                        <span>Current Vaccine Card</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger ms-2"
                                                            onClick={() =>
                                                                setEditFormData({
                                                                    ...editFormData,
                                                                    vaccine_card_path: "",
                                                                    vaccine_card: null
                                                                })
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </label>
                                                    <img
                                                        src={editFormData.vaccine_card_path}
                                                        alt="Vaccine Card"
                                                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px" }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="col-md-6">
                                                    <label className="form-label">Upload New Vaccine Card</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            setEditFormData({ ...editFormData, vaccine_card: e.target.files[0] })
                                                        }
                                                    />
                                                </div>
                                            )}


                                            {editFormData.photo_path ? (
                                                <div className="col-md-6">
                                                    <label className="form-label d-flex justify-content-between">
                                                        <span>Current Pet Photo</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger ms-2"
                                                            onClick={() =>
                                                                setEditFormData({
                                                                    ...editFormData,
                                                                    photo_path: "", // clear existing image
                                                                    photo: null     // clear file too
                                                                })
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </label>
                                                    <img
                                                        src={editFormData.photo_path}
                                                        alt="Pet"
                                                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px" }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="col-md-6">
                                                    <label className="form-label">Upload New Pet Photo</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            setEditFormData({ ...editFormData, photo: e.target.files[0] })
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div className="col-12 text-end">
                                                <button
                                                    type="submit"
                                                    className="btn btn-sm me-2"
                                                    style={{ backgroundColor: "#471915", color: "#fff" }}
                                                >
                                                    Save
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setEditPetId(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}


                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

    );
};

export default YourPets;
