import logo from '../images/horizontal-compressed.png';

function Footer() {
    return (
        <>
            <div className="py-5" style={{ backgroundColor: "#f6f1e5", color: "#2B1D1A" }}>
                <div className="container">
                    <div className="row gy-4">

                        {/* Column 1: Logo + Contact Info */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="mb-3">
                                <img src={logo} alt="Wag N Wonder" style={{ height: "40px" }} />
                            </div>
                            <p className="small mb-1">Address: Sikha Road, Ballam Para,<br />Farabari, West Bengal, 735135</p>
                            <p className="small mb-1">E-mail: customersupport@wagnwonder.co</p>
                            <p className="small">Phone: +91 93399 60164</p>
                        </div>

                        <div className="col-12 col-md-6 col-xl-3">
                            <h6 className="fw-bold mb-3">Quick Links</h6>
                            <ul className="list-unstyled small">
                                <li><a href="#" className="text-decoration-none text-dark">Boarding</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Shop</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Services</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Health</a></li>
                            </ul>
                        </div>

                        {/* Column 3: Useful Links */}
                        <div className="col-12 col-md-6 col-xl-3">
                            <h6 className="fw-bold mb-3">Useful Links</h6>
                            <ul className="list-unstyled small">
                                <li><a href="#" className="text-decoration-none text-dark">Privacy Policy</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Returns</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Terms & Conditions</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Contact Us</a></li>
                            </ul>
                        </div>

                        {/* Column 4: Social Media */}
                        <div className="ccol-12 col-md-6 col-xl-3">
                            <h6 className="fw-bold mb-3">Our Social Media Handles</h6>
                            <ul className="list-unstyled small">
                                <li><a href="#" className="text-decoration-none text-dark">Instagram</a></li>
                                <li><a href="#" className="text-decoration-none text-dark">Facebook</a></li>
                            </ul>
                        </div>

                    </div>
                </div>
            </div>


        </>
    );
}

export default Footer;