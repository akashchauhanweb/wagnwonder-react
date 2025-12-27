import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../images/horizontal-compressed.png';

const NAV_LINKS = [
    { label: 'Boarding', path: '/' },
    { label: 'Shop', path: '/shop', comingSoon: true },
    { label: 'Services', path: '/services', comingSoon: true },
    { label: 'Health', path: '/health', comingSoon: true },
];

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (mobileMenuOpen && headerRef.current && !headerRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [mobileMenuOpen]);
    const isLoggedIn = !!localStorage.getItem("session_id");

    const handleUserClick = () => {
        navigate(isLoggedIn ? "/account" : "/login");
    };
    const [toastMessage, setToastMessage] = useState("");

    return (
        <header className="header" ref={headerRef}>
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
                            className={`header-nav-link ${location.pathname === link.path ? 'active' : ''} ${link.comingSoon ? 'coming-soon' : ''}`}
                            onClick={() => {
                                if (link.comingSoon) {
                                    setToastMessage(`${link.label} is launching soon! 🐾`);
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
                            className={`header-mobile-link ${location.pathname === link.path ? 'active' : ''} ${link.comingSoon ? 'coming-soon' : ''}`}
                            onClick={() => {
                                if (link.comingSoon) {
                                    setToastMessage(`${link.label} is launching soon! 🐾`);
                                    setTimeout(() => setToastMessage(""), 3000);
                                } else {
                                    navigate(link.path);
                                }
                                setMobileMenuOpen(false);
                            }}
                        >
                            {link.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Toast Message */}
            {toastMessage && (
                <div className="header-toast">
                    <i className="bi bi-info-circle"></i>
                    {toastMessage}
                </div>
            )}
        </header>
    );
}

export default Header;