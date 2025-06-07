import React, { useState } from "react";
import ViewProducts from "./ViewProducts";
import AddBrand from "./AddBrand";
import AddCategory from "./AddCategory";
import AddSubcategory from "./AddSubcategory";
import AddProduct from "./AddProduct";


const ManageProducts = () => {
    const [activeTab, setActiveTab] = useState("view");

    return (
        <div>
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "view" ? "active" : ""}`}
                        style={{ color: activeTab === "view" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("view")}
                    >
                        View Products
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "add" ? "active" : ""}`}
                        style={{ color: activeTab === "add" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("add")}
                    >
                        Add Product
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "category" ? "active" : ""}`}
                        style={{ color: activeTab === "category" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("category")}
                    >
                        Add Category
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "subcategory" ? "active" : ""}`}
                        style={{ color: activeTab === "subcategory" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("subcategory")}
                    >
                        Add Subcategory
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "brand" ? "active" : ""}`}
                        style={{ color: activeTab === "brand" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("brand")}
                    >
                        Add Brand
                    </button>
                </li>
            </ul>

            <div>
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
