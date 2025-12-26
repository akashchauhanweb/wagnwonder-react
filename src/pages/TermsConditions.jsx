import { useEffect } from "react";

function TermsConditions() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1>Terms & Conditions</h1>
                    <p className="policy-meta">Effective Date: May 18, 2025 | Last Updated: May 18, 2025</p>
                </div>

                <div className="policy-content">
                    <p className="policy-intro">
                        Welcome to Wag N Wonder ("we", "us", or "our"). By accessing or using our website 
                        www.wagnwonder.co, mobile app, or services, you agree to be bound by these Terms and 
                        Conditions. If you do not agree, please do not use our services.
                    </p>

                    <section className="policy-section">
                        <h2>1. Use of Our Services</h2>
                        <p>By using this website, you confirm that you:</p>
                        <ul>
                            <li>Are at least 18 years of age (or have permission from a legal guardian)</li>
                            <li>Will provide accurate and current information when registering or purchasing</li>
                            <li>Will not use our website for illegal or unauthorized purposes</li>
                        </ul>
                        <p>We reserve the right to refuse service to anyone for any reason at any time.</p>
                    </section>

                    <section className="policy-section">
                        <h2>2. Products and Services</h2>
                        <p>
                            We sell pet-related products and services including, but not limited to, accessories, 
                            toys, grooming, and booking of pet-related services. Product availability and pricing 
                            are subject to change without notice. We make every effort to display product descriptions 
                            and images accurately but do not guarantee completeness or accuracy.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>3. Account Registration</h2>
                        <p>
                            To access certain features, you may be required to create an account. You are responsible 
                            for maintaining the confidentiality of your account credentials and for all activity under 
                            your account.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>4. Orders and Payment</h2>
                        <p>
                            All orders are subject to acceptance and availability. We reserve the right to cancel or 
                            limit any order for any reason. Prices are listed in INR (₹) and are inclusive of applicable 
                            taxes unless otherwise stated.
                        </p>
                        <p>
                            We accept payments via secure third-party gateways. By submitting payment, you agree that:
                        </p>
                        <ul>
                            <li>You are authorized to use the payment method</li>
                            <li>Payment details are accurate</li>
                            <li>You authorize the charge for the order</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>5. Cancellations and Refunds</h2>
                        <p>Please refer to our Refund Policy for details on cancellations, returns, and refunds.</p>
                    </section>

                    <section className="policy-section">
                        <h2>6. Shipping</h2>
                        <p>
                            We aim to dispatch products in a timely manner. Delivery timelines are estimates and may 
                            vary due to location or external factors. Delays do not entitle you to cancel an order or 
                            claim damages unless required by law.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>7. Intellectual Property</h2>
                        <p>
                            All content on our website — including logos, designs, images, text, and product information 
                            — is the property of Wag N Wonder or our licensors. You may not use, copy, reproduce, or 
                            distribute any part without our express written permission.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>8. User-Generated Content</h2>
                        <p>
                            If you submit reviews, photos, or other content, you grant us a royalty-free, perpetual 
                            license to use, display, and distribute such content in connection with our business. 
                            You are solely responsible for any content you submit and warrant that it does not violate 
                            any laws or third-party rights.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>9. Prohibited Conduct</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the site for unlawful purposes</li>
                            <li>Harass or harm others</li>
                            <li>Interfere with the site's security or integrity</li>
                            <li>Use bots, crawlers, or data mining tools without permission</li>
                        </ul>
                        <p>Violations may result in termination of your access.</p>
                    </section>

                    <section className="policy-section">
                        <h2>10. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, Wag N Wonder shall not be liable for any direct, 
                            indirect, incidental, punitive, or consequential damages arising out of your use of our 
                            site or products. Our total liability shall not exceed the total amount paid by you for 
                            the product or service in question.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>11. Indemnification</h2>
                        <p>
                            You agree to indemnify, defend, and hold harmless Wag N Wonder, its affiliates, officers, 
                            and employees from any claims, damages, liabilities, and expenses arising from your use 
                            of our services or your breach of these Terms.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>12. Termination</h2>
                        <p>
                            We reserve the right to terminate or suspend your account and access to our services at 
                            any time, with or without notice, for conduct that we believe violates these Terms or is 
                            harmful to other users or us.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>13. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of India, without regard to conflict of law principles. 
                            Any disputes shall be resolved exclusively in the courts located in West Bengal, India.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>14. Changes to Terms</h2>
                        <p>
                            We reserve the right to update these Terms at any time. Updates will be posted on this page, 
                            and your continued use constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>15. Contact Us</h2>
                        <p>If you have any questions about these Terms & Conditions, please contact us at:</p>
                        <div className="policy-contact-box">
                            <p><strong>Wag N Wonder</strong></p>
                            <p><strong>Email:</strong> admin@wagnwonder.co</p>
                            <p><strong>Phone:</strong> +919339960164</p>
                            <p><strong>Website:</strong> www.wagnwonder.co</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default TermsConditions;