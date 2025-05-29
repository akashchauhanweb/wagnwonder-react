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
    const { setLoading } = useLoading();

    const fetchBrands = async () => {
        setLoading(true);
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
        setLoading(false);
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
            setSuccessMsg("Subcategory deleted successfully.");
        } else {
            alert("Failed to delete brand.");
        }
        setLoading(false);
    };

    return (
        <>
            <h5 className="card-title mb-3">Add Brand</h5>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Brand Name</label>
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-tag"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter brand name"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            disabled={brandLoad}
                        />
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={brandLoad}
                        >
                            {brandLoad ? "Adding..." : "Add"}
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

            <h5>Existing Brands</h5>

            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Brand Name</th>
                            <th className="text-end" style={{ width: "1%" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brandList
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
                                            onClick={() => handleDeleteBrand(id)}
                                        >
                                            <i className="bi bi-trash me-1"></i>
                                            Delete
                                        </button>

                                    </td>
                                </tr>
                            ))}
                        {brandList.length === 0 && (
                            <tr>
                                <td colSpan="3" className="text-center text-muted">
                                    No brands available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>

    );
};

export default AddBrand;
