import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";

const AddBrand = () => {
    const [brandName, setBrandName] = useState("");
    const [brandLoad, setBrandLoad] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [brandList, setBrandList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [fetchingBrands, setFetchingBrands] = useState(true);
    const { setLoading } = useLoading();

    const fetchBrands = async () => {
        setFetchingBrands(true);
        const session_id = localStorage.getItem("session_id");
        const response = await callServicesApi({
            action: "GET_BRANDS",
            session_id,
        });

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setBrandList(response.brands);
        }
        setFetchingBrands(false);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        if (!brandName.trim()) {
            setErrorMsg("Brand name is required.");
            setLoading(false);
            return;
        }

        setBrandLoad(true);
        setErrorMsg("");
        setSuccessMsg("");

        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "ADD_PRODUCT_LAYERS",
            session_id: session_id,
            layer: "BRAND",
            name: brandName.trim(),
        }
        console.log(payload);
        const response = await callServicesApi(payload);

        setBrandLoad(false);

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setSuccessMsg("Brand added successfully.");
            setBrandName("");
            fetchBrands();
        } else {
            setErrorMsg(response?.message || "Failed to add brand. Check if the brand already exists.");
        }
        setLoading(false);
    };

    const handleDeleteBrand = async (brand_id) => {
        if (!window.confirm("Are you sure you want to delete this brand?")) return;
        setLoading(true);
        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "DELETE_PRODUCT_LAYERS",
            layer: "BRAND",
            brand_id: brand_id,
            session_id: session_id,
        };
        console.log(payload);
        const response = await callServicesApi(payload);

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setBrandList((prev) => prev.filter(([id]) => id !== brand_id));
            setSuccessMsg("Brand deleted successfully.");
        } else {
            alert("Failed to delete brand.");
        }
        setLoading(false);
    };

    return (
        <div className="add-layer-section">
            <div className="layer-add-form">
                <h5>Add New Brand</h5>
                <form onSubmit={handleSubmit} className="add-inline-form">
                    <div className="filter-input-wrapper">
                        <i className="bi bi-tag"></i>
                        <input
                            type="text"
                            placeholder="Enter brand name"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            disabled={brandLoad}
                        />
                    </div>
                    <button type="submit" disabled={brandLoad}>
                        {brandLoad ? "Adding..." : "Add Brand"}
                    </button>
                </form>

                {errorMsg && (
                    <div className="manage-products-alert error">
                        <i className="bi bi-exclamation-circle"></i>
                        <span>{errorMsg}</span>
                        <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                    </div>
                )}
                {successMsg && (
                    <div className="manage-products-alert success">
                        <i className="bi bi-check-circle"></i>
                        <span>{successMsg}</span>
                        <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                    </div>
                )}
            </div>

            <div className="layer-list-section">
                <div className="layer-list-header">
                    <h5>Existing Brands</h5>
                    <div className="filter-input-wrapper">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {fetchingBrands ? (
                    <div className="manage-products-loading">
                        <div className="spinner-border" role="status" />
                    </div>
                ) : brandList.length === 0 ? (
                    <div className="manage-products-empty small">
                        <i className="bi bi-tag"></i>
                        <p>No brands available</p>
                    </div>
                ) : (
                    <div className="layer-items-list">
                        {brandList
                            // eslint-disable-next-line no-unused-vars
                            .filter(([id, name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(([id, name]) => (
                                <div key={id} className="layer-item">
                                    <div className="layer-item-info">
                                        <span className="item-id">#{id}</span>
                                        <span className="item-name">{name}</span>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDeleteBrand(id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddBrand;
