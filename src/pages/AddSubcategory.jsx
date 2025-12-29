import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";

const AddSubcategory = () => {
    const [subcategoryName, setSubcategoryName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [subcategoryLoad, setSubcategoryLoad] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [subcategoryList, setSubcategoryList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const session_id = localStorage.getItem("session_id");
    const [fetchingSubcategories, setFetchingSubcategories] = useState(true);

    const { setLoading } = useLoading();

    const fetchCategories = async () => {
        setLoading(true);
        const response = await callServicesApi({
            action: "GET_CATEGORIES",
            session_id: session_id,
        });

        if (response?.success) {
            setCategoryList(response.categories);
        }

        setLoading(false);
    };

    const fetchSubcategories = async (parentId) => {
        setFetchingSubcategories(true);
        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "GET_SUBCATEGORIES",
            category_id: parentId,
            session_id: session_id,
        };
        console.log(payload);
        const response = await callServicesApi(payload);
        if (response?.success) {
            setSubcategoryList(response.subcategories);
        }

        setFetchingSubcategories(false);
    };


    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        if (!subcategoryName.trim()) {
            setErrorMsg("Subcategory name is required.");
            setLoading(false);
            return;
        }
        if (!selectedCategory) {
            setErrorMsg("Please select a category.");
            setLoading(false);
            return;
        }

        setSubcategoryLoad(true);
        setErrorMsg("");
        setSuccessMsg("");

        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "ADD_PRODUCT_LAYERS",
            session_id: session_id,
            layer: "SUBCATEGORY",
            name: subcategoryName.trim(),
            parent_id: selectedCategory
        };
        console.log(payload);
        const response = await callServicesApi(payload);

        setSubcategoryLoad(false);

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setSuccessMsg("Subcategory added successfully.");
            setSubcategoryName("");
            fetchSubcategories(selectedCategory);
        } else {
            setErrorMsg(response?.message || "Failed to add subcategory. Check if it already exists.");
        }
        setLoading(false);
    };

    const handleDeleteSubcategory = async (subcategory_id) => {
        if (!window.confirm("Are you sure you want to delete this subcategory?")) return;
        setLoading(true);
        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "DELETE_PRODUCT_LAYERS",
            layer: "CATEGORY",
            category_id: subcategory_id,
            session_id,
        };
        const response = await callServicesApi(payload);

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setSubcategoryList((prev) => prev.filter(([id]) => id !== subcategory_id));
            setSuccessMsg("Subcategory deleted successfully.");
        } else {
            alert("Failed to delete subcategory.");
        }
        setLoading(false);
    };

    return (
        <div className="add-layer-section">
            <div className="layer-add-form">
                <h5>Add New Subcategory</h5>
                <div className="subcategory-form">
                    <div className="form-field">
                        <label>Parent Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setSubcategoryList([]);
                                fetchSubcategories(e.target.value);
                            }}
                            disabled={subcategoryLoad}
                        >
                            <option value="">-- Select Category --</option>
                            {categoryList.map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <form onSubmit={handleSubmit} className="add-inline-form">
                        <div className="filter-input-wrapper">
                            <i className="bi bi-folder2-open"></i>
                            <input
                                type="text"
                                placeholder="Enter subcategory name"
                                value={subcategoryName}
                                onChange={(e) => setSubcategoryName(e.target.value)}
                                disabled={subcategoryLoad}
                            />
                        </div>
                        <button type="submit" disabled={subcategoryLoad || !selectedCategory}>
                            {subcategoryLoad ? "Adding..." : "Add Subcategory"}
                        </button>
                    </form>
                </div>

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
                    <h5>Existing Subcategories</h5>
                    <div className="filter-input-wrapper">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search subcategories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {selectedCategory === "" ? (
                    <div className="manage-products-empty small">
                        <i className="bi bi-arrow-up-circle"></i>
                        <p>Select a category to view subcategories</p>
                    </div>
                ) : fetchingSubcategories ? (
                    <div className="manage-products-loading">
                        <div className="spinner-border" role="status" />
                    </div>
                ) : subcategoryList.length === 0 ? (
                    <div className="manage-products-empty small">
                        <i className="bi bi-folder2-open"></i>
                        <p>No subcategories available</p>
                    </div>
                ) : (
                    <div className="layer-items-list">
                        {subcategoryList
                            // eslint-disable-next-line no-unused-vars
                            .filter(([id, name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(([id, name]) => (
                                <div key={id} className="layer-item">
                                    <div className="layer-item-info">
                                        <span className="item-id">#{id}</span>
                                        <span className="item-name">{name}</span>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDeleteSubcategory(id)}>
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

export default AddSubcategory;
