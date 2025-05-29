import { callServicesApi } from "./servicesApi";

export async function updateUser(userInfo) {
    let body = {
        ...userInfo,
        user_id: userInfo.id,
        action: "UPDATE_USER",
        session_id: localStorage.getItem("session_id")
    }
    let response = await callServicesApi(body);
    if (response && response.success) {
        return true;
    }
    if (response.status_code === 498) {
        localStorage.clear()
        alert("Your session has expired. Please login again!")
        window.location.href = "/login"
    }
    return false;
}