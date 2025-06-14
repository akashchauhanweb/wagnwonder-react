import React, { useState, useEffect } from 'react';
import { callServicesApi } from '../js/servicesApi';
import { uploadImageToS3 } from '../js/uploadImageToS3';
import { imageCompressor } from '../js/imageCompressor';

export default function AddPetModal({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: '', age: '', type: '', breed: '', weight: '', gender: '', aggression: '', vaccine_card: null, photo: null
  });
  const [breedOptions, setBreedOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // update breed options when type changes
  useEffect(() => {
    const { type } = formData;
    const breeds = {
      dog: ['Labrador', 'German Shepherd', 'Golden Retriever', 'Poodle', 'Bulldog', 'Beagle'],
      cat: ['Indian', 'Persian', 'Siamese', 'Maine Coon', 'Ragdoll', 'Bengal', 'Sphynx'],
    };
    setBreedOptions(breeds[type] || []);
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData(prev => ({ ...prev, [name]: files[0] }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = formData;
      // compress and upload images
      let vaccinePath = form.vaccine_card ? await uploadImageToS3(await imageCompressor(form.vaccine_card), 'pets/') : '';
      let photoPath = form.photo ? await uploadImageToS3(await imageCompressor(form.photo), 'pets/') : '';
      // call ADD_PET
      const payload = {
        action: 'ADD_PET',
        session_id: localStorage.getItem('session_id'),
        user_id: JSON.parse(localStorage.getItem('user_data')).id,
        name: form.name,
        age: parseInt(form.age),
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
        alert('Error adding pet: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error adding pet');
    } finally {
      setSubmitting(false);
    }

  };

  return (
    <div className="modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Pet</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="form-select" required>
                <option value="">Select Type</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Breed</label>
              <select name="breed" value={formData.breed} onChange={handleChange} className="form-select" required disabled={!breedOptions.length}>
                <option value="">Select Breed</option>
                {breedOptions.map((b, i) => <option key={i} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Weight</label>
              <select name="weight" value={formData.weight} onChange={handleChange} className="form-select" required>
                <option value="">Select Weight</option>
                <option value="below 10kgs">below 10kgs</option>
                <option value="above 10kgs and below 20kgs">10-20kgs</option>
                <option value="above 20kgs and below 30kgs">20-30kgs</option>
                <option value="above 30kgs and below 40kgs">30-40kgs</option>
                <option value="above 40kgs">above 40kgs</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="form-select" required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Aggression</label>
              <select name="aggression" value={formData.aggression} onChange={handleChange} className="form-select" required>
                <option value="">Select Level</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Vaccine Card</label>
              <input type="file" name="vaccine_card" accept="image/*" onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Pet Photo</label>
              <input type="file" name="photo" accept="image/*" onChange={handleChange} className="form-control" />
            </div>
          </form>
          <div className="modal-footer">
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: "transparent",
                color: "#471915",
                border: "1px solid #471915",
              }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: "#471915",
                color: "#fff",
              }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Pet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
