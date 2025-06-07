import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";


const ViewProducts = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        category: "",
        subcategory: "",
        brand: "",
    });
    const [showModal, setShowModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [zoomImages, setZoomImages] = useState([]);
    const [zoomIndex, setZoomIndex] = useState(0);
    const [productInfo, setProductInfo] = useState(null);
    const [fetchingProducts, setFetchingProducts] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const fetchProducts = async () => {
        setFetchingProducts(true);
        const session_id = localStorage.getItem("session_id");

        const response = await callServicesApi({
            action: "GET_PRODUCTS_SUMMARY",
            session_id,
        });

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success && Array.isArray(response.data)) {
            setProducts(response.data);
        } else {
            setProducts([]);
        }
        setFetchingProducts(false);
    };


    useEffect(() => {
        fetchProducts();
    }, []);

    const handleRowClick = async (product_id) => {
        setShowModal(true);
        setProductInfo(null); // clear previous content
        setSelectedProductId(product_id);

        const session_id = localStorage.getItem("session_id");
        const response = await callServicesApi({
            action: "GET_PRODUCT_INFO",
            session_id,
            product_id,
        });

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setProductInfo(response.data);
        } else {
            setProductInfo(null);
        }
    };

    const handleDeleteProduct = async () => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        const session_id = localStorage.getItem("session_id");

        const response = await callServicesApi({
            action: "DELETE_PRODUCT",
            session_id,
            product_id: selectedProductId,
        });

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setSuccessMsg("Product deleted successfully.");
            setShowModal(false);
            setZoomImages([]); // reset viewer state
            setZoomIndex(0);
            fetchProducts(); // 👈 refresh main list
        } else {
            setErrorMsg("Failed to delete the product.");
        }
    };

    const handleDeleteDirectly = async (product_id) => {
        const session_id = localStorage.getItem("session_id");

        const response = await callServicesApi({
            action: "DELETE_PRODUCT",
            session_id,
            product_id,
        });

        if (response?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }

        if (response?.success) {
            setSuccessMsg("Product deleted successfully.");
            fetchProducts(); // refresh product list
        } else {
            setErrorMsg("Failed to delete the product.");
        }
    };

    // Get filtered product list
    const filtered = products.filter((p) => {
        return (
            p.product_name.toLowerCase().includes(search.toLowerCase()) &&
            (!filters.category || p.category_name === filters.category) &&
            (!filters.subcategory || p.subcategory_name === filters.subcategory) &&
            (!filters.brand || p.brand_name === filters.brand)
        );
    });

    // Dynamic filter values based on current selections
    const categories = [...new Set(products.map(p => p.category_name).filter(Boolean))];
    const subcategories = [
        ...new Set(
            products
                .filter(p => !filters.category || p.category_name === filters.category)
                .map(p => p.subcategory_name)
                .filter(Boolean)
        )
    ];
    const brands = [
        ...new Set(
            products
                .filter(p =>
                    (!filters.category || p.category_name === filters.category) &&
                    (!filters.subcategory || p.subcategory_name === filters.subcategory)
                )
                .map(p => p.brand_name)
                .filter(Boolean)
        )
    ];


    return (
        <>
            {/* Search + Filters */}
            <h5 className="card-title mb-3">View Products</h5>
            <div className="row g-3 mb-3">
                <div className="col-md-4">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={filters.category}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                category: e.target.value,
                                subcategory: "",
                                brand: ""
                            })
                        }
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                </div>

                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={filters.subcategory}
                        onChange={(e) =>
                            setFilters({ ...filters, subcategory: e.target.value, brand: "" })
                        }
                    >
                        <option value="">All Subcategories</option>
                        {subcategories.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>

                </div>

                <div className="col-md-2">
                    <select
                        className="form-select"
                        value={filters.brand}
                        onChange={(e) =>
                            setFilters({ ...filters, brand: e.target.value })
                        }
                    >
                        <option value="">All Brands</option>
                        {brands.map((brand) => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>

                </div>

            </div>

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

            {/* Table */}
            <div className="table-responsive">
                <table className="table table-bordered align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Subcategory</th>
                            <th>Brand</th>
                            <th>Images</th>
                            <th>Variants</th>
                            <th>Attributes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((product) => (
                            <tr key={product.product_id} style={{ cursor: "pointer" }} onClick={() => handleRowClick(product.product_id)}>
                                <td>{product.product_id}</td>
                                <td>{product.product_name}</td>
                                <td>{product.category_name}</td>
                                <td>{product.subcategory_name || "—"}</td>
                                <td>{product.brand_name}</td>
                                <td>{product.no_of_images}</td>
                                <td>{product.no_of_variants}</td>
                                <td>{product.no_of_attributes}</td>
                                <td className="text-end">
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Are you sure you want to delete this product?")) {
                                                handleDeleteDirectly(product.product_id);
                                            }
                                        }}
                                    >
                                        <i className="bi bi-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {fetchingProducts ? (
                            <tr>
                                <td colSpan="9" className="text-center py-4">
                                    <div className="spinner-border" role="status" style={{ borderColor: "#471915", borderRightColor: "transparent" }} />
                                </td>
                            </tr>
                        ) : filtered.length === 0 && (
                            <tr>
                                <td colSpan="9" className="text-center text-muted">
                                    No products found
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
            </div>
            {showModal && (
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
                                    <h5 className="modal-title">Product Info</h5>
                                    <div className="ms-auto d-flex gap-2">
                                        <button className="btn-close" onClick={() => setShowModal(false)}></button>
                                    </div>
                                </div>

                                <div className="modal-body">
                                    {/* ⬇️ Keep the formatted productInfo UI here */}
                                    {productInfo ? (
                                        <div>
                                            <div className="mb-3">
                                                <h4 className="mb-2">{productInfo.product_name}</h4>
                                                <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteProduct}>
                                                    <i className="bi bi-trash me-1"></i> Delete
                                                </button>
                                            </div>

                                            <p className="text-muted">{productInfo.description}</p>

                                            <div className="row mb-4">
                                                <div className="col-md-3"><strong>Category:</strong> {productInfo.category_name}</div>
                                                <div className="col-md-3"><strong>Subcategory:</strong> {productInfo.subcategory_name || "—"}</div>
                                                <div className="col-md-3"><strong>Brand:</strong> {productInfo.brand_name}</div>
                                                <div className="col-md-3"><strong>Suitable For:</strong> {productInfo.suitable_for || "—"}</div>
                                            </div>

                                            <div className="mb-4">
                                                <strong>Images:</strong>
                                                <div className="d-flex flex-wrap gap-2 mt-2">
                                                    {productInfo.images?.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img.image_url}
                                                            alt={img.alt_text}
                                                            className="img-thumbnail"
                                                            style={{ width: "100px", height: "100px", objectFit: "cover", cursor: "zoom-in" }}
                                                            onClick={() => {
                                                                setZoomImages(productInfo.images || []);
                                                                setZoomIndex(idx);
                                                            }}

                                                        />

                                                    ))}
                                                </div>
                                            </div>

                                            {productInfo.attributes?.length > 0 && (
                                                <div className="mb-4">
                                                    <strong>Attributes:</strong>
                                                    <ul className="mt-2">
                                                        {productInfo.attributes.map((attr, idx) => (
                                                            <li key={idx}><strong>{attr.attribute_name}:</strong> {attr.attribute_value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {productInfo.variants?.length > 0 && (
                                                <div className="mb-4">
                                                    <strong>Variants:</strong>
                                                    <div className="table-responsive mt-2">
                                                        <table className="table table-bordered table-sm align-middle">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Variant</th>
                                                                    <th>SKU</th>
                                                                    <th>Price</th>
                                                                    <th>Discounted Price</th>
                                                                    <th>Stock</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {productInfo.variants.map((v, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{v.variant_name}</td>
                                                                        <td>{v.sku}</td>
                                                                        <td>₹ {v.price}</td>
                                                                        <td>₹ {v.discount_price}</td>
                                                                        <td>{v.stock_quantity}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
            {zoomImages.length > 0 && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.9)", zIndex: 2000 }}
                >
                    {/* Close button */}
                    <button
                        className="position-absolute top-0 end-0 m-3 btn btn-light btn-sm"
                        onClick={() => {
                            setZoomImages([]);
                            setZoomIndex(0);
                        }}
                    >
                        &times;
                    </button>

                    {/* Main Image */}
                    <img
                        src={zoomImages[zoomIndex]?.image_url}
                        alt="Zoomed"
                        className="mb-4"
                        style={{ maxWidth: "90%", maxHeight: "75%", objectFit: "contain" }}
                    />

                    {/* Thumbnails */}
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

        </>
    );
};

export default ViewProducts;
