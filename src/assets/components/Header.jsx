import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../images/horizontal-compressed.png';

const NAV_LINKS = [
    { label: 'Boarding', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Services', path: '/services' },
    { label: 'Health', path: '/health' },
];

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isLoggedIn = !!localStorage.getItem("session_id");

    const handleUserClick = () => {
        navigate(isLoggedIn ? "/account" : "/login");
    };

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo */}
                <div className="header-logo" onClick={() => navigate("/")}>
                    <img src={logo} alt="Wag n Wonder" />
                </div>

                {/* Desktop Navigation */}
                <nav className="header-nav">
                    {NAV_LINKS.map((link) => (
                        <span
                            key={link.label}
                            className={`header-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                            onClick={() => navigate(link.path)}
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

                    {/* Mobile Menu Toggle */}
                    <button 
                        className="header-mobile-toggle"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="header-mobile-menu">
                    {NAV_LINKS.map((link) => (
                        <span
                            key={link.label}
                            className={`header-mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                            onClick={() => {
                                navigate(link.path);
                                setMobileMenuOpen(false);
                            }}
                        >
                            {link.label}
                        </span>
                    ))}
                </div>
            )}
        </header>
    );
}

export default Header;