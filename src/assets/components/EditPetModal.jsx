import React, { useState, useEffect } from 'react';
import { callServicesApi } from '../js/servicesApi';
import { uploadImageToS3 } from '../js/uploadImageToS3';
import { imageCompressor } from '../js/imageCompressor';

export default function EditPetModal({ pet, onClose, onSaved }) {
    const [formData, setFormData] = useState({
        name: pet.name || '',
        age: pet.age || '',
        type: pet.type || '',
        breed: pet.breed || '',
        weight: pet.weight || '',
        gender: pet.gender || '',
        aggression: pet.aggression || '',
        vaccine_card: null,
        vaccine_card_path: pet.vaccine_card_path || '',
        photo: null,
        photo_path: pet.photo_path || ''
    });
    const [breedOptions, setBreedOptions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const breeds = {
        dog: ['Labrador', 'German Shepherd', 'Golden Retriever', 'Poodle', 'Bulldog', 'Beagle'],
        cat: ['Indian', 'Persian', 'Siamese', 'Maine Coon', 'Ragdoll', 'Bengal', 'Sphynx', 'British Shorthair', 'Scottish Fold', 'Abyssinian', 'Norwegian Forest Cat', 'American Shorthair', 'Russian Blue', 'Devon Rex'],
    };

    useEffect(() => {
        setBreedOptions(breeds[formData.type] || []);
    }, [formData.type]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setError("");
        if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            if (name === 'type') {
                setFormData(prev => ({ ...prev, type: value, breed: '' }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const handleRemoveImage = (field) => {
        if (field === 'vaccine') {
            setFormData(prev => ({ ...prev, vaccine_card_path: '', vaccine_card: null }));
        } else {
            setFormData(prev => ({ ...prev, photo_path: '', photo: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            let vaccineCardPath = formData.vaccine_card_path || "";
            let photoPath = formData.photo_path || "";

            if (formData.vaccine_card instanceof File) {
                const compressedFile = await imageCompressor(formData.vaccine_card);
                vaccineCardPath = await uploadImageToS3(compressedFile, 'pets/');
            }

            if (formData.photo instanceof File) {
                const compressedFile = await imageCompressor(formData.photo);
                photoPath = await uploadImageToS3(compressedFile, 'pets/');
            }

            const payload = {
                action: 'EDIT_PET',
                session_id: localStorage.getItem('session_id'),
                user_id: JSON.parse(localStorage.getItem('user_data')).id,
                pet_id: pet.id,
                name: formData.name,
                age: parseInt(formData.age),
                type: formData.type,
                breed: formData.breed,
                weight: formData.weight,
                gender: formData.gender,
                aggression: formData.aggression,
                vaccine_card_path: vaccineCardPath,
                photo_path: photoPath,
            };

            const res = await callServicesApi(payload);
            if (res.success) {
                onSaved();
            } else {
                setError(res.message || 'Failed to update pet.');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-pet-modal-overlay" onClick={onClose}>
            <div className="add-pet-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-pet-modal-header">
                    <div className="add-pet-modal-title">
                        <i className="bi bi-pencil-square"></i>
                        <h3>Edit Pet</h3>
                    </div>
                    <button className="add-pet-modal-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {error && (
                    <div className="add-pet-modal-error">
                        <i className="bi bi-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="add-pet-modal-form">
                    <div className="add-pet-form-grid">
                        <div className="add-pet-field">
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

                        <div className="add-pet-field">
                            <label>Age (years) *</label>
                            <input
                                type="number"
                                name="age"
                                min="0"
                                max="30"
                                value={formData.age}
                                onChange={handleChange}
                                placeholder="Age in years"
                                required
                            />
                        </div>

                        <div className="add-pet-field">
                            <label>Type *</label>
                            <select name="type" value={formData.type} onChange={handleChange} required>
                                <option value="">Select Type</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="bird">Bird</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="add-pet-field">
                            <label>Breed *</label>
                            <select
                                name="breed"
                                value={formData.breed}
                                onChange={handleChange}
                                required
                                disabled={!breedOptions.length}
                            >
                                <option value="">Select Breed</option>
                                {breedOptions.map((b, i) => <option key={i} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className="add-pet-field">
                            <label>Weight *</label>
                            <select name="weight" value={formData.weight} onChange={handleChange} required>
                                <option value="">Select Weight</option>
                                <option value="below 15kgs">Below 15 kgs</option>
                                <option value="above 15kgs and below 40kgs">15 - 40 kgs</option>
                                <option value="above 40kgs">Above 40 kgs</option>
                            </select>
                        </div>

                        <div className="add-pet-field">
                            <label>Gender *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>

                        <div className="add-pet-field">
                            <label>Aggression Level *</label>
                            <select name="aggression" value={formData.aggression} onChange={handleChange} required>
                                <option value="">Select Level</option>
                                <option value="low">Low</option>
                                <option value="moderate">Moderate</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="add-pet-field">
                            {formData.vaccine_card_path ? (
                                <div className="edit-pet-image-preview">
                                    <label>Vaccine Card</label>
                                    <img src={formData.vaccine_card_path} alt="Vaccine Card" />
                                    <button type="button" onClick={() => handleRemoveImage('vaccine')}>
                                        <i className="bi bi-trash"></i> Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <label>Vaccine Card *</label>
                                    <input
                                        type="file"
                                        name="vaccine_card"
                                        accept="image/*"
                                        onChange={handleChange}
                                        required={!formData.vaccine_card_path}
                                    />
                                </>
                            )}
                        </div>

                        <div className="add-pet-field">
                            {formData.photo_path ? (
                                <div className="edit-pet-image-preview">
                                    <label>Pet Photo</label>
                                    <img src={formData.photo_path} alt="Pet" />
                                    <button type="button" onClick={() => handleRemoveImage('photo')}>
                                        <i className="bi bi-trash"></i> Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <label>Pet Photo (Optional)</label>
                                    <input
                                        type="file"
                                        name="photo"
                                        accept="image/*"
                                        onChange={handleChange}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="add-pet-modal-actions">
                        <button type="submit" className="add-pet-submit-btn" disabled={submitting}>
                            {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" className="add-pet-cancel-btn" onClick={onClose} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}