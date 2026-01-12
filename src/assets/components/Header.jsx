import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../images/horizontal-compressed.png';
import boardingIcon from '../icons/boarding.png';
import eventsIcon from '../icons/events.png';
import shopIcon from '../icons/shop.png';
import servicesIcon from '../icons/services.png';

const NAV_LINKS = [
    { label: 'Boarding', path: '/', icon: boardingIcon },
    { label: 'Events', path: '/events', icon: eventsIcon },
    { label: 'Shop', path: '/shop', icon: shopIcon, comingSoon: true },
    { label: 'Services', path: '/services', icon: servicesIcon, comingSoon: true },
];

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const isLoggedIn = !!localStorage.getItem("session_id");
    
    // Determine active nav based on current path
    const getActiveNavFromPath = (pathname) => {
        // Check if path starts with any nav link path (except home)
        for (const link of NAV_LINKS) {
            if (link.path !== '/' && pathname.startsWith(link.path)) {
                return link.label;
            }
        }
        // Default to Boarding for home and unknown paths
        return pathname === '/' ? 'Boarding' : localStorage.getItem("activeNav") || 'Boarding';
    };

    const [activeNav, setActiveNav] = useState(() => {
        return getActiveNavFromPath(location.pathname);
    });

    // Update activeNav when route changes
    useEffect(() => {
        const newActiveNav = getActiveNavFromPath(location.pathname);
        setActiveNav(newActiveNav);
        localStorage.setItem("activeNav", newActiveNav);
    }, [location.pathname]);

    const handleUserClick = () => {
        navigate(isLoggedIn ? "/account" : "/login");
    };
    const [toastMessage, setToastMessage] = useState("");

    const handleNavClick = (link) => {
        if (link.comingSoon) {
            setToastMessage(`${link.label} is launching soon!`);
            setTimeout(() => setToastMessage(""), 3000);
        } else {
            setActiveNav(link.label);
            localStorage.setItem("activeNav", link.label);
            navigate(link.path);
        }
    };

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
                            className={`header-nav-link ${activeNav === link.label ? 'active' : ''} ${link.comingSoon ? 'coming-soon' : ''}`}
                            onClick={() => handleNavClick(link)}
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
                        className={`mobile-nav-item ${activeNav === link.label ? 'active' : ''} ${link.comingSoon ? 'coming-soon' : ''}`}
                        onClick={() => {
                            handleNavClick(link);
                            if (!link.comingSoon) {
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