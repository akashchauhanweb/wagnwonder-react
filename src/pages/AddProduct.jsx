import React, { useState, useEffect } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { imageCompressor } from "../assets/js/imageCompressor";
import { uploadImageToS3 } from "../assets/js/uploadImageToS3";
import { useLoading } from "../contexts/LoadingContext";

const AddProduct = () => {
    const [categories, setCategories] = useState({});
    const [subcategories, setSubcategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        price: "",
        discount_price: "",
        stock_quantity: "",
        category_id: "",
        subcategory_id: "",
        brand_id: "",
        suitable_for: "",
    });

    const [showVariant, setShowVariant] = useState(false);
    const [showAttributes, setShowAttributes] = useState(false);
    const [variants, setVariants] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [images, setImages] = useState([]);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const { setLoading } = useLoading();

    useEffect(() => {
        fetchProductLayers();
    }, []);

    const handleCategoryChange = (e) => {
        const selectedCatId = e.target.value;
        const subcats = categories[selectedCatId]?.subcategories || [];
        setSubcategories(subcats);
        setFormData(prev => ({
            ...prev,
            category_id: selectedCatId,
            subcategory_id: "" // reset subcategory
        }));
    };


    const fetchProductLayers = async () => {
        const session_id = localStorage.getItem("session_id");
        const res = await callServicesApi({
            action: "GET_PRODUCT_LAYERS",
            session_id,
        });

        if (res?.success) {
            const data = res.data;
            setCategories(data.categories || {});
            setBrands(data.brands || {});
        }
    };


    const handleAddVariant = () => {
        setVariants(prev => [
            ...prev,
            {
                name: "",
                sku: "",
                price: "",
                discount_price: "",
                stock_quantity: ""
            }
        ]);
    };

    const handleVariantChange = (index, e) => {
        const { name, value } = e.target;
        const updatedVariants = [...variants];
        updatedVariants[index][name] = value;
        setVariants(updatedVariants);
    };

    const handleAddAttribute = () => {
        setAttributes(prev => [...prev, { name: "", value: "" }]);
    };

    const handleAttributeChange = (index, e) => {
        const { name, value } = e.target;
        const updated = [...attributes];
        updated[index][name] = value;
        setAttributes(updated);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        setImages(Array.from(e.target.files));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.description) {
            setErrorMsg("Product name and description are required.");
            return;
        }

        if (!showVariant) {
            if (!formData.price || !formData.stock_quantity) {
                setErrorMsg("Price and stock quantity are required for non-variant products.");
                return;
            }
        } else {
            const invalidVariant = variants.some(
                v => !v.name || !v.price || !v.stock_quantity
            );
            if (invalidVariant) {
                setErrorMsg("Each variant must have a name, price, and stock quantity.");
                return;
            }
        }


        if (images.length === 0) {
            setErrorMsg("At least one product image is required.");
            return;
        }

        setLoading(true);

        const session_id = localStorage.getItem("session_id");
        if (!session_id) return alert("Session expired. Please log in again.");

        const payload = {
            action: "ADD_PRODUCT",
            session_id,
            name: formData.name,
            description: formData.description,
            category_id: parseInt(formData.category_id),
            subcategory_id: parseInt(formData.subcategory_id),
            brand_id: parseInt(formData.brand_id),
            suitable_for: formData.suitable_for,
            variants: showVariant
                ? variants.map(v => ({
                    name: v.name,
                    sku: v.sku,
                    price: parseFloat(v.price) || 0,
                    discounted_price: parseFloat(v.discount_price) || 0,
                    stock_quantity: parseInt(v.stock_quantity) || 0
                }))
                : [{
                    name: formData.name,
                    sku: formData.sku,
                    price: parseFloat(formData.price) || 0,
                    discounted_price: parseFloat(formData.discount_price) || 0,
                    stock_quantity: parseInt(formData.stock_quantity) || 0
                }],
            attributes: showAttributes
                ? attributes.filter(attr => attr.name && attr.value)
                : []
        };

        const image_urls = [];

        for (const file of images) {
            try {
                const compressedFile = await imageCompressor(file); // if needed
                const imageUrl = await uploadImageToS3(compressedFile, "products/");
                image_urls.push(imageUrl);
            } catch (error) {
                console.error("Image upload failed:", error);
                alert("Failed to upload product image.");
                setLoading(false);
                return;
            }
        }

        payload.image_urls = image_urls;
        // console.log(payload);
        const res = await callServicesApi(payload);

        if (res?.success) {
            setSuccessMsg("Product added successfully!");
            setFormData({
                name: "",
                description: "",
                sku: "",
                price: "",
                discount_price: "",
                stock_quantity: "",
                category_id: "",
                subcategory_id: "",
                brand_id: "",
                suitable_for: "",
            });
            setVariants([]);
            setAttributes([]);
            setImages([]);
            setShowVariant(false);
            setShowAttributes(false);
        } else if (res?.status_code === 498) {
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "/login.html";
        } else {
            setErrorMsg(res?.message || "Failed to add product.");
        }
        setLoading(false);
    };

    return (
        <div className="add-product-section">
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

            <form onSubmit={handleSubmit} className="add-product-form">
                {/* Basic Info Section */}
                <div className="form-section">
                    <h5 className="form-section-title">
                        <i className="bi bi-info-circle"></i>
                        Basic Information
                    </h5>
                    <div className="form-grid">
                        <div className="form-field full-width">
                            <label>Product Name *</label>
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Enter product name"
                                value={formData.name} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-field full-width">
                            <label>Description *</label>
                            <textarea 
                                name="description" 
                                rows="3" 
                                placeholder="Enter product description"
                                value={formData.description} 
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        <div className="form-field">
                            <label>Suitable For *</label>
                            <select
                                name="suitable_for"
                                value={formData.suitable_for}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                                <option value="bird">Bird</option>
                                <option value="others">Others</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Classification Section */}
                <div className="form-section">
                    <h5 className="form-section-title">
                        <i className="bi bi-folder"></i>
                        Classification
                    </h5>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Category *</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleCategoryChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {Object.entries(categories).map(([id, cat]) => (
                                    <option key={id} value={id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Subcategory *</label>
                            <select
                                name="subcategory_id"
                                value={formData.subcategory_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.category_id}
                            >
                                <option value="">Select Subcategory</option>
                                {subcategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Brand *</label>
                            <select
                                name="brand_id"
                                value={formData.brand_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Brand</option>
                                {Object.entries(brands).map(([id, brand]) => (
                                    <option key={id} value={id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Variants Toggle */}
                <div className="form-section">
                    <div className="toggle-switch-row">
                        <label className="toggle-switch">
                            <input 
                                type="checkbox" 
                                checked={showVariant} 
                                onChange={() => setShowVariant(!showVariant)} 
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="toggle-label">Does this product have variants?</span>
                    </div>

                    {showVariant ? (
                        <div className="variants-section">
                            <h5 className="form-section-title">
                                <i className="bi bi-layers"></i>
                                Product Variants
                            </h5>
                            {variants.map((variant, index) => (
                                <div key={index} className="variant-entry">
                                    <div className="variant-header">
                                        <span>Variant {index + 1}</span>
                                        <button 
                                            type="button" 
                                            className="remove-btn"
                                            onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                    <div className="variant-grid">
                                        <div className="form-field full-width">
                                            <label>Variant Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="e.g., 500g, Large, Red"
                                                value={variant.name}
                                                onChange={(e) => handleVariantChange(index, e)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>SKU</label>
                                            <input
                                                type="text"
                                                name="sku"
                                                placeholder="SKU"
                                                value={variant.sku}
                                                onChange={(e) => handleVariantChange(index, e)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Price *</label>
                                            <input
                                                type="number"
                                                name="price"
                                                placeholder="₹"
                                                value={variant.price}
                                                onChange={(e) => handleVariantChange(index, e)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Discount Price</label>
                                            <input
                                                type="number"
                                                name="discount_price"
                                                placeholder="₹"
                                                value={variant.discount_price}
                                                onChange={(e) => handleVariantChange(index, e)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Stock *</label>
                                            <input
                                                type="number"
                                                name="stock_quantity"
                                                placeholder="Qty"
                                                value={variant.stock_quantity}
                                                onChange={(e) => handleVariantChange(index, e)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="add-more-btn" onClick={handleAddVariant}>
                                <i className="bi bi-plus-circle"></i>
                                Add Variant
                            </button>
                        </div>
                    ) : (
                        <div className="pricing-section">
                            <h5 className="form-section-title">
                                <i className="bi bi-currency-rupee"></i>
                                Pricing & Stock
                            </h5>
                            <div className="form-grid four-col">
                                <div className="form-field">
                                    <label>SKU</label>
                                    <input 
                                        type="text" 
                                        name="sku" 
                                        placeholder="SKU"
                                        value={formData.sku} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Price *</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        placeholder="₹"
                                        value={formData.price} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Discount Price</label>
                                    <input 
                                        type="number" 
                                        name="discount_price" 
                                        placeholder="₹"
                                        value={formData.discount_price} 
                                        onChange={handleChange} 
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Stock Quantity *</label>
                                    <input 
                                        type="number" 
                                        name="stock_quantity" 
                                        placeholder="Qty"
                                        value={formData.stock_quantity} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Attributes Toggle */}
                <div className="form-section">
                    <div className="toggle-switch-row">
                        <label className="toggle-switch">
                            <input 
                                type="checkbox" 
                                checked={showAttributes} 
                                onChange={() => setShowAttributes(!showAttributes)} 
                            />
                            <span className="toggle-slider"></span>
                        </label>
                        <span className="toggle-label">Add custom attributes?</span>
                    </div>

                    {showAttributes && (
                        <div className="attributes-section">
                            <h5 className="form-section-title">
                                <i className="bi bi-list-check"></i>
                                Custom Attributes
                            </h5>
                            {attributes.map((attr, index) => (
                                <div key={index} className="attribute-entry">
                                    <div className="form-field">
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Attribute Name"
                                            value={attr.name}
                                            onChange={(e) => handleAttributeChange(index, e)}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <input
                                            type="text"
                                            name="value"
                                            placeholder="Attribute Value"
                                            value={attr.value}
                                            onChange={(e) => handleAttributeChange(index, e)}
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        className="remove-btn"
                                        onClick={() => setAttributes(attributes.filter((_, i) => i !== index))}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="add-more-btn" onClick={handleAddAttribute}>
                                <i className="bi bi-plus-circle"></i>
                                Add Attribute
                            </button>
                        </div>
                    )}
                </div>

                {/* Images Section */}
                <div className="form-section">
                    <h5 className="form-section-title">
                        <i className="bi bi-images"></i>
                        Product Images *
                    </h5>
                    <div className="form-field">
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handleImageChange} 
                        />
                        <span className="file-hint">You can select multiple images</span>
                    </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-btn">
                    <i className="bi bi-plus-lg"></i>
                    Save Product
                </button>
            </form>
        </div>
    );
};

export default AddProduct;
