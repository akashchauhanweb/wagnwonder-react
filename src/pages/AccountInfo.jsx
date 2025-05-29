import { updateUser } from "../assets/js/updateUser";
import { useLoading } from "../contexts/LoadingContext";
import { useEffect, useState } from "react";

function AccountInfo() {
    const [user, setUser] = useState(localStorage.getItem("user_data") || null);
    const [editMode, setEditMode] = useState(false);
    const { setLoading } = useLoading();
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: ""
    });

    async function handleSave() {
        setLoading(true);
        const updatedUser = {
            ...user,
            ...formData
        };
        if (await updateUser(updatedUser)) {
            setUser(updatedUser);
            localStorage.setItem("user_data", JSON.stringify(updatedUser));
            setEditMode(false);
        } else {
            alert("Unable to update user at the moment. Please try again.")
        }
        setLoading(false);
    }

    useEffect(() => {
        const userData = localStorage.getItem("user_data");
        if (userData) {
            setUser(JSON.parse(userData));
            setFormData({
                first_name: userData.first_name || "",
                last_name: userData.last_name || "",
                email: userData.email || "",
                phone_number: userData.phone_number || ""
            });

        }
    }, []);
    return (
        <div className="position-relative">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Your Personal Info</h4>
                <div className="position-absolute top-0 end-0 pe-2 pt-1">
                    {editMode ? (
                        <div>
                            <button className="btn btn-sm btn-success me-2" style={{ backgroundColor: "#471915" }} onClick={handleSave}>Save</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                        </div>
                    ) : (
                        <i
                            className="bi bi-pencil-square fs-4"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                setFormData({
                                    first_name: user.first_name || "",
                                    last_name: user.last_name || "",
                                    email: user.email || "",
                                    phone_number: user.phone_number || "",
                                });
                                setEditMode(true);
                            }}
                        ></i>
                    )}
                </div>

            </div>
            {editMode ? (
                <form>
                    <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input
                            className="form-control"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                            className="form-control"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            className="form-control"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input
                            className="form-control"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>
                </form>
            ) : (
                <div className="card border-0">
                    <div className="card-body">
                        <div className="mb-3">
                            <i className="bi bi-person me-2"></i>
                            <strong>Name:</strong> {user.first_name + " " + user.last_name}
                        </div>
                        <div className="mb-3">
                            <i className="bi bi-envelope me-2"></i>
                            <strong>Email:</strong> {user.email}
                        </div>
                        {user.phone_number && (
                            <div className="mb-1">
                                <i className="bi bi-telephone me-2"></i>
                                <strong>Phone:</strong> {user.phone_number}
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>

    );
}

export default AccountInfo;
