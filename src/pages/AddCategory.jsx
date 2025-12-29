import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";

const AddCategory = () => {
    const [categoryName, setCategoryName] = useState("");
    const [categoryLoad, setCategoryLoad] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [categoryList, setCategoryList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [fetchingCategories, setFetchingCategories] = useState(true);
    const { setLoading } = useLoading();

    const fetchCategories = async () => {
        setFetchingCategories(true);
        const session_id = localStorage.getItem("session_id");
        const response = await callServicesApi({
            action: "GET_CATEGORIES",
            session_id,
        });

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setCategoryList(response.categories);
        }
        setFetchingCategories(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        if (!categoryName.trim()) {
            setErrorMsg("Category name is required.");
            setLoading(false);
            return;
        }

        setCategoryLoad(true);
        setErrorMsg("");
        setSuccessMsg("");

        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "ADD_PRODUCT_LAYERS",
            session_id,
            layer: "CATEGORY",
            name: categoryName.trim(),
        };
        console.log(payload);
        const response = await callServicesApi(payload);

        setCategoryLoad(false);

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setSuccessMsg("Category added successfully.");
            setCategoryName("");
            fetchCategories();
        } else {
            setErrorMsg(response?.message || "Failed to add category. Check if the category already exists.");
        }
        setLoading(false);
    };

    const handleDeleteCategory = async (category_id) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        setLoading(true);
        const session_id = localStorage.getItem("session_id");
        let payload = {
            action: "DELETE_PRODUCT_LAYERS",
            layer: "CATEGORY",
            category_id,
            session_id,
        };
        console.log(payload);
        const response = await callServicesApi(payload);

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setCategoryList((prev) => prev.filter(([id]) => id !== category_id));
            setSuccessMsg("Subcategory deleted successfully.");
        } else {
            alert("Failed to delete category.");
        }
        setLoading(false);
    };

    return (
        <div className="add-layer-section">
            <div className="layer-add-form">
                <h5>Add New Category</h5>
                <form onSubmit={handleSubmit} className="add-inline-form">
                    <div className="filter-input-wrapper">
                        <i className="bi bi-folder"></i>
                        <input
                            type="text"
                            placeholder="Enter category name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            disabled={categoryLoad}
                        />
                    </div>
                    <button type="submit" disabled={categoryLoad}>
                        {categoryLoad ? "Adding..." : "Add Category"}
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
                    <h5>Existing Categories</h5>
                    <div className="filter-input-wrapper">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {fetchingCategories ? (
                    <div className="manage-products-loading">
                        <div className="spinner-border" role="status" />
                    </div>
                ) : categoryList.length === 0 ? (
                    <div className="manage-products-empty small">
                        <i className="bi bi-folder"></i>
                        <p>No categories available</p>
                    </div>
                ) : (
                    <div className="layer-items-list">
                        {categoryList
                            // eslint-disable-next-line no-unused-vars
                            .filter(([id, name]) => name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(([id, name]) => (
                                <div key={id} className="layer-item">
                                    <div className="layer-item-info">
                                        <span className="item-id">#{id}</span>
                                        <span className="item-name">{name}</span>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDeleteCategory(id)}>
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

export default AddCategory;
