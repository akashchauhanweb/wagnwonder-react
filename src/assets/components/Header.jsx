import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function Header() {
    const [shopOpen, setShopOpen] = useState(false);

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
                <div className="d-flex align-items-center" onClick={() => navigate("/")}>
                    <img src="src/assets/images/horizontal-compressed.png" alt="logo" style={{ height: '40px' }} />
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