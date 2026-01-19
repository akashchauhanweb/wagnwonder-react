import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { imageCompressor } from "../assets/js/imageCompressor";

const ManagePets = () => {
    const [activeTab, setActiveTab] = useState("list");
    const [pets, setPets] = useState([]);
    const [users, setUsers] = useState([]);
    const [fetchingPets, setFetchingPets] = useState(true);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [breedFilter, setBreedFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [weightFilter, setWeightFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [aggressionFilter, setAggressionFilter] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [showPetModal, setShowPetModal] = useState(false);

    // Form state for adding pet
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        birthMonth: "",
        birthYear: "",
        type: "",
        breed: "",
        weight: "",
        gender: "",
        aggression: "",
        vaccine_card: null,
        photo: null,
        owner_id: ""
    });
    const [ageInputType, setAgeInputType] = useState("age");
    const [breedOptions, setBreedOptions] = useState([]);

    const breeds = {
        dog: [
            'Labrador', 'Golden Retriever', 'German Shepherd', 'Beagle', 'Rottweiler',
            'Shih Tzu', 'Pomeranian', 'Cocker Spaniel', 'Boxer', 'Siberian Husky',
            'Pug', 'Indie', 'Great Dane', 'Dachshund', 'Doberman', 'Tibetan Mastiff',
            'Rajapalayam', 'Poodle', 'Basset Hound', 'Gaddi Kutta', 'Bullmastiff',
            'Saint Bernard', 'Chow Chow', 'Border Collie', 'Alaskan Malamute',
            'Kanni', 'Jonangi', 'Pandikona', 'Chippiparai', 'Banjara Hound', 'Other'
        ],
        cat: [
            'Indian', 'Persian', 'Siamese', 'Maine Coon', 'Ragdoll', 'Bengal',
            'Sphynx', 'British Shorthair', 'Scottish Fold', 'Abyssinian',
            'Norwegian Forest Cat', 'American Shorthair', 'Russian Blue', 'Devon Rex'
        ],
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 31 }, (_, i) => currentYear - i);
    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' },
        { value: 3, label: 'March' }, { value: 4, label: 'April' },
        { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' },
        { value: 9, label: 'September' }, { value: 10, label: 'October' },
        { value: 11, label: 'November' }, { value: 12, label: 'December' },
    ];

    useEffect(() => {
        fetchPets();
        fetchUsers();
    }, []);

    useEffect(() => {
        setBreedOptions(breeds[formData.type] || []);
        setFormData(prev => ({ ...prev, breed: "" }));
    }, [formData.type]);

    const fetchPets = async () => {
        setFetchingPets(true);
        try {
            const res = await callServicesApi({
                action: "GET_ALL_PETS",
                session_id: localStorage.getItem("session_id")
            });
            if (res?.success) {
                setPets(res.data || []);
            } else if (res?.status_code === 498) {
                localStorage.clear();
                window.location.href = "/login";
            }
        } catch (err) {
            console.error("Error fetching pets:", err);
        }
        setFetchingPets(false);
    };

    const fetchUsers = async () => {
        setFetchingUsers(true);
        try {
            const res = await callServicesApi({
                action: "GET_ALL_USERS",
                session_id: localStorage.getItem("session_id")
            });
            if (res?.success) {
                setUsers(res.data || []);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
        setFetchingUsers(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this pet?")) return;
        try {
            const res = await callServicesApi({
                action: "DELETE_PET",
                session_id: localStorage.getItem("session_id"),
                pet_id: id
            });
            if (res?.success) {
                setSuccessMsg("Pet deleted successfully.");
                fetchPets();
                setTimeout(() => setSuccessMsg(""), 3000);
            } else {
                setErrorMsg(res?.message || "Failed to delete pet.");
                setTimeout(() => setErrorMsg(""), 3000);
            }
        } catch {
            setErrorMsg("Error deleting pet.");
            setTimeout(() => setErrorMsg(""), 3000);
        }
    };

    const calculateAge = () => {
        if (!formData.birthMonth || !formData.birthYear) return null;
        const today = new Date();
        const birthDate = new Date(formData.birthYear, formData.birthMonth - 1);
        let yrs = today.getFullYear() - birthDate.getFullYear();
        let mos = today.getMonth() - birthDate.getMonth();
        if (mos < 0) { yrs--; mos += 12; }
        if (yrs < 1) return `${mos} month${mos !== 1 ? 's' : ''}`;
        return `${yrs} year${yrs !== 1 ? 's' : ''}${mos > 0 ? ` ${mos} mo` : ''}`;
    };

    const getAgeInYears = () => {
        if (ageInputType === 'age') return parseInt(formData.age) || 0;
        if (!formData.birthMonth || !formData.birthYear) return 0;
        const today = new Date();
        const birthDate = new Date(formData.birthYear, formData.birthMonth - 1);
        let yrs = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() - birthDate.getMonth() < 0) yrs--;
        return Math.max(0, yrs);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setErrorMsg("");
        if (files) setFormData(prev => ({ ...prev, [name]: files[0] }));
        else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.owner_id) {
            setErrorMsg("Please select an owner.");
            return;
        }
        setSubmitting(true);
        setErrorMsg("");

        try {
            let vaccinePath = formData.vaccine_card 
                ? await uploadImageToS3(await imageCompressor(formData.vaccine_card), 'pets/') 
                : '';
            let photoPath = formData.photo 
                ? await uploadImageToS3(await imageCompressor(formData.photo), 'pets/') 
                : '';

            const payload = {
                action: 'ADD_PET',
                session_id: localStorage.getItem('session_id'),
                user_id: parseInt(formData.owner_id),
                name: formData.name,
                age: getAgeInYears(),
                type: formData.type,
                breed: formData.breed,
                weight: formData.weight,
                gender: formData.gender,
                aggression: formData.aggression,
                vaccine_card_path: vaccinePath,
                photo_path: photoPath,
            };

            const res = await callServicesApi(payload);
            if (res.success) {
                setSuccessMsg("Pet added successfully.");
                setFormData({
                    name: "", age: "", birthMonth: "", birthYear: "",
                    type: "", breed: "", weight: "", gender: "",
                    aggression: "", vaccine_card: null, photo: null, owner_id: ""
                });
                fetchPets();
                setTimeout(() => setSuccessMsg(""), 3000);
            } else {
                setErrorMsg(res.message || 'Failed to add pet.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Something went wrong. Please try again.');
        }
        setSubmitting(false);
    };

    const getUniqueBreeds = () => {
        const allBreeds = pets.map(p => p.breed).filter(Boolean);
        return [...new Set(allBreeds)].sort();
    };

    const filteredPets = pets.filter(pet => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            pet.name?.toLowerCase().includes(searchLower) ||
            pet.owner_first_name?.toLowerCase().includes(searchLower) ||
            pet.owner_last_name?.toLowerCase().includes(searchLower) ||
            pet.owner_email?.toLowerCase().includes(searchLower) ||
            pet.owner_phone?.includes(searchTerm);
        
        const matchesBreed = !breedFilter || pet.breed === breedFilter;
        const matchesType = !typeFilter || pet.type === typeFilter;
        const matchesWeight = !weightFilter || pet.weight === weightFilter;
        const matchesGender = !genderFilter || pet.gender === genderFilter;
        const matchesAggression = !aggressionFilter || pet.aggression === aggressionFilter;

        return matchesSearch && matchesBreed && matchesType && matchesWeight && matchesGender && matchesAggression;
    });

    const openPetModal = (pet) => {
        setSelectedPet(pet);
        setShowPetModal(true);
    };

    const formatWeight = (weight) => {
        if (weight === "below 15kgs") return "Below 15 kgs";
        if (weight === "above 15kgs and below 40kgs") return "15 - 40 kgs";
        if (weight === "above 40kgs") return "Above 40 kgs";
        return weight;
    };

    return (
        <div className="manage-pets">
            <div className="manage-pets-header">
                <h2>Manage Pets</h2>
                <span className="manage-pets-count">{pets.length} pet{pets.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Submenu Tabs */}
            <div className="manage-users-submenu">
                <button
                    className={`submenu-item ${activeTab === "list" ? "active" : ""}`}
                    onClick={() => setActiveTab("list")}
                >
                    <i className="bi bi-list-ul"></i>
                    List Pets
                </button>
                <button
                    className={`submenu-item ${activeTab === "add" ? "active" : ""}`}
                    onClick={() => setActiveTab("add")}
                >
                    <i className="bi bi-plus-circle"></i>
                    Add Pet
                </button>
            </div>

            {/* Success/Error Messages */}
            {successMsg && (
                <div className="manage-users-alert success">
                    <i className="bi bi-check-circle-fill"></i>
                    {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="manage-users-alert error">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {errorMsg}
                </div>
            )}

            {/* List Pets Tab */}
            {activeTab === "list" && (
                <div className="manage-pets-list-section">
                    {/* Filters */}
                    <div className="manage-pets-filters">
                        <div className="search-box">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search by pet name, owner name, email, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdowns">
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option value="">All Types</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                            </select>
                            <select value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
                                <option value="">All Breeds</option>
                                {getUniqueBreeds().map((breed, idx) => (
                                    <option key={idx} value={breed}>{breed}</option>
                                ))}
                            </select>
                            <select value={weightFilter} onChange={(e) => setWeightFilter(e.target.value)}>
                                <option value="">All Weights</option>
                                <option value="below 15kgs">Below 15 kgs</option>
                                <option value="above 15kgs and below 40kgs">15 - 40 kgs</option>
                                <option value="above 40kgs">Above 40 kgs</option>
                            </select>
                            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                                <option value="">All Genders</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            <select value={aggressionFilter} onChange={(e) => setAggressionFilter(e.target.value)}>
                                <option value="">All Aggression</option>
                                <option value="low">Low</option>
                                <option value="moderate">Moderate</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Pets Table */}
                    {fetchingPets ? (
                        <div className="manage-pets-loading">
                            <div className="spinner-border" role="status"></div>
                        </div>
                    ) : filteredPets.length === 0 ? (
                        <div className="manage-pets-empty">
                            <i className="bi bi-heart-pulse"></i>
                            <h3>No pets found</h3>
                            <p>Try adjusting your filters or add a new pet.</p>
                        </div>
                    ) : (
                        <div className="manage-pets-table-wrapper">
                            <table className="manage-pets-table">
                                <thead>
                                    <tr>
                                        <th>Pet</th>
                                        <th>Type</th>
                                        <th>Breed</th>
                                        <th>Age</th>
                                        <th>Weight</th>
                                        <th>Owner</th>
                                        <th>Contact</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPets.map((pet) => (
                                        <tr key={pet.id} onClick={() => openPetModal(pet)} style={{ cursor: 'pointer' }}>
                                            <td className="pet-name-cell">
                                                <div className="pet-avatar">
                                                    {pet.photo_path ? (
                                                        <img src={pet.photo_path} alt={pet.name} />
                                                    ) : (
                                                        <i className="bi bi-heart-pulse-fill"></i>
                                                    )}
                                                </div>
                                                <span>{pet.name}</span>
                                            </td>
                                            <td className="pet-type">
                                                <span className={`type-badge ${pet.type}`}>
                                                    {pet.type?.charAt(0).toUpperCase() + pet.type?.slice(1)}
                                                </span>
                                            </td>
                                            <td>{pet.breed}</td>
                                            <td>{pet.age} yr{pet.age !== 1 ? 's' : ''}</td>
                                            <td>{formatWeight(pet.weight)}</td>
                                            <td>{pet.owner_first_name} {pet.owner_last_name}</td>
                                            <td className="owner-contact">
                                                <div>{pet.owner_email}</div>
                                                <div>{pet.owner_phone}</div>
                                            </td>
                                            <td className="pet-actions" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="action-btn view"
                                                    onClick={() => openPetModal(pet)}
                                                    title="View Details"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(pet.id)}
                                                    title="Delete Pet"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Add Pet Tab */}
            {activeTab === "add" && (
                <div className="manage-pets-add">
                    <form onSubmit={handleSubmit} className="add-pet-admin-form">
                        {/* Owner Selection */}
                        <div className="form-section">
                            <h3><i className="bi bi-person-fill"></i> Select Owner</h3>
                            <div className="form-field">
                                <label>Owner *</label>
                                <select
                                    name="owner_id"
                                    value={formData.owner_id}
                                    onChange={handleChange}
                                    required
                                    disabled={fetchingUsers}
                                >
                                    <option value="">Select Owner</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.first_name} {user.last_name} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Pet Details */}
                        <div className="form-section">
                            <h3><i className="bi bi-heart-pulse-fill"></i> Pet Details</h3>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Pet Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter pet name"
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Type *</label>
                                    <select name="type" value={formData.type} onChange={handleChange} required>
                                        <option value="">Select Type</option>
                                        <option value="dog">Dog</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Breed *</label>
                                    <select
                                        name="breed"
                                        value={formData.breed}
                                        onChange={handleChange}
                                        required
                                        disabled={!breedOptions.length}
                                    >
                                        <option value="">Select Breed</option>
                                        {breedOptions.map((b, i) => (
                                            <option key={i} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field full-width">
                                    <label>Age *</label>
                                    <div className="age-toggle">
                                        <button
                                            type="button"
                                            className={ageInputType === 'age' ? 'active' : ''}
                                            onClick={() => setAgeInputType('age')}
                                        >
                                            Enter Age
                                        </button>
                                        <button
                                            type="button"
                                            className={ageInputType === 'birth' ? 'active' : ''}
                                            onClick={() => setAgeInputType('birth')}
                                        >
                                            Birth Date
                                        </button>
                                    </div>
                                    {ageInputType === 'age' ? (
                                        <input
                                            type="number"
                                            name="age"
                                            min="0"
                                            max="30"
                                            value={formData.age}
                                            onChange={handleChange}
                                            placeholder="Age in years"
                                            required={ageInputType === 'age'}
                                        />
                                    ) : (
                                        <div className="birth-inputs">
                                            <select
                                                name="birthMonth"
                                                value={formData.birthMonth}
                                                onChange={handleChange}
                                                required={ageInputType === 'birth'}
                                            >
                                                <option value="">Month</option>
                                                {months.map((m) => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                name="birthYear"
                                                value={formData.birthYear}
                                                onChange={handleChange}
                                                required={ageInputType === 'birth'}
                                            >
                                                <option value="">Year</option>
                                                {years.map((y) => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {ageInputType === 'birth' && calculateAge() && (
                                        <div className="age-display">
                                            <i className="bi bi-cake2"></i>
                                            <span>Age: <strong>{calculateAge()}</strong></span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label>Weight *</label>
                                    <select name="weight" value={formData.weight} onChange={handleChange} required>
                                        <option value="">Select Weight</option>
                                        <option value="below 15kgs">Below 15 kgs</option>
                                        <option value="above 15kgs and below 40kgs">15 - 40 kgs</option>
                                        <option value="above 40kgs">Above 40 kgs</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Gender *</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Aggression Level *</label>
                                    <select name="aggression" value={formData.aggression} onChange={handleChange} required>
                                        <option value="">Select Level</option>
                                        <option value="low">Low</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label>Vaccine Card *</label>
                                    <input
                                        type="file"
                                        name="vaccine_card"
                                        accept="image/*"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Pet Photo (Optional)</label>
                                    <input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-plus-circle"></i>
                                    Add Pet
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Pet Detail Modal */}
            {showPetModal && selectedPet && (
                <div className="pet-modal-overlay" onClick={() => setShowPetModal(false)}>
                    <div className="pet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pet-modal-header">
                            <h3>Pet Details</h3>
                            <button onClick={() => setShowPetModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="pet-modal-body">
                            {/* Pet Photo */}
                            <div className="pet-modal-photo">
                                {selectedPet.photo_path ? (
                                    <img src={selectedPet.photo_path} alt={selectedPet.name} />
                                ) : (
                                    <div className="pet-modal-no-photo">
                                        <i className="bi bi-heart-pulse-fill"></i>
                                    </div>
                                )}
                            </div>

                            {/* Pet Info */}
                            <div className="pet-modal-info">
                                <h4>{selectedPet.name}</h4>
                                <div className="pet-modal-badges">
                                    <span className={`type-badge ${selectedPet.type}`}>
                                        {selectedPet.type?.charAt(0).toUpperCase() + selectedPet.type?.slice(1)}
                                    </span>
                                    <span className={`aggression-badge ${selectedPet.aggression}`}>
                                        {selectedPet.aggression?.charAt(0).toUpperCase() + selectedPet.aggression?.slice(1)} Aggression
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="pet-modal-details">
                                <div className="detail-item">
                                    <span className="label">Breed</span>
                                    <span className="value">{selectedPet.breed}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Age</span>
                                    <span className="value">{selectedPet.age} year{selectedPet.age !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Weight</span>
                                    <span className="value">{formatWeight(selectedPet.weight)}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Gender</span>
                                    <span className="value">{selectedPet.gender?.charAt(0).toUpperCase() + selectedPet.gender?.slice(1)}</span>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className="pet-modal-owner">
                                <h5><i className="bi bi-person-fill"></i> Owner Information</h5>
                                <div className="owner-details">
                                    <div className="detail-item">
                                        <span className="label">Name</span>
                                        <span className="value">{selectedPet.owner_first_name} {selectedPet.owner_last_name}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Email</span>
                                        <span className="value">{selectedPet.owner_email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Phone</span>
                                        <span className="value">{selectedPet.owner_phone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Vaccine Card */}
                            {selectedPet.vaccine_card_path && (
                                <div className="pet-modal-vaccine">
                                    <h5><i className="bi bi-file-medical"></i> Vaccine Card</h5>
                                    <a href={selectedPet.vaccine_card_path} target="_blank" rel="noopener noreferrer">
                                        <img src={selectedPet.vaccine_card_path} alt="Vaccine Card" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePets;