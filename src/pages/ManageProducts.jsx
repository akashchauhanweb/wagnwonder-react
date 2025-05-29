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
                        onClick={() => setActiveTab("view")}
                    >
                        View Products
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "add" ? "active" : ""}`}
                        onClick={() => setActiveTab("add")}
                    >
                        Add Product
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "category" ? "active" : ""}`}
                        onClick={() => setActiveTab("category")}
                    >
                        Add Category
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "subcategory" ? "active" : ""}`}
                        onClick={() => setActiveTab("subcategory")}
                    >
                        Add Subcategory
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "brand" ? "active" : ""}`}
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
                {activeTab === "subcategory" && <AddSubcategory/>}
                {activeTab === "brand" && <AddBrand />}
            </div>
        </div>
    );
};

export default ManageProducts;
