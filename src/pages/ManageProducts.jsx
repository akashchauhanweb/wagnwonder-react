import React, { useState } from "react";
import ViewProducts from "./ViewProducts";
import AddBrand from "./AddBrand";
import AddCategory from "./AddCategory";
import AddSubcategory from "./AddSubcategory";
import AddProduct from "./AddProduct";

const ManageProducts = () => {
    const [activeTab, setActiveTab] = useState("view");

    return (
        <div className="manage-products">
            <div className="manage-products-header">
                <h2>Manage Products</h2>
            </div>

            <div className="manage-products-submenu">
                <button
                    className={`submenu-item ${activeTab === "view" ? "active" : ""}`}
                    onClick={() => setActiveTab("view")}
                >
                    <i className="bi bi-box-seam"></i>
                    View Products
                </button>
                <button
                    className={`submenu-item ${activeTab === "add" ? "active" : ""}`}
                    onClick={() => setActiveTab("add")}
                >
                    <i className="bi bi-plus-circle"></i>
                    Add Product
                </button>
                <button
                    className={`submenu-item ${activeTab === "category" ? "active" : ""}`}
                    onClick={() => setActiveTab("category")}
                >
                    <i className="bi bi-folder"></i>
                    Categories
                </button>
                <button
                    className={`submenu-item ${activeTab === "subcategory" ? "active" : ""}`}
                    onClick={() => setActiveTab("subcategory")}
                >
                    <i className="bi bi-folder2-open"></i>
                    Subcategories
                </button>
                <button
                    className={`submenu-item ${activeTab === "brand" ? "active" : ""}`}
                    onClick={() => setActiveTab("brand")}
                >
                    <i className="bi bi-tag"></i>
                    Brands
                </button>
            </div>

            <div className="manage-products-content">
                {activeTab === "view" && <ViewProducts />}
                {activeTab === "add" && <AddProduct />}
                {activeTab === "category" && <AddCategory />}
                {activeTab === "subcategory" && <AddSubcategory />}
                {activeTab === "brand" && <AddBrand />}
            </div>
        </div>
    );
};

export default ManageProducts;