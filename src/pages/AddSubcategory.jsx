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
        <>
            <h5 className="card-title mb-3">Add Subcategory</h5>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Select Category</label>
                    <select
                        className="form-select"
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

                <div className="mb-3">
                    <label className="form-label">Subcategory Name</label>
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-folder2-open"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter subcategory name"
                            value={subcategoryName}
                            onChange={(e) => setSubcategoryName(e.target.value)}
                            disabled={subcategoryLoad}
                        />
                        <button
                            className="btn"
                            type="submit"
                            disabled={subcategoryLoad}
                            style={{
                                backgroundColor: "#471915",
                                color: "#fff",
                                opacity: subcategoryLoad ? 0.65 : 1,
                                cursor: subcategoryLoad ? "not-allowed" : "pointer",
                            }}
                        >
                            {subcategoryLoad ? "Adding..." : "Add"}
                        </button>

                    </div>
                </div>


                {errorMsg && (
                    <div
                        className="alert alert-danger alert-dismissible fade show py-2 d-flex justify-content-between align-items-center"
                        role="alert"
                    >
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

                {successMsg && (
                    <div
                        className="alert alert-success alert-dismissible fade show py-2 d-flex justify-content-between align-items-center"
                        role="alert"
                    >
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


            </form>

            <hr className="my-4" />
            <h5>Existing Subcategories</h5>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search subcategory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Subcategory Name</th>
                            <th className="text-end" style={{ width: "1%" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedCategory === "" ? (
                            <tr>
                                <td colSpan="3" className="text-center text-muted">
                                    Select a category to view subcategories
                                </td>
                            </tr>
                        ) : fetchingSubcategories ? (
                            <tr>
                                <td colSpan="3" className="text-center py-4">
                                    <div
                                        className="spinner-border"
                                        role="status"
                                        style={{ borderColor: "#471915", borderRightColor: "transparent" }}
                                    />
                                </td>
                            </tr>
                        ) : subcategoryList.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="text-center text-muted">
                                    No subcategories available
                                </td>
                            </tr>
                        ) : (
                            subcategoryList
                                .filter(([id, name]) =>  // eslint-disable-line
                                    name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(([id, name]) => (
                                    <tr key={id}>
                                        <td>{id}</td>
                                        <td>{name}</td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                                onClick={() => handleDeleteSubcategory(id)}
                                            >
                                                <i className="bi bi-trash me-1"></i>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        )}

                    </tbody>
                </table>
            </div>
        </>
    );
};

export default AddSubcategory;
