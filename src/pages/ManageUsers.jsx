import React, { useEffect, useState } from "react";
import { callServicesApi } from "../assets/js/servicesApi";
import { useLoading } from "../contexts/LoadingContext";

const ManageUsers = () => {
    const [activeTab, setActiveTab] = useState("list");
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [emailFilter, setEmailFilter] = useState("");
    const [phoneFilter, setPhoneFilter] = useState("");
    const [accessFilter, setAccessFilter] = useState([]);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        user_type: "client",
        password_hashed: "",
        has_admin_access: false,
        has_boarding_access: false,
        has_services_access: false,
        has_clinic_access: false,
    });
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const { setLoading } = useLoading();

    const fetchUsers = async () => {
        setFetchingUsers(true);
        const res = await callServicesApi({
            action: "GET_ALL_USERS",
            session_id: localStorage.getItem("session_id")
        });
        if (res?.success) setUsers(res.data || []);
        else if (res?.status_code === 498) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
        setFetchingUsers(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        setLoading(true);
        let payload = {
            action: "DELETE_USER",
            user_id: id,
            session_id: localStorage.getItem("session_id")
        };
        const res = await callServicesApi(payload);
        if (res?.success) {
            fetchUsers();
            setSuccessMsg("User deleted successfully.");
            setTimeout(() => setSuccessMsg(""), 3000);
        } else {
            setErrorMsg(res?.message || "Failed to delete user.");
            setTimeout(() => setErrorMsg(""), 3000);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const matchesSearch = (user) => (
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesAccess = (user) => {
        if (accessFilter.length === 0) return true;
        return accessFilter.some(filter => {
            if (filter === "admin") return user.has_admin_access;
            if (filter === "boarding") return user.has_boarding_access;
            if (filter === "services") return user.has_services_access;
            if (filter === "clinic") return user.has_clinic_access;
            return false;
        });
    };

    const filteredUsers = users.filter(user =>
        matchesSearch(user) &&
        matchesAccess(user) &&
        user.email.toLowerCase().includes(emailFilter.toLowerCase()) &&
        user.phone_number.includes(phoneFilter)
    );

    const handleAccessChange = (e) => {
        const { options } = e.target;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) selected.push(options[i].value);
        }
        setAccessFilter(selected);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let payload = {
            action: "ADD_USER",
            session_id: localStorage.getItem("session_id"),
            ...formData
        }
        console.log(payload);
        const res = await callServicesApi(payload);

        if (res?.success) {
            setSuccessMsg("User added successfully.");
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                phone_number: "",
                password_hashed: "",
                user_type: "client",
                has_admin_access: false,
                has_boarding_access: false,
                has_services_access: false,
                has_clinic_access: false,
            });
            fetchUsers(); // refresh list
        } else {
            setErrorMsg(res?.message || "Failed to add user.");
        }

        setTimeout(() => {
            setSuccessMsg("");
            setErrorMsg("");
        }, 3000);
        setLoading(false);
    };


    return (
        <div className="container py-4">
            <h3 className="mb-4">Manage Users</h3>

            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "list" ? "active" : ""}`}
                        style={{ color: activeTab === "list" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("list")}
                    >
                        List Users
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "add" ? "active" : ""}`}
                        style={{ color: activeTab === "add" ? "#000" : "#471915" }}
                        onClick={() => setActiveTab("add")}
                    >
                        Add User
                    </button>
                </li>
            </ul>


            {activeTab === "list" && (
                <div>
                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Search Users</label>
                            <input
                                type="text"
                                placeholder="Search by name or email"
                                className="form-control"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Filter by Email</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter email"
                                value={emailFilter}
                                onChange={(e) => setEmailFilter(e.target.value)}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Filter by Mobile</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter phone number"
                                value={phoneFilter}
                                onChange={(e) => setPhoneFilter(e.target.value)}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Select filter</label>
                            <select
                                className="form-select"
                                multiple
                                value={accessFilter}
                                onChange={handleAccessChange}
                            >
                                <option value="admin">Admin</option>
                                <option value="boarding">Boarding</option>
                                <option value="services">Services</option>
                                <option value="clinic">Clinic</option>
                            </select>
                            <div className="form-text">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</div>
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

                    <div className="table-responsive">
                        <table className="table table-bordered">
                            <thead className="table-light">
                                <tr>
                                    <th>Id</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Access</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fetchingUsers ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">
                                            <div
                                                className="spinner-border"
                                                role="status"
                                                style={{ borderColor: "#471915", borderRightColor: "transparent" }}
                                            />
                                        </td>
                                    </tr>
                                ) : filteredUsers.length ? (
                                    filteredUsers.map((u, idx) => (  // eslint-disable-line
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.first_name} {u.last_name}</td>
                                            <td>{u.email}</td>
                                            <td>{u.phone_number}</td>
                                            <td>
                                                {u.has_admin_access ? "Admin, " : ""}
                                                {u.has_boarding_access ? "Boarding, " : ""}
                                                {u.has_services_access ? "Services, " : ""}
                                                {u.has_clinic_access ? "Clinic" : ""}
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                                                    onClick={() => handleDelete(u.id)}
                                                >
                                                    <i className="bi bi-trash me-1"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>


                </div>
            )}

            {activeTab === "add" && (
                <div>
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

                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">First Name</label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Last Name</label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-control"
                                required
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                required
                                value={formData.password_hashed}
                                onChange={(e) => setFormData({ ...formData, password_hashed: e.target.value })}
                            />
                        </div>


                        <div className="col-md-6">
                            <label className="form-label">User Type</label>
                            <select
                                className="form-select"
                                value={formData.user_type}
                                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                            >
                                <option value="client">Client</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {formData.user_type === "admin" && (
                            <div className="col-12">
                                <label className="form-label">Access Permissions</label>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="admin"
                                        checked={formData.has_admin_access}
                                        onChange={(e) => setFormData({ ...formData, has_admin_access: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="admin">Admin Access</label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="boarding"
                                        checked={formData.has_boarding_access}
                                        onChange={(e) => setFormData({ ...formData, has_boarding_access: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="boarding">Boarding Access</label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="services"
                                        checked={formData.has_services_access}
                                        onChange={(e) => setFormData({ ...formData, has_services_access: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="services">Services Access</label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="clinic"
                                        checked={formData.has_clinic_access}
                                        onChange={(e) => setFormData({ ...formData, has_clinic_access: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="clinic">Clinic Access</label>
                                </div>
                            </div>
                        )}

                        <div className="col-12 d-flex justify-content-center align-items-center">
                            <button type="submit" className="btn col-12" style={{ backgroundColor: "#471915", color: "#fff" }}>
                                Add User
                            </button>

                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
