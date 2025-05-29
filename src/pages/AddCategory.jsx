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
    const { setLoading } = useLoading();

    const fetchCategories = async () => {
        setLoading(true);
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
        setLoading(false);
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
        <>
            <h5 className="card-title mb-3">Add Category</h5>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Category Name</label>
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-folder"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter category name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            disabled={categoryLoad}
                        />
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={categoryLoad}
                        >
                            {categoryLoad ? "Adding..." : "Add"}
                        </button>
                    </div>
                </div>
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

            </form>
            <hr className="my-4" />

            <h5>Existing Categories</h5>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Category Name</th>
                            <th className="text-end" style={{ width: "1%" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categoryList
                            .filter(([id, name]) => // eslint-disable-line
                                name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(([id, name]) => (
                                <tr key={id}>
                                    <td>{id}</td>
                                    <td>{name}</td>
                                    <td className="text-end">
                                        <button
                                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                            onClick={() => handleDeleteCategory(id)}
                                        >
                                            <i className="bi bi-trash me-1"></i>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        {categoryList.length === 0 && (
                            <tr>
                                <td colSpan="3" className="text-center text-muted">
                                    No categories available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default AddCategory;
