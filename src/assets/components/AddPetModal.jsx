import React, { useState, useEffect } from 'react';
import { callServicesApi } from '../js/servicesApi';
import { uploadImageToS3 } from '../js/uploadImageToS3';
import { imageCompressor } from '../js/imageCompressor';

export default function AddPetModal({ onClose, onSaved }) {
    const [formData, setFormData] = useState({
        name: '', age: '', birthMonth: '', birthYear: '', type: '', breed: '', weight: '', gender: '', aggression: '', vaccine_card: null, photo: null
    });
    const [ageInputType, setAgeInputType] = useState('age'); // 'age' or 'birth'
    const [breedOptions, setBreedOptions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const breeds = {
        dog: ['Labrador', 'German Shepherd', 'Golden Retriever', 'Poodle', 'Bulldog', 'Beagle'],
        cat: ['Indian', 'Persian', 'Siamese', 'Maine Coon', 'Ragdoll', 'Bengal', 'Sphynx', 'British Shorthair', 'Scottish Fold', 'Abyssinian', 'Norwegian Forest Cat', 'American Shorthair', 'Russian Blue', 'Devon Rex'],
    };

    const calculateAge = () => {
        if (!formData.birthMonth || !formData.birthYear) return null;
        const today = new Date();
        const birthDate = new Date(formData.birthYear, formData.birthMonth - 1);
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        if (years < 1) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        }
        return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`;
    };

    const getAgeInYears = () => {
        if (ageInputType === 'age') {
            return parseInt(formData.age) || 0;
        }
        if (!formData.birthMonth || !formData.birthYear) return 0;
        const today = new Date();
        const birthDate = new Date(formData.birthYear, formData.birthMonth - 1);
        let years = today.getFullYear() - birthDate.getFullYear();
        const months = today.getMonth() - birthDate.getMonth();
        if (months < 0) years--;
        return Math.max(0, years);
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 31 }, (_, i) => currentYear - i);
    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    useEffect(() => {
        setBreedOptions(breeds[formData.type] || []);
    }, [formData.type]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setError("");
        if (files) setFormData(prev => ({ ...prev, [name]: files[0] }));
        else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const form = formData;
            let vaccinePath = form.vaccine_card ? await uploadImageToS3(await imageCompressor(form.vaccine_card), 'pets/') : '';
            let photoPath = form.photo ? await uploadImageToS3(await imageCompressor(form.photo), 'pets/') : '';

            const payload = {
                action: 'ADD_PET',
                session_id: localStorage.getItem('session_id'),
                user_id: JSON.parse(localStorage.getItem('user_data')).id,
                name: form.name,
                age: getAgeInYears(),
                type: form.type,
                breed: form.breed,
                weight: form.weight,
                gender: form.gender,
                aggression: form.aggression,
                vaccine_card_path: vaccinePath,
                photo_path: photoPath,
            };

            const res = await callServicesApi(payload);
            if (res.success) {
                onSaved();
            } else {
                setError(res.message || 'Failed to add pet.');
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
                        <i className="bi bi-heart-pulse-fill"></i>
                        <h3>Add New Pet</h3>
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

                        <div className="add-pet-field full-width">
                          <label>Age *</label>
                          <div className="add-pet-age-toggle">
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
                              <div className="add-pet-birth-inputs">
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
                              <div className="add-pet-age-display">
                                  <i className="bi bi-cake2"></i>
                                  <span>Age: <strong>{calculateAge()}</strong></span>
                              </div>
                          )}
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
                            <label>Vaccine Card *</label>
                            <input
                                type="file"
                                name="vaccine_card"
                                accept="image/*"
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="add-pet-field full-width">
                            <label>Pet Photo (Optional)</label>
                            <input
                                type="file"
                                name="photo"
                                accept="image/*"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="add-pet-modal-actions">
                        <button type="submit" className="add-pet-submit-btn" disabled={submitting}>
                            {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                            {submitting ? 'Adding...' : 'Add Pet'}
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