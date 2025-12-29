// import React, { useState } from 'react';

const ProductDetailModal = ({ product, onClose, onDelete, onImageZoom }) => {
    if (!product) return null;

    return (
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal" onClick={(e) => e.stopPropagation()}>
                <div className="product-modal-header">
                    <h3>Product Details</h3>
                    <button onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="product-modal-body">
                    <div className="modal-product-header">
                        <div>
                            <h4>{product.product_name}</h4>
                            <span className="modal-product-id">Product #{product.product_id}</span>
                        </div>
                        <button className="modal-delete-btn" onClick={onDelete}>
                            <i className="bi bi-trash"></i>
                            Delete
                        </button>
                    </div>

                    {product.description && (
                        <p className="modal-product-description">{product.description}</p>
                    )}

                    <div className="modal-section">
                        <h5>Classification</h5>
                        <div className="modal-details-grid">
                            <div className="modal-detail">
                                <span className="detail-label">Category</span>
                                <span className="detail-value">{product.category_name}</span>
                            </div>
                            <div className="modal-detail">
                                <span className="detail-label">Subcategory</span>
                                <span className="detail-value">{product.subcategory_name || "—"}</span>
                            </div>
                            <div className="modal-detail">
                                <span className="detail-label">Brand</span>
                                <span className="detail-value">{product.brand_name}</span>
                            </div>
                            <div className="modal-detail">
                                <span className="detail-label">Suitable For</span>
                                <span className="detail-value">{product.suitable_for || "—"}</span>
                            </div>
                        </div>
                    </div>

                    {product.images?.length > 0 && (
                        <div className="modal-section">
                            <h5>Images ({product.images.length})</h5>
                            <div className="modal-images-grid">
                                {product.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img.image_url}
                                        alt={img.alt_text}
                                        onClick={() => onImageZoom(product.images, idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {product.attributes?.length > 0 && (
                        <div className="modal-section">
                            <h5>Attributes ({product.attributes.length})</h5>
                            <div className="modal-attributes-list">
                                {product.attributes.map((attr, idx) => (
                                    <div key={idx} className="attribute-item">
                                        <span className="attribute-name">{attr.attribute_name}</span>
                                        <span className="attribute-value">{attr.attribute_value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {product.variants?.length > 0 && (
                        <div className="modal-section">
                            <h5>Variants ({product.variants.length})</h5>
                            <div className="modal-variants-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Variant</th>
                                            <th>SKU</th>
                                            <th>Price</th>
                                            <th>Disc. Price</th>
                                            <th>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.variants.map((v, idx) => (
                                            <tr key={idx}>
                                                <td className="variant-name">{v.variant_name}</td>
                                                <td className="variant-sku">{v.sku || "—"}</td>
                                                <td>₹{v.price}</td>
                                                <td>₹{v.discount_price}</td>
                                                <td className={v.stock_quantity < 10 ? "low-stock" : ""}>
                                                    {v.stock_quantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;