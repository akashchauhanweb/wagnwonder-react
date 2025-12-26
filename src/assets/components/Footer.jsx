import { useNavigate } from 'react-router-dom';
import logo from '../images/horizontal-compressed.png';

const QUICK_LINKS = [
    { label: 'Boarding', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Services', path: '/services' },
    { label: 'Health', path: '/health' },
];

const USEFUL_LINKS = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms & Conditions', path: '/terms' },
    { label: 'Refund Policy', path: '/refund' },
    { label: 'Contact Us', path: '/contact' },
];

const SOCIAL_LINKS = [
    { label: 'Instagram', icon: 'bi-instagram', url: 'https://instagram.com' },
    { label: 'Facebook', icon: 'bi-facebook', url: 'https://facebook.com' },
    { label: 'Twitter', icon: 'bi-twitter-x', url: 'https://twitter.com' },
];

function Footer() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <img src={logo} alt="Wag N Wonder" className="footer-logo" />
                        <p className="footer-tagline">
                            Premium care for your furry family. Find trusted pet services near you.
                        </p>
                        <div className="footer-social">
                            {SOCIAL_LINKS.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="footer-social-link"
                                    aria-label={social.label}
                                >
                                    <i className={`bi ${social.icon}`}></i>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-links-group">
                        <h4 className="footer-heading">Quick Links</h4>
                        <ul className="footer-links">
                            {QUICK_LINKS.map((link, idx) => (
                                <li key={idx}>
                                    <span onClick={() => navigate(link.path)}>{link.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Useful Links */}
                    <div className="footer-links-group">
                        <h4 className="footer-heading">Useful Links</h4>
                        <ul className="footer-links">
                            {USEFUL_LINKS.map((link, idx) => (
                                <li key={idx}>
                                    <span onClick={() => navigate(link.path)}>{link.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-links-group">
                        <h4 className="footer-heading">Contact Us</h4>
                        <ul className="footer-contact">
                            <li>
                                <i className="bi bi-geo-alt-fill"></i>
                                <span>Sikha Road, Ballam Para, Farabari, West Bengal, 735135</span>
                            </li>
                            <li>
                                <i className="bi bi-envelope-fill"></i>
                                <a href="mailto:customersupport@wagnwonder.co">customersupport@wagnwonder.co</a>
                            </li>
                            <li>
                                <i className="bi bi-phone-fill"></i>
                                <a href="tel:+919339960164">+91 93399 60164</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <p>© {currentYear} Wag N Wonder. All rights reserved.</p>
                    <p>Made with <i className="bi bi-heart-fill"></i> for pets</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;