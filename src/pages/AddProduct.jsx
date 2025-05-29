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
                brand_id: ""
            });
            setVariants([]);
            setAttributes([]);
            setImages([]);
            setShowVariant(false);
            setShowAttributes(false);
            setLoading(false);
        } else if (res?.status_code === 498) {
            setLoading(false);
            alert("Session expired. Please login again.");
            localStorage.clear();
            window.location.href = "/login.html";
        } else {
            setLoading(false);
            setErrorMsg(res?.message || "Failed to add product.");
        }
    };


    return (
        <>
            <h5 className="card-title mb-3">Add New Product</h5>
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
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Product Name</label>
                    <input type="text" name="name" className="form-control" value={formData.name} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange}></textarea>
                </div>
                <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="hasVariant" checked={showVariant} onChange={() => setShowVariant(!showVariant)} />
                    <label className="form-check-label" htmlFor="hasVariant">Does this product have a variant?</label>
                </div>
                {showVariant && (
                    <>
                        {variants.map((variant, index) => (
                            <div key={index} className="border p-3 mb-3 rounded">
                                <h6 className="mb-3">Variant {index + 1}</h6>
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Variant Name"
                                            value={variant.name}
                                            onChange={(e) => handleVariantChange(index, e)}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="text"
                                            name="sku"
                                            placeholder="SKU"
                                            value={variant.sku}
                                            onChange={(e) => handleVariantChange(index, e)}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="number"
                                            name="price"
                                            placeholder="Price"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(index, e)}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="number"
                                            name="discount_price"
                                            placeholder="Discount Price"
                                            value={variant.discount_price}
                                            onChange={(e) => handleVariantChange(index, e)}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            placeholder="Stock"
                                            value={variant.stock_quantity}
                                            onChange={(e) => handleVariantChange(index, e)}
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className="btn btn-outline-secondary d-flex justify-content-center align-items-center gap-2 shadow-sm px-4 py-2 w-100"
                        >
                            <i className="bi bi-plus-circle"></i>
                            Add Variant
                        </button>


                    </>
                )}

                {!showVariant && (
                    <>
                        <div className="row g-3">
                            <div className="col-lg-3">
                                <label className="form-label">SKU</label>
                                <input type="text" name="sku" className="form-control" value={formData.sku} onChange={handleChange} />
                            </div>
                            <div className="col-lg-3">
                                <label className="form-label">Price</label>
                                <input type="number" name="price" className="form-control" value={formData.price} onChange={handleChange} />
                            </div>
                            <div className="col-lg-3">
                                <label className="form-label">Discount Price</label>
                                <input type="number" name="discount_price" className="form-control" value={formData.discount_price} onChange={handleChange} />
                            </div>
                            <div className="col-lg-3">
                                <label className="form-label">Stock Quantity</label>
                                <input type="number" name="stock_quantity" className="form-control" value={formData.stock_quantity} onChange={handleChange} />
                            </div>
                        </div>
                    </>
                )}
                <div className="form-check form-switch my-3">
                    <input className="form-check-input" type="checkbox" id="hasAttributes" checked={showAttributes} onChange={() => setShowAttributes(!showAttributes)} />
                    <label className="form-check-label" htmlFor="hasAttributes">Add Custom Attributes?</label>
                </div>

                {showAttributes && (
                    <div className="mb-4">
                        <h6 className="mb-2">Custom Attributes</h6>
                        {attributes.map((attr, index) => (
                            <div key={index} className="row g-3 mb-2">
                                <div className="col-6">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Attribute Name"
                                        className="form-control"
                                        value={attr.name}
                                        onChange={(e) => handleAttributeChange(index, e)}
                                    />
                                </div>
                                <div className="col-6">
                                    <input
                                        type="text"
                                        name="value"
                                        placeholder="Attribute Value"
                                        className="form-control"
                                        value={attr.value}
                                        onChange={(e) => handleAttributeChange(index, e)}
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddAttribute}
                            className="btn btn-outline-secondary d-flex justify-content-center align-items-center gap-2 shadow-sm px-4 py-2 w-100"
                        >
                            <i className="bi bi-plus-circle-dotted"></i>
                            Add More Attributes
                        </button>


                    </div>
                )}

                <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select
                        name="category_id"
                        className="form-select"
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


                <div className="mb-3">
                    <label className="form-label">Subcategory</label>
                    <select
                        name="subcategory_id"
                        className="form-select"
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


                <div className="mb-3">
                    <label className="form-label">Brand</label>
                    <select
                        name="brand_id"
                        className="form-select"
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


                <div className="mb-3">
                    <label className="form-label">Upload Images</label>
                    <input type="file" accept="image/*" multiple className="form-control" onChange={handleImageChange} />
                </div>

                <button type="submit" className="btn btn-primary col-12">Save Product</button>
            </form>


        </>
    );
};

export default AddProduct;
