import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/horizontal-compressed.png';

function Header() {
    const [shopOpen, setShopOpen] = useState(false);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        const fetchCityName = async (lat, lon) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
                const data = await res.json();
                const city = data.address.city || data.address.town || data.address.village || data.address.state;
                localStorage.setItem("user_city", city);
                setLocation(city);
            } catch (err) {
                console.error("Failed to fetch city name:", err);
            }
            localStorage.setItem("user_location", JSON.stringify({ lat: lat, lon: lon }));
        };

        if (!localStorage.getItem("user_city")) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                localStorage.setItem("user_location", JSON.stringify({ lat: lat, lon: lon }));
                fetchCityName(lat, lon);
            });
        } else {
            setLocation(localStorage.getItem("user_city"));
        }
    }, []);

    // Inside your Header component:
    const navigate = useNavigate();

    const handleUserClick = () => {
        const isLoggedIn = !!localStorage.getItem("session_id");
        navigate(isLoggedIn ? "/account" : "/login");
    };
    return (
        <>
            <div className="d-flex justify-content-between align-items-center px-4 py-2 border-bottom" style={{ backgroundColor: '#fff' }}>
                {/* Logo Section */}
                <div className="d-flex align-items-center gap-2" onClick={() => navigate("/")}>
                    <img src={logo} alt="logo" style={{ height: "40px" }} />
                    {location && (
                        <div className="fw-semibold fs-6 text-dark ms-2">
                            📍 {location}
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <div className="d-flex align-items-center gap-4">
                    <div className="d-none d-md-flex gap-4 align-items-center">
                        <span className="fw-normal">Boarding</span>
                        <span className="fw-normal" onClick={() => setShopOpen(!shopOpen)}>Shop<i className={`bi ms-1 ${shopOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i></span>
                        <span className="fw-normal">Health</span>
                    </div>

                    {/* User Icon Section */}

                    <div className="d-flex align-items-center">
                        <div onClick={handleUserClick} style={{ cursor: "pointer" }}>
                            <i className="bi bi-person-circle fs-2" style={{ color: "#471915" }}></i>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header;