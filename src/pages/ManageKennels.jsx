import React, { useState, useRef } from "react";
import { imageCompressor } from "../assets/js/imageCompressor";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { useEffect } from "react";
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
    const [kennelsList, setKennelsList] = useState([]);
    const [loadingKennels, setLoadingKennels] = useState(true);
    const [searchKennel, setSearchKennel] = useState("");
    const [showKennelModal, setShowKennelModal] = useState(false);
    const [zoomImages, setZoomImages] = useState([]);
    const [zoomIndex, setZoomIndex] = useState(0);
    const [kennelInfo, setKennelInfo] = useState(null);
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
        has_boarding_access: true, // or false as default
        has_services_access: false,
        has_clinic_access: false,
    });
    const [addingUser, setAddingUser] = useState(false);
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
    const [featuresList, setFeaturesList] = useState([]);
    const [newFeature, setNewFeature] = useState("");
    const [featureSearch, setFeatureSearch] = useState("");

    const filteredFeatures = featuresList.filter((f) =>
        f.name.toLowerCase().includes(featureSearch.toLowerCase())
    );

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
        }
        else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        else {
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
        }
        else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        else {
            setErrorMsg(res.message || "Failed to delete feature.");
        }
        setLoading(false);
    };

    const [addingRoomType, setAddingRoomType] = useState(false);
    const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);

    const filteredRoomTypes = roomTypesList.filter((r) =>
        r.name.toLowerCase().includes(roomTypeSearch.toLowerCase())
    );

    const fetchRoomTypes = async () => {
        setLoadingRoomTypes(true);
        let payload = {
            action: "GET_ROOM_TYPES",
            session_id: localStorage.getItem("session_id"),
        }
        const res = await callServicesApi(payload);
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
        }
        else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        else {
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
        }
        else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        else {
            setErrorMsg(res.message || "Failed to delete room type.");
        }
        setLoading(false);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setSuccessMsg("");
        setErrorMsg("");
        let imageUrls = [];

        if (Array.isArray(kennelForm.images)) {
            try {
                for (let file of kennelForm.images) {
                    if (file instanceof File) {
                        const compressed = await imageCompressor(file);
                        const url = await uploadImageToS3(compressed, "kennels/");
                        imageUrls.push(url);
                    }
                }
            } catch (error) {
                console.error("Error uploading images:", error);
                setErrorMsg("Image upload failed.");
                setSubmitting(false);
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
            rooms: cleanedRooms, // assuming this is your state variable holding room list
        };
        const res = await callServicesApi(payload);
        if (res?.success) {
            console.log("Kennel added successfully.");
            setSuccessMsg("Kennel onboarded successfully.");
            // Reset form
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
            setRooms([
                {
                    no_of_rooms: "",
                    room_type_id: "",
                    suitable_for: "",
                    price_small: "",
                    price_medium: "",
                    price_large: ""
                }
            ]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } else {
            console.error("Failed to add kennel:", res?.message || res);
            setErrorMsg(res.message || "Failed to onboard kennel.");
        }
        console.log("Submitting kennel data:", payload);
        setSubmitting(false);
    };

    const stateCityMapJson = stateCityMap();
    const cityOptions = kennelForm.state ? stateCityMapJson[kennelForm.state] || [] : [];

    const fetchKennels = async () => {
        setLoadingKennels(true);
        let payload = {
            action: "GET_KENNELS",
            session_id: localStorage.getItem("session_id"),
        };
        const res = await callServicesApi(payload);
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
        console.log(res);
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

    async function handleTabChange(tab) {
        setActiveTab(tab);
        if (tab === "list") {
            await fetchKennels();
        }
        else if (tab === "add") {
            await fetchUsers();
        }
        else if (tab === "features") {
            await fetchFeatures();
        }
        else if (tab === "roomtypes") {
            await fetchRoomTypes();
        }
    };

    useEffect(() => {
        if (activeTab === "list") {
            fetchKennels();
        }
        else if (activeTab === "add") {
            fetchUsers();
        }
        else if (activeTab === "features") {
            fetchFeatures();
        }
        else if (activeTab === "roomtypes") {
            fetchRoomTypes();
        }
    }, []);

    return (
        <>
            <div className="container py-4">
                <h3 className="mb-4">Manage Kennels</h3>
                {successMsg && (
                    <div className="alert alert-success alert-dismissible fade show py-2 d-flex justify-content-between align-items-center" role="alert">
                        <div>{successMsg}</div>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="alert"
                            aria-label="Close"
                            onClick={() => setSuccessMsg("")}
                        ></button>
                    </div>
                )}
                {errorMsg && (
                    <div className="alert alert-danger alert-dismissible fade show py-2 d-flex justify-content-between align-items-center" role="alert">
                        <div>{errorMsg}</div>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="alert"
                            aria-label="Close"
                            onClick={() => setErrorMsg("")}
                        ></button>
                    </div>
                )}

                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "list" ? "active" : ""}`}
                            style={{ color: activeTab === "list" ? "#000" : "#471915" }}
                            onClick={() => handleTabChange("list")}
                        >
                            View Kennels
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "add" ? "active" : ""}`}
                            style={{ color: activeTab === "add" ? "#000" : "#471915" }}
                            onClick={() => handleTabChange("add")}
                        >
                            Onboard Kennel
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "features" ? "active" : ""}`}
                            style={{ color: activeTab === "features" ? "#000" : "#471915" }}
                            onClick={() => handleTabChange("features")}
                        >
                            Features
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === "roomtypes" ? "active" : ""}`}
                            style={{ color: activeTab === "roomtypes" ? "#000" : "#471915" }}
                            onClick={() => handleTabChange("roomtypes")}
                        >
                            Room Types
                        </button>
                    </li>
                </ul>

                {activeTab === "list" && (
                    <div className="mt-3">
                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Search kennel by name, city, state..."
                            value={searchKennel}
                            onChange={(e) => setSearchKennel(e.target.value)}
                        />
                        <div className="row g-2 mb-3">
                            <div className="col-md-4">
                                <label className="form-label">Filter by State</label>
                                <select
                                    className="form-select"
                                    value={filters.state}
                                    onChange={(e) => setFilters({ ...filters, state: e.target.value, city: "" })}
                                >
                                    <option value="">All States</option>
                                    {[...new Set(kennelsList.map((k) => k.state))].sort().map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Filter by City</label>
                                <select
                                    className="form-select"
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
                            <div className="col-md-4">
                                <label className="form-label">Filter by Pin Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Pin Code"
                                    value={filters.pin}
                                    onChange={(e) => setFilters({ ...filters, pin: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Kennel Name</th>
                                        <th>Address</th>
                                        <th>City</th>
                                        <th>State</th>
                                        <th>Pin</th>
                                        <th>Markup %</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingKennels ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-4">
                                                <div className="spinner-border" role="status" style={{ color: "#471915" }}></div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {kennelsList
                                                .filter((k) =>
                                                    (!filters.state || k.state === filters.state) &&
                                                    (!filters.city || k.city === filters.city) &&
                                                    (!filters.pin || k.pin_code.includes(filters.pin))
                                                )
                                                .map((k) => (
                                                    <tr
                                                        key={k.id}
                                                        onClick={() => k.id && fetchKennelInfo(k.id)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <td>{k.id}</td>
                                                        <td>{k.name}</td>
                                                        <td>{k.street_address_1}{k.street_address_2 ? `, ${k.street_address_2}` : ""}</td>
                                                        <td>{k.city}</td>
                                                        <td>{k.state}</td>
                                                        <td>{k.pin_code}</td>
                                                        <td>{k.markup}%</td>
                                                        <td className="text-end">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDeleteKennel(k.id)}
                                                            >
                                                                <i className="bi bi-trash"></i> Delete
                                                            </button>
                                                        </td>

                                                    </tr>
                                                ))}
                                            {kennelsList.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted">No kennels found.</td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "add" && (
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Kennel Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={kennelForm.name}
                                    onChange={(e) => setKennelForm({ ...kennelForm, name: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Kennel Owner</label>
                                <select
                                    className="form-select"
                                    value={kennelForm.user_id}
                                    onChange={(e) => setKennelForm({ ...kennelForm, user_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="__add_new__">+ Add New User</option>
                                    {userOptions.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name} - {u.phone_number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {kennelForm.user_id === "__add_new__" && (
                                <div className="border p-3 rounded mt-2 bg-light">
                                    <h6>Add New User</h6>
                                    <div className="row g-2">
                                        <div className="col-md-6">
                                            <input
                                                type="text"
                                                placeholder="First Name"
                                                className="form-control"
                                                value={newUserForm.first_name}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <input
                                                type="text"
                                                placeholder="Last Name"
                                                className="form-control"
                                                value={newUserForm.last_name}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="form-control"
                                                value={newUserForm.email}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <input
                                                type="tel"
                                                placeholder="Phone"
                                                className="form-control"
                                                value={newUserForm.phone_number}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, phone_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                className="form-control"
                                                value={newUserForm.password_hashed}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, password_hashed: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <select
                                                className="form-select"
                                                value={newUserForm.user_type}
                                                onChange={(e) => setNewUserForm({ ...newUserForm, user_type: e.target.value })}
                                            >
                                                <option value="client">Client</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>

                                        {newUserForm.user_type === "admin" && (
                                            <div className="col-12">
                                                <label className="form-label">Access Permissions</label>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="admin-access"
                                                        checked={newUserForm.has_admin_access}
                                                        onChange={(e) => setNewUserForm({ ...newUserForm, has_admin_access: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="admin-access">Admin Access</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="boarding-access"
                                                        checked={newUserForm.has_boarding_access}
                                                        onChange={(e) => setNewUserForm({ ...newUserForm, has_boarding_access: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="boarding-access">Boarding Access</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="services-access"
                                                        checked={newUserForm.has_services_access}
                                                        onChange={(e) => setNewUserForm({ ...newUserForm, has_services_access: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="services-access">Services Access</label>
                                                </div>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="clinic-access"
                                                        checked={newUserForm.has_clinic_access}
                                                        onChange={(e) => setNewUserForm({ ...newUserForm, has_clinic_access: e.target.checked })}
                                                    />
                                                    <label className="form-check-label" htmlFor="clinic-access">Clinic Access</label>
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-md-12">
                                            <button
                                                type="button"
                                                className="btn w-100"
                                                style={{ backgroundColor: "#471915", color: "#fff" }}
                                                disabled={addingUser}
                                                onClick={async () => {
                                                    setAddingUser(true);
                                                    const payload = {
                                                        action: "ADD_USER",
                                                        session_id: localStorage.getItem("session_id"),
                                                        ...newUserForm
                                                    };

                                                    const res = await callServicesApi(payload);
                                                    if (res?.success) {
                                                        setSuccessMsg("User added succesfully. Proceed to onboard form.");
                                                        const updatedUsers = await callServicesApi({
                                                            action: "GET_ALL_USERS",
                                                            session_id: localStorage.getItem("session_id"),
                                                        });
                                                        if (updatedUsers?.success) {
                                                            setUserOptions(updatedUsers.data);
                                                            setKennelForm({ ...kennelForm, user_id: res.data?.id?.toString() || "" });
                                                        }
                                                        else if (res?.status_code === 498) {
                                                            localStorage.clear();
                                                            window.location.href = "/login";
                                                            return;
                                                        }
                                                        else {
                                                            setErrorMsg(`Kennel not added: ${res.message}`);
                                                        }
                                                    }
                                                    else if (res?.status_code === 498) {
                                                        localStorage.clear();
                                                        window.location.href = "/login";
                                                        return;
                                                    }
                                                    else {
                                                        setErrorMsg(`User not added: ${res.message}`);
                                                    }
                                                    setAddingUser(false);
                                                }}
                                            >
                                                {addingUser ? "Adding..." : "Add User"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="col-md-6">
                                <label className="form-label">Street Address 1</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={kennelForm.street_address_1}
                                    onChange={(e) => setKennelForm({ ...kennelForm, street_address_1: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Street Address 2</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={kennelForm.street_address_2}
                                    onChange={(e) => setKennelForm({ ...kennelForm, street_address_2: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Pin Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={kennelForm.pin_code}
                                    onChange={(e) => setKennelForm({ ...kennelForm, pin_code: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">State</label>
                                <select
                                    className="form-select"
                                    required
                                    value={kennelForm.state}
                                    onChange={(e) =>
                                        setKennelForm({ ...kennelForm, state: e.target.value, city: "" })
                                    }
                                >
                                    <option value="">Select State</option>
                                    {Object.keys(stateCityMapJson).map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">City</label>
                                <select
                                    className="form-select"
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
                            <div className="col-12">
                                <label className="form-label">Location</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Latitude"
                                        value={kennelForm.latitude}
                                        onChange={(e) => setKennelForm({ ...kennelForm, latitude: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Longitude"
                                        value={kennelForm.longitude}
                                        onChange={(e) => setKennelForm({ ...kennelForm, longitude: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="btn d-flex justify-content-center align-items-center"
                                        onClick={detectLocation}
                                        style={{ backgroundColor: "#471915", color: "#fff" }}
                                    >
                                        <i className="bi bi-crosshair"></i>
                                    </button>

                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Wag N Wonder Markup (%)</label>
                                <div className="d-flex align-items-center gap-3">
                                    <input
                                        type="range"
                                        className="form-range"
                                        name="markup_percentage"
                                        min="0"
                                        max="100"
                                        value={kennelForm.markup_percentage}
                                        onChange={(e) =>
                                            setKennelForm((prev) => ({
                                                ...prev,
                                                markup_percentage: e.target.value,
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        className="form-control"
                                        style={{ width: "80px" }}
                                        min="0"
                                        max="100"
                                        value={kennelForm.markup_percentage}
                                        onChange={(e) => {
                                            let val = Math.max(0, Math.min(100, Number(e.target.value)));
                                            setKennelForm((prev) => ({
                                                ...prev,
                                                markup_percentage: val,
                                            }));
                                        }}
                                    />
                                    <span>%</span>
                                </div>
                            </div>

                            <div className="col-md-12">
                                <label className="form-label">Features</label>
                                <div className="d-flex flex-wrap gap-3">
                                    {featuresList.map((feature) => (
                                        <div
                                            key={feature.id}
                                            className="form-check"
                                            style={{ minWidth: "150px" }} // optional: helps spacing
                                        >
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`feature-${feature.id}`}
                                                value={feature.id}
                                                checked={kennelForm.features.includes(feature.id.toString())}
                                                onChange={() => {
                                                    const value = feature.id.toString();
                                                    setKennelForm((prev) => {
                                                        let updated = prev.features.includes(value)
                                                            ? prev.features.filter((f) => f !== value)
                                                            : [...prev.features, value];
                                                        return { ...prev, features: updated };
                                                    });
                                                }}
                                            />
                                            <label className="form-check-label" htmlFor={`feature-${feature.id}`}>
                                                {feature.name}
                                            </label>
                                        </div>
                                    ))}
                                    {featuresList.length === 0 && (
                                        <div className="text-muted small">No features available.</div>
                                    )}
                                </div>
                            </div>

                            <div className="border rounded p-3 my-4">
                                <h6>Add Rooms</h6>
                                {rooms.map((room, index) => (
                                    <div className="row g-3 align-items-end mb-3" key={index}>
                                        <div className="col-lg-4">
                                            <label className="form-label">Room Type</label>
                                            <select
                                                className="form-select"
                                                value={room.room_type_id}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].room_type_id = e.target.value;
                                                    setRooms(updated);
                                                }}
                                            >
                                                <option value="">Select Room Type</option>
                                                {roomTypesList.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-lg-4">
                                            <label className="form-label">Suitable For</label>
                                            <select
                                                className="form-select"
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

                                        <div className="col-lg-4">
                                            <label className="form-label">No. of Rooms</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min="1"
                                                value={room.no_of_rooms}
                                                onChange={(e) => {
                                                    const updated = [...rooms];
                                                    updated[index].no_of_rooms = parseInt(e.target.value);
                                                    setRooms(updated);
                                                }}
                                            />
                                        </div>

                                        <div className="col-lg-3">
                                            <label className="form-label">Price (Small)</label>
                                            <input type="number" className="form-control" value={room.price_small} onChange={(e) => {
                                                const updated = [...rooms];
                                                updated[index].price_small = e.target.value;
                                                setRooms(updated);
                                            }} />
                                        </div>
                                        <div className="col-lg-3">
                                            <label className="form-label">Price (Medium)</label>
                                            <input type="number" className="form-control" value={room.price_medium} onChange={(e) => {
                                                const updated = [...rooms];
                                                updated[index].price_medium = e.target.value;
                                                setRooms(updated);
                                            }} />
                                        </div>
                                        <div className="col-lg-3">
                                            <label className="form-label">Price (Large)</label>
                                            <input type="number" className="form-control" value={room.price_large} onChange={(e) => {
                                                const updated = [...rooms];
                                                updated[index].price_large = e.target.value;
                                                setRooms(updated);
                                            }} />
                                        </div>

                                        <div className="col-lg-3">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger w-100"
                                                onClick={() => {
                                                    const updated = rooms.filter((_, i) => i !== index);
                                                    setRooms(updated);
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className="btn mt-2"
                                    style={{ backgroundColor: "#471915", color: "#fff" }}
                                    onClick={() =>
                                        setRooms([
                                            ...rooms,
                                            {
                                                room_type_id: "",
                                                suitable_for: "",
                                                no_of_rooms: 1,
                                                price_small: "",
                                                price_medium: "",
                                                price_large: ""
                                            },
                                        ])
                                    }
                                >
                                    + Add Another Room
                                </button>
                            </div>

                            <div className="col-12">
                                <label className="form-label">Kennel Images</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={(e) => setKennelForm({ ...kennelForm, images: Array.from(e.target.files) })}
                                />
                            </div>
                            <div className="col-12 text-center">
                                <button
                                    type="submit"
                                    className="btn w-100"
                                    style={{ backgroundColor: "#471915", color: "#fff" }}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Onboarding...
                                        </>
                                    ) : (
                                        "Onboard Kennel"
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                )}

                {activeTab === "features" && (
                    <div className="mt-4">
                        <h5 className="mb-3">Manage Kennel Features</h5>

                        {/* Search Bar */}
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search features..."
                                value={featureSearch}
                                onChange={(e) => setFeatureSearch(e.target.value)}
                            />
                        </div>

                        {/* Add Feature Form */}
                        <form
                            className="input-group mb-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAddFeature();
                            }}
                        >
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Feature name"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="btn"
                                style={{ backgroundColor: "#471915", color: "#fff" }}
                                disabled={addingFeature}
                            >
                                {addingFeature ? "Adding..." : "Add"}
                            </button>

                        </form>



                        {/* Feature Table */}
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Feature Name</th>
                                        <th style={{ width: "1%", whiteSpace: "nowrap" }}>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingFeatures ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-4">
                                                <div className="d-flex justify-content-center">
                                                    <div className="spinner-border" style={{ color: "#471915" }} role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {filteredFeatures.map((feature) => (
                                                <tr key={feature.id}>
                                                    <td>{feature.id}</td>
                                                    <td>{feature.name}</td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                                            onClick={() => handleDeleteFeature(feature.id)}
                                                        >
                                                            <i className="bi bi-trash me-1"></i>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredFeatures.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="text-center text-muted">
                                                        No features found.
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === "roomtypes" && (
                    <div className="mt-4">
                        <h5 className="mb-3">Manage Room Types</h5>

                        {/* Search Bar */}
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search room types..."
                                value={roomTypeSearch}
                                onChange={(e) => setRoomTypeSearch(e.target.value)}
                            />
                        </div>

                        {/* Add Room Type Form */}
                        <form
                            className="input-group mb-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAddRoomType();
                            }}
                        >
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Room type name"
                                value={newRoomType}
                                onChange={(e) => setNewRoomType(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="btn"
                                style={{ backgroundColor: "#471915", color: "#fff" }}
                                disabled={addingRoomType}
                            >
                                {addingRoomType ? "Adding..." : "Add"}
                            </button>
                        </form>

                        {/* Room Types Table */}
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Room Type</th>
                                        <th style={{ width: "1%", whiteSpace: "nowrap" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingRoomTypes ? (
                                        <tr>
                                            <td colSpan="3" className="text-center py-4">
                                                <div className="d-flex justify-content-center">
                                                    <div
                                                        className="spinner-border"
                                                        style={{ color: "#471915" }}
                                                        role="status"
                                                    >
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {filteredRoomTypes.map((room) => (
                                                <tr key={room.id}>
                                                    <td>{room.id}</td>
                                                    <td>{room.name}</td>
                                                    <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                                            onClick={() => handleDeleteRoomType(room.id)}
                                                        >
                                                            <i className="bi bi-trash me-1"></i>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredRoomTypes.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="text-center text-muted">
                                                        No room types found.
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {zoomImages.length > 0 && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", zIndex: 2000 }}
                >
                    <button
                        className="position-absolute top-0 end-0 m-3 btn btn-light btn-sm"
                        onClick={() => {
                            setZoomImages([]);
                            setZoomIndex(0);
                        }}
                    >
                        &times;
                    </button>

                    <img
                        src={zoomImages[zoomIndex]?.image_url}
                        alt="Zoomed"
                        className="mb-4"
                        style={{ maxWidth: "90%", maxHeight: "75%", objectFit: "contain" }}
                    />

                    <div className="d-flex overflow-auto px-4 pb-3 w-100 justify-content-center flex-wrap gap-2">
                        {zoomImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img.image_url}
                                alt="Thumb"
                                onClick={() => setZoomIndex(idx)}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "cover",
                                    border: zoomIndex === idx ? "3px solid white" : "2px solid #ccc",
                                    cursor: "pointer",
                                    borderRadius: "4px"
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
            {showKennelModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        role="dialog"
                    >
                        <div className="modal-dialog modal-xl modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Kennel Info</h5>
                                    <button
                                        className="btn-close"
                                        onClick={() => {
                                            setShowKennelModal(false);
                                            setKennelInfo(null);
                                        }}
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    {kennelInfo ? (
                                        <>
                                            <div className="mb-3">
                                                <h4 className="mb-2">{kennelInfo.name}</h4>
                                                <button
                                                    className="btn btn-sm btn-outline-danger mb-3"
                                                    onClick={() => handleDeleteKennel(kennelInfo.id)}
                                                >
                                                    <i className="bi bi-trash me-1"></i> Delete
                                                </button>
                                                <p className="mb-0">
                                                    <strong>Address:</strong> {kennelInfo.street_address_1}{kennelInfo.street_address_2 && `, ${kennelInfo.street_address_2}`}, {kennelInfo.city}, {kennelInfo.state} - {kennelInfo.pin_code}
                                                </p>
                                                <p className="text-muted">
                                                    <strong>Location:</strong> Lat: {kennelInfo.latitude}, Lng: {kennelInfo.longitude}
                                                </p>
                                                <p><strong>Markup:</strong> {kennelInfo.markup}%</p>
                                            </div>

                                            {/* 📷 Images */}
                                            <div className="mb-4">
                                                <strong>Images:</strong>
                                                <div className="d-flex flex-wrap gap-2 mt-2">
                                                    {kennelInfo.images?.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img.image_url}
                                                            alt={img.alt_text}
                                                            className="img-thumbnail"
                                                            style={{ width: "100px", height: "100px", objectFit: "cover", cursor: "zoom-in" }}
                                                            onClick={() => {
                                                                setZoomImages(kennelInfo.images);
                                                                setZoomIndex(idx);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* ⭐ Features */}
                                            {kennelInfo.features?.length > 0 && (
                                                <div className="mb-4">
                                                    <strong>Features:</strong>
                                                    <ul className="mt-2">
                                                        {kennelInfo.features.map((f) => (
                                                            <li key={f.id}>{f.name}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* 🛏️ Rooms */}
                                            {kennelInfo.rooms?.length > 0 && (
                                                <div className="mb-4">
                                                    <strong>Rooms:</strong>
                                                    <div className="table-responsive mt-2">
                                                        <table className="table table-bordered table-sm align-middle">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Room Type ID</th>
                                                                    <th>Suitable For</th>
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
                                                                        <td>{r.price_small}</td>
                                                                        <td>{r.price_medium}</td>
                                                                        <td>{r.price_large}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </>
    );
};

export default ManageKennels;
