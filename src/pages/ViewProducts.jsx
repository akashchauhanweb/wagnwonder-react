import React, { useEffect, useState } from "react";
import ProductDetailModal from '../assets/components/ProductDetailModal';
import ImageZoomModal from '../assets/components/ImageZoomModal';
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
        <div className="view-products">
            {/* Filters */}
            <div className="products-filters">
                <div className="filter-row">
                    <div className="filter-field search-field">
                        <div className="filter-input-wrapper">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="filter-field">
                        <select
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
                    <div className="filter-field">
                        <select
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
                    <div className="filter-field">
                        <select
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
            </div>

            {/* Alerts */}
            {successMsg && (
                <div className="manage-products-alert success">
                    <i className="bi bi-check-circle"></i>
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}
            {errorMsg && (
                <div className="manage-products-alert error">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg("")}><i className="bi bi-x"></i></button>
                </div>
            )}

            {/* Results Summary */}
            <div className="products-results-summary">
                Showing {filtered.length} of {products.length} products
            </div>

            {/* Products Table */}
            {fetchingProducts ? (
                <div className="manage-products-loading">
                    <div className="spinner-border" role="status" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="manage-products-empty">
                    <i className="bi bi-box-seam"></i>
                    <p>No products found</p>
                </div>
            ) : (
                <div className="products-table-wrapper">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Subcategory</th>
                                <th>Brand</th>
                                <th>Imgs</th>
                                <th>Vars</th>
                                <th>Attrs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => (
                                <tr key={product.product_id} onClick={() => handleRowClick(product.product_id)}>
                                    <td className="product-id-cell">#{product.product_id}</td>
                                    <td className="product-name-cell">{product.product_name}</td>
                                    <td>{product.category_name}</td>
                                    <td>{product.subcategory_name || "—"}</td>
                                    <td>{product.brand_name}</td>
                                    <td>{product.no_of_images}</td>
                                    <td>{product.no_of_variants}</td>
                                    <td>{product.no_of_attributes}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Are you sure you want to delete this product?")) {
                                                    handleDeleteDirectly(product.product_id);
                                                }
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Detail Modal */}
            {showModal && (
                <ProductDetailModal
                    product={productInfo}
                    onClose={() => setShowModal(false)}
                    onDelete={handleDeleteProduct}
                    onImageZoom={(images, index) => {
                        setZoomImages(images);
                        setZoomIndex(index);
                    }}
                />
            )}

            {/* Image Zoom Modal */}
            <ImageZoomModal
                images={zoomImages}
                currentIndex={zoomIndex}
                onClose={() => { setZoomImages([]); setZoomIndex(0); }}
                onIndexChange={setZoomIndex}
            />
        </div>
    );
};

export default ViewProducts;
