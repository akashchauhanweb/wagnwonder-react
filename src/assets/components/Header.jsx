import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../images/horizontal-compressed.png';
import boardingIcon from '../icons/boarding.png';
import shopIcon from '../icons/shop.png';
import servicesIcon from '../icons/services.png';
import healthIcon from '../icons/health.png';

const NAV_LINKS = [
    { label: 'Boarding', path: '/', icon: boardingIcon, activePaths: ['/', '/search-results', '/booking-review', '/payment-status'] },
    { label: 'Shop', path: '/shop', icon: shopIcon, comingSoon: true },
    { label: 'Services', path: '/services', icon: servicesIcon, comingSoon: true },
    { label: 'Health', path: '/health', icon: healthIcon, comingSoon: true },
];

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = !!localStorage.getItem("session_id");

    const handleUserClick = () => {
        navigate(isLoggedIn ? "/account" : "/login");
    };
    const [toastMessage, setToastMessage] = useState("");

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo */}
                <div className="header-logo" onClick={() => { navigate("/"); window.scrollTo(0, 0); }}>
                    <img src={logo} alt="Wag N Wonder" />
                </div>

                {/* Desktop Navigation */}
                <nav className="header-nav">
                    {NAV_LINKS.map((link) => (
                        <span
                            key={link.label}
                            className={`header-nav-link ${link.activePaths ? link.activePaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/')) : location.pathname === link.path ? 'active' : ''} ${link.comingSoon ? 'coming-soon' : ''}`}
                            onClick={() => {
                                if (link.comingSoon) {
                                    setToastMessage(`${link.label} is launching soon!`);
                                    setTimeout(() => setToastMessage(""), 3000);
                                } else {
                                    navigate(link.path);
                                }
                            }}
                        >
                            {link.label}
                        </span>
                    ))}
                </nav>

                {/* Right Section */}
                <div className="header-actions">
                    {/* User Button */}
                    <button 
                        className="header-user-btn"
                        onClick={handleUserClick}
                        aria-label="User account"
                    >
                        <i className="bi bi-person-fill"></i>
                        <span>{isLoggedIn ? 'Account' : 'Login'}</span>
                    </button>
                </div>
            </div>

            {/* Toast Message */}
            {toastMessage && (
                <div className="header-toast">
                    <i className="bi bi-info-circle"></i>
                    {toastMessage}
                </div>
            )}
            {/* Mobile Bottom Navbar */}
            <nav className="mobile-bottom-nav">
                {NAV_LINKS.map((link) => (
                    <div
                        key={link.label}
                        className={`mobile-nav-item ${(link.activePaths ? link.activePaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/')) : location.pathname === link.path) ? 'active' : ''} ${link.comingSoon ? 'coming-soon' : ''}`}
                        onClick={() => {
                            if (link.comingSoon) {
                                setToastMessage(`${link.label} is launching soon!`);
                                setTimeout(() => setToastMessage(""), 3000);
                            } else {
                                navigate(link.path);
                                window.scrollTo(0, 0);
                            }
                        }}
                    >
                        <img src={link.icon} alt={link.label} className="mobile-nav-icon" />
                    </div>
                ))}
            </nav>
        </header>
    );
}

export default Header;