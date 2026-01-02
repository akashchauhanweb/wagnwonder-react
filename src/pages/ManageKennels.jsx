import React, { useState, useRef, useEffect } from "react";
import { imageCompressor } from "../assets/js/imageCompressor";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";
import stateCityMap from "../assets/js/stateCityMap";

const ManageKennels = () => {
    const [activeTab, setActiveTab] = useState("list");
    const [userOptions, setUserOptions] = useState([]);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [addingFeature, setAddingFeature] = useState(false);
    const { setLoading } = useLoading();
    const [roomTypesList, setRoomTypesList] = useState([]);
    const [newRoomType, setNewRoomType] = useState("");
    const [roomTypeSearch, setRoomTypeSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [kennelsList, setKennelsList] = useState([]);
    const [loadingKennels, setLoadingKennels] = useState(true);
    const [searchKennel, setSearchKennel] = useState("");
    const [showKennelModal, setShowKennelModal] = useState(false);
    const [zoomImages, setZoomImages] = useState([]);
    const [zoomIndex, setZoomIndex] = useState(0);
    const [kennelInfo, setKennelInfo] = useState(null);
    const [showImageOrderModal, setShowImageOrderModal] = useState(false);
    const [pendingImages, setPendingImages] = useState([]);
    const session_id = localStorage.getItem("session_id");

    const [filters, setFilters] = useState({
        state: "",
        city: "",
        pin: "",
    });

    const fileInputRef = useRef(null);
    const [rooms, setRooms] = useState([
        {
            no_of_rooms: "",
            room_type: "",
            suitable_for: "",
            price_small: "",
            price_medium: "",
            price_large: ""
        }
    ]);

    const [kennelForm, setKennelForm] = useState({
        name: "",
        street_address_1: "",
        street_address_2: "",
        city: "",
        state: "",
        pin_code: "",
        latitude: "",
        longitude: "",
        markup_percentage: 0,
        user_id: "",
        features: [],
        images: [],
    });
    const [loadingFeatures, setLoadingFeatures] = useState(true);
    const [newUserForm, setNewUserForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password_hashed: "",
        user_type: "admin",
        has_admin_access: false,
        has_boarding_access: true,
        has_services_access: false,
        has_clinic_access: false,
    });
    const [addingUser, setAddingUser] = useState(false);
    const [featuresList, setFeaturesList] = useState([]);
    const [newFeature, setNewFeature] = useState("");
    const [featureSearch, setFeatureSearch] = useState("");
    const [addingRoomType, setAddingRoomType] = useState(false);
    const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);

    const filteredFeatures = featuresList.filter((f) =>
        f.name.toLowerCase().includes(featureSearch.toLowerCase())
    );

    const filteredRoomTypes = roomTypesList.filter((r) =>
        r.name.toLowerCase().includes(roomTypeSearch.toLowerCase())
    );

    const stateCityMapJson = stateCityMap();
    const cityOptions = kennelForm.state
        ? Object.keys(stateCityMapJson[kennelForm.state] || {})
        : [];

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setKennelForm((prev) => ({
                    ...prev,
                    latitude: latitude.toString(),
                    longitude: longitude.toString(),
                }));
            },
            (error) => {
                alert("Unable to retrieve location. Please allow location access.");
                console.error("Geolocation error:", error);
            }
        );
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        // Create preview URLs for each file
        const imagesWithPreview = files.map((file, index) => ({
            file,
            preview: URL.createObjectURL(file),
            order: index
        }));
        
        setPendingImages(imagesWithPreview);
        setShowImageOrderModal(true);
    };

    const handleImageReorder = (fromIndex, toIndex) => {
        const updated = [...pendingImages];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        // Update order numbers
        updated.forEach((img, idx) => img.order = idx);
        setPendingImages(updated);
    };

    const handleConfirmImageOrder = () => {
        // Set images in the confirmed order
        const orderedFiles = pendingImages.map(img => img.file);
        setKennelForm(prev => ({ ...prev, images: orderedFiles }));
        setShowImageOrderModal(false);
        // Clean up preview URLs
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    };

    const handleCancelImageOrder = () => {
        setShowImageOrderModal(false);
        setPendingImages([]);
        // Clean up preview URLs
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const moveImage = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= pendingImages.length) return;
        handleImageReorder(index, newIndex);
    };

    const fetchFeatures = async () => {
        setLoadingFeatures(true);
        const res = await callServicesApi({
            action: "GET_FEATURES",
            session_id: localStorage.getItem("session_id"),
        });
        if (res?.success) {
            setFeaturesList(res.data);
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        setLoadingFeatures(false);
    };

    const handleAddFeature = async () => {
        setAddingFeature(true);
        const res = await callServicesApi({
            action: "ADD_FEATURE",
            session_id: localStorage.getItem("session_id"),
            name: newFeature,
        });
        if (res?.success) {
            setNewFeature("");
            fetchFeatures();
            setSuccessMsg("Feature added successfully.");
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        } else {
            setErrorMsg(res.message || "Failed to add feature.");
        }
        setAddingFeature(false);
    };

    const handleDeleteFeature = async (id) => {
        setLoading(true);
        const res = await callServicesApi({
            action: "DELETE_FEATURE",
            session_id: localStorage.getItem("session_id"),
            feature_id: id,
        });
        if (res?.success) {
            fetchFeatures();
            setSuccessMsg("Feature deleted successfully.");
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        } else {
            setErrorMsg(res.message || "Failed to delete feature.");
        }
        setLoading(false);
    };

    const fetchRoomTypes = async () => {
        setLoadingRoomTypes(true);
        const res = await callServicesApi({
            action: "GET_ROOM_TYPES",
            session_id: localStorage.getItem("session_id"),
        });
        if (res?.success) {
            setRoomTypesList(res.data);
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        setLoadingRoomTypes(false);
    };

    const handleAddRoomType = async () => {
        setAddingRoomType(true);
        const res = await callServicesApi({
            action: "ADD_ROOM_TYPE",
            session_id: localStorage.getItem("session_id"),
            name: newRoomType,
        });
        if (res?.success) {
            setNewRoomType("");
            fetchRoomTypes();
            setSuccessMsg("Room type added successfully.");
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        } else {
            setErrorMsg(res.message || "Failed to add room type.");
        }
        setAddingRoomType(false);
    };

    const handleDeleteRoomType = async (id) => {
        setLoading(true);
        const res = await callServicesApi({
            action: "DELETE_ROOM_TYPE",
            session_id: localStorage.getItem("session_id"),
            room_type_id: id,
        });
        if (res?.success) {
            fetchRoomTypes();
            setSuccessMsg("Room type deleted successfully.");
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        } else {
            setErrorMsg(res.message || "Failed to delete room type.");
        }
        setLoading(false);
    };

    const fetchKennels = async () => {
        setLoadingKennels(true);
        const res = await callServicesApi({
            action: "GET_KENNELS",
            session_id: localStorage.getItem("session_id"),
        });
        if (res?.success) {
            setKennelsList(res.data);
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        setLoadingKennels(false);
    };

    const handleDeleteKennel = async (kennel_id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this kennel?");
        if (!confirmDelete) return;

        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        const res = await callServicesApi({
            action: "DELETE_KENNEL",
            session_id: localStorage.getItem("session_id"),
            kennel_id: kennel_id
        });

        if (res?.success) {
            setSuccessMsg("Kennel deleted successfully.");
            fetchKennels();
            setShowKennelModal(false);
            setKennelInfo(null);
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        } else {
            setErrorMsg(res.message || "Failed to delete kennel.");
        }
        setLoading(false);
    };

    const fetchKennelInfo = async (kennel_id) => {
        if (!session_id || !kennel_id) return;
        setShowKennelModal(true);
        setKennelInfo(null);
        const res = await callServicesApi({
            action: "GET_KENNEL_INFO",
            session_id: localStorage.getItem("session_id"),
            kennel_id: kennel_id
        });
        if (res?.success) {
            setKennelInfo(res.data);
        } else {
            setErrorMsg(res.message || "Failed to fetch kennel details.");
            setShowKennelModal(false);
        }
    };

    const fetchUsers = async () => {
        const res = await callServicesApi({
            action: "GET_ALL_USERS",
            session_id: localStorage.getItem("session_id")
        });
        if (res?.success) {
            setUserOptions(res.data);
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
    };

    const handleTabChange = async (tab) => {
        setActiveTab(tab);
        setSuccessMsg("");
        setErrorMsg("");
        if (tab === "list") await fetchKennels();
        else if (tab === "add") {
            await fetchUsers();
            await fetchFeatures();
            await fetchRoomTypes();
        }
        else if (tab === "features") await fetchFeatures();
        else if (tab === "roomtypes") await fetchRoomTypes();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccessMsg("");
        setErrorMsg("");
        let imageUrls = [];

        if (Array.isArray(kennelForm.images) && kennelForm.images.length > 0) {
            const totalImages = kennelForm.images.length;
            setUploadProgress({ current: 0, total: totalImages });
            
            try {
                for (let i = 0; i < kennelForm.images.length; i++) {
                    const file = kennelForm.images[i];
                    if (file instanceof File) {
                        const compressed = await imageCompressor(file);
                        const url = await uploadImageToS3(compressed, "kennels/");
                        imageUrls.push(url);
                        setUploadProgress({ current: i + 1, total: totalImages });
                    }
                }
            } catch (error) {
                console.error("Error uploading images:", error);
                setErrorMsg("Image upload failed.");
                setSubmitting(false);
                setUploadProgress({ current: 0, total: 0 });
                return;
            }
        }

        const cleanedRooms = rooms.map((room) => ({
            room_type_id: room.room_type_id,
            suitable_for: room.suitable_for,
            no_of_rooms: parseInt(room.no_of_rooms),
            price_small: parseFloat(room.price_small),
            price_medium: parseFloat(room.price_medium),
            price_large: parseFloat(room.price_large),
        }));

        const payload = {
            ...kennelForm,
            session_id: localStorage.getItem("session_id"),
            action: "ONBOARD_KENNEL",
            images: imageUrls,
            added_by: JSON.parse(localStorage.getItem("user_data")).id,
            rooms: cleanedRooms,
        };

        const res = await callServicesApi(payload);
        if (res?.success) {
            setSuccessMsg("Kennel onboarded successfully.");
            setKennelForm({
                name: "",
                street_address_1: "",
                street_address_2: "",
                city: "",
                state: "",
                pin_code: "",
                latitude: "",
                longitude: "",
                markup_percentage: 0,
                user_id: "",
                features: [],
                images: [],
            });
            setRooms([{
                no_of_rooms: "",
                room_type_id: "",
                suitable_for: "",
                price_small: "",
                price_medium: "",
                price_large: ""
            }]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setErrorMsg(res.message || "Failed to onboard kennel.");
        }
        setSubmitting(false);
        setUploadProgress({ current: 0, total: 0 });
    };

    const handleAddNewUser = async () => {
        setAddingUser(true);
        const res = await callServicesApi({
            action: "ADD_USER",
            session_id: localStorage.getItem("session_id"),
            ...newUserForm
        });
        if (res?.success) {
            setSuccessMsg("User added successfully.");
            setNewUserForm({
                first_name: "",
                last_name: "",
                email: "",
                phone_number: "",
                password_hashed: "",
                user_type: "admin",
                has_admin_access: false,
                has_boarding_access: true,
                has_services_access: false,
                has_clinic_access: false,
            });
            const updatedUsers = await callServicesApi({
                action: "GET_ALL_USERS",
                session_id: localStorage.getItem("session_id")
            });
            if (updatedUsers?.success) {
                setUserOptions(updatedUsers.data);
                setKennelForm({ ...kennelForm, user_id: res.data?.id?.toString() || "" });
            }
        } else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        } else {
            setErrorMsg(`User not added: ${res.message}`);
        }
        setAddingUser(false);
    };

    useEffect(() => {
        fetchKennels();
    }, []);

    const filteredKennels = kennelsList.filter((k) =>
        (!filters.state || k.state === filters.state) &&
        (!filters.city || k.city === filters.city) &&
        (!filters.pin || k.pin_code.includes(filters.pin)) &&
        (!searchKennel || 
            k.name.toLowerCase().includes(searchKennel.toLowerCase()) ||
            k.city.toLowerCase().includes(searchKennel.toLowerCase()) ||
            k.state.toLowerCase().includes(searchKennel.toLowerCase())
        )
    );

    return (
        <div className="manage-kennels">
            <div className="manage-kennels-header">
                <h2>Manage Kennels</h2>
                <span className="manage-kennels-count">{kennelsList.length} kennel{kennelsList.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Submenu Tabs */}
            <div className="manage-kennels-submenu">
                <button
                    className={`submenu-item ${activeTab === "list" ? "active" : ""}`}
                    onClick={() => handleTabChange("list")}
                >
                    <i className="bi bi-list-ul"></i>
                    View Kennels
                </button>
                <button
                    className={`submenu-item ${activeTab === "add" ? "active" : ""}`}
                    onClick={() => handleTabChange("add")}
                >
                    <i className="bi bi-plus-circle"></i>
                    Onboard
                </button>
                <button
                    className={`submenu-item ${activeTab === "features" ? "active" : ""}`}
                    onClick={() => handleTabChange("features")}
                >
                    <i className="bi bi-stars"></i>
                    Features
                </button>
                <button
                    className={`submenu-item ${activeTab === "roomtypes" ? "active" : ""}`}
                    onClick={() => handleTabChange("roomtypes")}
                >
                    <i className="bi bi-door-open"></i>
                    Room Types
                </button>
            </div>

            {/* Success/Error Messages */}
            {successMsg && (
                <div className="manage-kennels-alert success">
                    <i className="bi bi-check-circle"></i>
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {errorMsg && (
                <div className="manage-kennels-alert error">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* View Kennels Tab */}
            {activeTab === "list" && (
                <div className="manage-kennels-list">
                    <div className="kennels-filters">
                        <div className="filter-field search-field">
                            <div className="filter-input-wrapper">
                                <i className="bi bi-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search by name, city, state..."
                                    value={searchKennel}
                                    onChange={(e) => setSearchKennel(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="filter-row">
                            <div className="filter-field">
                                <label>State</label>
                                <select
                                    value={filters.state}
                                    onChange={(e) => setFilters({ ...filters, state: e.target.value, city: "" })}
                                >
                                    <option value="">All States</option>
                                    {[...new Set(kennelsList.map((k) => k.state))].sort().map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field">
                                <label>City</label>
                                <select
                                    value={filters.city}
                                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                    disabled={!filters.state}
                                >
                                    <option value="">All Cities</option>
                                    {[...new Set(
                                        kennelsList
                                            .filter((k) => k.state === filters.state)
                                            .map((k) => k.city)
                                    )].sort().map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-field">
                                <label>Pin Code</label>
                                <input
                                    type="text"
                                    placeholder="Enter Pin"
                                    value={filters.pin}
                                    onChange={(e) => setFilters({ ...filters, pin: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {loadingKennels ? (
                        <div className="manage-kennels-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : filteredKennels.length === 0 ? (
                        <div className="manage-kennels-empty">
                            <i className="bi bi-house-door"></i>
                            <p>No kennels found</p>
                        </div>
                    ) : (
                        <div className="kennels-grid">
                            {filteredKennels.map((kennel) => (
                                <div 
                                    key={kennel.id} 
                                    className="kennel-card"
                                    onClick={() => fetchKennelInfo(kennel.id)}
                                >
                                    <div className="kennel-card-header">
                                        <div className="kennel-icon">
                                            <i className="bi bi-house-heart-fill"></i>
                                        </div>
                                        <div className="kennel-info">
                                            <h3>{kennel.name}</h3>
                                            <span className="kennel-id">#{kennel.id}</span>
                                        </div>
                                        <button 
                                            className="kennel-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteKennel(kennel.id);
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                    <div className="kennel-card-body">
                                        <div className="kennel-detail">
                                            <i className="bi bi-geo-alt"></i>
                                            <span>{kennel.street_address_1}{kennel.street_address_2 ? `, ${kennel.street_address_2}` : ""}</span>
                                        </div>
                                        <div className="kennel-detail">
                                            <i className="bi bi-building"></i>
                                            <span>{kennel.city}, {kennel.state} - {kennel.pin_code}</span>
                                        </div>
                                        <div className="kennel-markup">
                                            <span className="markup-label">Markup</span>
                                            <span className="markup-value">{kennel.markup}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Onboard Kennel Tab */}
            {activeTab === "add" && (
                <div className="manage-kennels-add">
                    <form onSubmit={handleSubmit} className="onboard-form">
                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="bi bi-info-circle"></i>
                                Basic Information
                            </h3>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Kennel Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter kennel name"
                                        value={kennelForm.name}
                                        onChange={(e) => setKennelForm({ ...kennelForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Kennel Owner *</label>
                                    <select
                                        value={kennelForm.user_id}
                                        onChange={(e) => setKennelForm({ ...kennelForm, user_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Owner</option>
                                        <option value="__add_new__">+ Add New User</option>
                                        {userOptions.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.first_name} {u.last_name} - {u.phone_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Add New User Section */}
                            {kennelForm.user_id === "__add_new__" && (
                                <div className="add-user-section">
                                    <h4>Add New User</h4>
                                    <div className="form-grid">
                                        <div className="form-field">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                value={newUserForm.first_name}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                value={newUserForm.last_name}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={newUserForm.email}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                placeholder="Phone"
                                                value={newUserForm.phone_number}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, phone_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Password</label>
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={newUserForm.password_hashed}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, password_hashed: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>User Type</label>
                                            <select
                                                value={newUserForm.user_type}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, user_type: e.target.value })}
                                            >
                                                <option value="client">Client</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className="add-user-btn"
                                        onClick={handleAddNewUser}
                                        disabled={addingUser}
                                    >
                                        {addingUser ? "Adding..." : "Add User"}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="bi bi-geo-alt"></i>
                                Address Details
                            </h3>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Street Address 1 *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter street address"
                                        value={kennelForm.street_address_1}
                                        onChange={(e) => setKennelForm({ ...kennelForm, street_address_1: e.target.value })}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Street Address 2</label>
                                    <input
                                        type="text"
                                        placeholder="Enter street address (optional)"
                                        value={kennelForm.street_address_2}
                                        onChange={(e) => setKennelForm({ ...kennelForm, street_address_2: e.target.value })}
                                    />
                                </div>
                                <div className="form-field">
                                    <label>State *</label>
                                    <select
                                        required
                                        value={kennelForm.state}
                                        onChange={(e) => setKennelForm({ ...kennelForm, state: e.target.value, city: "" })}
                                    >
                                        <option value="">Select State</option>
                                        {Object.keys(stateCityMapJson).map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>City *</label>
                                    <select
                                        required
                                        value={kennelForm.city}
                                        onChange={(e) => setKennelForm({ ...kennelForm, city: e.target.value })}
                                        disabled={!kennelForm.state}
                                    >
                                        <option value="">Select City</option>
                                        {cityOptions.map((city) => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Pin Code *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter pin code"
                                        value={kennelForm.pin_code}
                                        onChange={(e) => setKennelForm({ ...kennelForm, pin_code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="location-field">
                                <label>Location Coordinates</label>
                                <div className="location-inputs">
                                    <input
                                        type="text"
                                        placeholder="Latitude"
                                        value={kennelForm.latitude}
                                        onChange={(e) => setKennelForm({ ...kennelForm, latitude: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Longitude"
                                        value={kennelForm.longitude}
                                        onChange={(e) => setKennelForm({ ...kennelForm, longitude: e.target.value })}
                                    />
                                    <button type="button" className="detect-btn" onClick={detectLocation}>
                                        <i className="bi bi-crosshair"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="bi bi-percent"></i>
                                Markup Settings
                            </h3>
                            <div className="markup-slider">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={kennelForm.markup_percentage}
                                    onChange={(e) => setKennelForm({ ...kennelForm, markup_percentage: e.target.value })}
                                />
                                <div className="markup-value-display">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={kennelForm.markup_percentage}
                                        onChange={(e) => {
                                            let val = Math.max(0, Math.min(100, Number(e.target.value)));
                                            setKennelForm({ ...kennelForm, markup_percentage: val });
                                        }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="bi bi-stars"></i>
                                Features
                            </h3>
                            <div className="features-grid">
                                {featuresList.map((feature) => (
                                    <label key={feature.id} className="feature-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={kennelForm.features.includes(feature.id.toString())}
                                            onChange={() => {
                                                const value = feature.id.toString();
                                                setKennelForm((prev) => ({
                                                    ...prev,
                                                    features: prev.features.includes(value)
                                                        ? prev.features.filter((f) => f !== value)
                                                        : [...prev.features, value]
                                                }));
                                            }}
                                        />
                                        <span className="checkmark"></span>
                                        <span>{feature.name}</span>
                                    </label>
                                ))}
                                {featuresList.length === 0 && (
                                    <p className="no-features">No features available. Add some in the Features tab.</p>
                                )}
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="bi bi-door-open"></i>
                                Rooms
                            </h3>
                            {rooms.map((room, index) => (
                                <div key={index} className="room-entry">
                                    <div className="room-grid">
                                        <div className="form-field">
                                            <label>Room Type</label>
                                            <select
                                                value={room.room_type_id}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].room_type_id = e.target.value;
                                                    setRooms(updated);
                                                }}
                                            >
                                                <option value="">Select Type</option>
                                                {roomTypesList.map((r) => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>Suitable For</label>
                                            <select
                                                value={room.suitable_for}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].suitable_for = e.target.value;
                                                    setRooms(updated);
                                                }}
                                            >
                                                <option value="">Select</option>
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Bird">Bird</option>
                                                <option value="Fish">Fish</option>
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>No. of Rooms</label>
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="Count"
                                                value={room.no_of_rooms}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].no_of_rooms = parseInt(e.target.value);
                                                    setRooms(updated);
                                                }}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Price (Small)</label>
                                            <input
                                                type="number"
                                                placeholder="₹"
                                                value={room.price_small}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].price_small = e.target.value;
                                                    setRooms(updated);
                                                }}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Price (Medium)</label>
                                            <input
                                                type="number"
                                                placeholder="₹"
                                                value={room.price_medium}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].price_medium = e.target.value;
                                                    setRooms(updated);
                                                }}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Price (Large)</label>
                                            <input
                                                type="number"
                                                placeholder="₹"
                                                value={room.price_large}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].price_large = e.target.value;
                                                    setRooms(updated);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="remove-room-btn"
                                        onClick={() => setRooms(rooms.filter((_, i) => i !== index))}
                                    >
                                        <i className="bi bi-trash"></i>
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="add-room-btn"
                                onClick={() => setRooms([...rooms, {
                                    room_type_id: "",
                                    suitable_for: "",
                                    no_of_rooms: 1,
                                    price_small: "",
                                    price_medium: "",
                                    price_large: ""
                                }])}
                            >
                                <i className="bi bi-plus-circle"></i>
                                Add Another Room
                            </button>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">
                                <i className="bi bi-images"></i>
                                Kennel Images
                            </h3>
                            <div className="form-field">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                />
                                {kennelForm.images.length > 0 && (
                                    <div className="selected-images-info">
                                        <i className="bi bi-check-circle-fill"></i>
                                        <span>{kennelForm.images.length} image(s) selected and ordered</span>
                                        <button 
                                            type="button" 
                                            className="reorder-btn"
                                            onClick={() => {
                                                const imagesWithPreview = kennelForm.images.map((file, index) => ({
                                                    file,
                                                    preview: URL.createObjectURL(file),
                                                    order: index
                                                }));
                                                setPendingImages(imagesWithPreview);
                                                setShowImageOrderModal(true);
                                            }}
                                        >
                                            <i className="bi bi-arrow-down-up"></i>
                                            Reorder
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className={`submit-btn ${submitting && uploadProgress.total > 0 ? 'with-progress' : ''}`}
                            disabled={submitting}
                            style={submitting && uploadProgress.total > 0 ? {
                                '--progress': `${(uploadProgress.current / uploadProgress.total) * 100}%`
                            } : {}}
                        >
                            {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                            {submitting ? (
                                uploadProgress.total > 0 
                                    ? `Uploading ${uploadProgress.current}/${uploadProgress.total}` 
                                    : "Saving..."
                            ) : "Onboard Kennel"}
                        </button>
                    </form>
                </div>
            )}

            {/* Features Tab */}
            {activeTab === "features" && (
                <div className="manage-kennels-features">
                    <div className="feature-add-form">
                        <div className="filter-input-wrapper">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search features..."
                                value={featureSearch}
                                onChange={(e) => setFeatureSearch(e.target.value)}
                            />
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddFeature(); }} className="add-inline-form">
                            <input
                                type="text"
                                placeholder="New feature name"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                required
                            />
                            <button type="submit" disabled={addingFeature}>
                                {addingFeature ? "Adding..." : "Add Feature"}
                            </button>
                        </form>
                    </div>

                    {loadingFeatures ? (
                        <div className="manage-kennels-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : filteredFeatures.length === 0 ? (
                        <div className="manage-kennels-empty">
                            <i className="bi bi-stars"></i>
                            <p>No features found</p>
                        </div>
                    ) : (
                        <div className="items-list">
                            {filteredFeatures.map((feature) => (
                                <div key={feature.id} className="list-item">
                                    <div className="item-info">
                                        <span className="item-id">#{feature.id}</span>
                                        <span className="item-name">{feature.name}</span>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDeleteFeature(feature.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Room Types Tab */}
            {activeTab === "roomtypes" && (
                <div className="manage-kennels-roomtypes">
                    <div className="feature-add-form">
                        <div className="filter-input-wrapper">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search room types..."
                                value={roomTypeSearch}
                                onChange={(e) => setRoomTypeSearch(e.target.value)}
                            />
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddRoomType(); }} className="add-inline-form">
                            <input
                                type="text"
                                placeholder="New room type name"
                                value={newRoomType}
                                onChange={(e) => setNewRoomType(e.target.value)}
                                required
                            />
                            <button type="submit" disabled={addingRoomType}>
                                {addingRoomType ? "Adding..." : "Add Room Type"}
                            </button>
                        </form>
                    </div>

                    {loadingRoomTypes ? (
                        <div className="manage-kennels-loading">
                            <div className="spinner-border" role="status" />
                        </div>
                    ) : filteredRoomTypes.length === 0 ? (
                        <div className="manage-kennels-empty">
                            <i className="bi bi-door-open"></i>
                            <p>No room types found</p>
                        </div>
                    ) : (
                        <div className="items-list">
                            {filteredRoomTypes.map((room) => (
                                <div key={room.id} className="list-item">
                                    <div className="item-info">
                                        <span className="item-id">#{room.id}</span>
                                        <span className="item-name">{room.name}</span>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDeleteRoomType(room.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Image Zoom Modal */}
            {zoomImages.length > 0 && (
                <div className="image-zoom-overlay" onClick={() => { setZoomImages([]); setZoomIndex(0); }}>
                    <button className="zoom-close-btn" onClick={() => { setZoomImages([]); setZoomIndex(0); }}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                    <img src={zoomImages[zoomIndex]?.image_url} alt="Zoomed" className="zoom-main-image" onClick={(e) => e.stopPropagation()} />
                    <div className="zoom-thumbnails" onClick={(e) => e.stopPropagation()}>
                        {zoomImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img.image_url}
                                alt="Thumb"
                                className={zoomIndex === idx ? "active" : ""}
                                onClick={() => setZoomIndex(idx)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Image Order Modal */}
            {showImageOrderModal && (
                <div className="image-order-modal-overlay" onClick={handleCancelImageOrder}>
                    <div className="image-order-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="image-order-modal-header">
                            <h3>Arrange Image Order</h3>
                            <p>Drag or use arrows to set the display order. First image will be shown first.</p>
                            <button className="modal-close-btn" onClick={handleCancelImageOrder}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="image-order-modal-body">
                            <div className="image-order-list">
                                {pendingImages.map((img, index) => (
                                    <div key={index} className="image-order-item">
                                        <div className="image-order-number">{index + 1}</div>
                                        <img src={img.preview} alt={`Preview ${index + 1}`} />
                                        <div className="image-order-name">{img.file.name}</div>
                                        <div className="image-order-actions">
                                            <button 
                                                type="button"
                                                onClick={() => moveImage(index, 'up')}
                                                disabled={index === 0}
                                                title="Move up"
                                            >
                                                <i className="bi bi-chevron-up"></i>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => moveImage(index, 'down')}
                                                disabled={index === pendingImages.length - 1}
                                                title="Move down"
                                            >
                                                <i className="bi bi-chevron-down"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="image-order-modal-footer">
                            <button type="button" className="btn-cancel" onClick={handleCancelImageOrder}>
                                Cancel
                            </button>
                            <button type="button" className="btn-confirm" onClick={handleConfirmImageOrder}>
                                <i className="bi bi-check-lg"></i>
                                Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Kennel Info Modal */}
            {showKennelModal && (
                <div className="kennel-modal-overlay" onClick={() => { setShowKennelModal(false); setKennelInfo(null); }}>
                    <div className="kennel-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="kennel-modal-header">
                            <h3>Kennel Details</h3>
                            <button onClick={() => { setShowKennelModal(false); setKennelInfo(null); }}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="kennel-modal-body">
                            {kennelInfo ? (
                                <>
                                    <div className="kennel-modal-section">
                                        <div className="modal-kennel-header">
                                            <h4>{kennelInfo.name}</h4>
                                            <button className="modal-delete-btn" onClick={() => handleDeleteKennel(kennelInfo.id)}>
                                                <i className="bi bi-trash"></i>
                                                Delete Kennel
                                            </button>
                                        </div>
                                        <p className="kennel-address">
                                            <i className="bi bi-geo-alt"></i>
                                            {kennelInfo.street_address_1}{kennelInfo.street_address_2 && `, ${kennelInfo.street_address_2}`}, {kennelInfo.city}, {kennelInfo.state} - {kennelInfo.pin_code}
                                        </p>
                                        <p className="kennel-coords">
                                            <i className="bi bi-crosshair"></i>
                                            Lat: {kennelInfo.latitude}, Lng: {kennelInfo.longitude}
                                        </p>
                                        <p className="kennel-modal-markup">
                                            <span>Markup:</span> {kennelInfo.markup}%
                                        </p>
                                    </div>

                                    {kennelInfo.images?.length > 0 && (
                                        <div className="kennel-modal-section">
                                            <h5>Images</h5>
                                            <div className="modal-images">
                                                {kennelInfo.images.map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img.image_url}
                                                        alt={img.alt_text}
                                                        onClick={() => { setZoomImages(kennelInfo.images); setZoomIndex(idx); }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {kennelInfo.features?.length > 0 && (
                                        <div className="kennel-modal-section">
                                            <h5>Features</h5>
                                            <div className="modal-features">
                                                {kennelInfo.features.map((f) => (
                                                    <span key={f.id} className="feature-tag">{f.name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {kennelInfo.rooms?.length > 0 && (
                                        <div className="kennel-modal-section">
                                            <h5>Rooms</h5>
                                            <div className="modal-rooms-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Type ID</th>
                                                            <th>For</th>
                                                            <th>Count</th>
                                                            <th>Small ₹</th>
                                                            <th>Medium ₹</th>
                                                            <th>Large ₹</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {kennelInfo.rooms.map((r, i) => (
                                                            <tr key={i}>
                                                                <td>{r.room_type_id}</td>
                                                                <td>{r.suitable_for}</td>
                                                                <td>{r.count}</td>
                                                                <td>₹{r.price_small}</td>
                                                                <td>₹{r.price_medium}</td>
                                                                <td>₹{r.price_large}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="modal-loading">
                                    <div className="spinner-border" role="status" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageKennels;