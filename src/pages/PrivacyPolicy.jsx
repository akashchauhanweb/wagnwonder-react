import { useEffect } from "react";

function PrivacyPolicy() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1>Privacy Policy</h1>
                    <p className="policy-meta">Effective Date: May 18, 2025 | Last Updated: May 18, 2025</p>
                </div>

                <div className="policy-content">
                    <p className="policy-intro">
                        Wag N Wonder ("Company," "we," "us," or "our") is committed to protecting your privacy. 
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                        when you visit our website www.wagnwonder.co, use our services, or engage with us in other ways. 
                        Please read this policy carefully to understand our views and practices regarding your personal data.
                    </p>

                    <section className="policy-section">
                        <h2>1. Information We Collect</h2>
                        <p>We may collect and process the following types of information:</p>

                        <h3>A. Personal Identification Information</h3>
                        <ul>
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>Shipping and billing addresses</li>
                            <li>Payment information (processed via secure third-party payment gateways)</li>
                        </ul>

                        <h3>B. Account Information</h3>
                        <ul>
                            <li>Username and password</li>
                            <li>Account preferences and settings</li>
                        </ul>

                        <h3>C. Pet Information</h3>
                        <ul>
                            <li>Pet's name, breed, age, and health conditions (as provided by you)</li>
                        </ul>

                        <h3>D. Transaction Information</h3>
                        <ul>
                            <li>Details of products purchased or services booked</li>
                            <li>Order history and preferences</li>
                        </ul>

                        <h3>E. Technical and Usage Information</h3>
                        <ul>
                            <li>IP address</li>
                            <li>Browser type and version</li>
                            <li>Time zone setting</li>
                            <li>Browser plug-in types and versions</li>
                            <li>Operating system and platform</li>
                            <li>Information about your visit, including the URL clickstream, pages viewed, and page response times</li>
                        </ul>

                        <h3>F. Cookies and Tracking Technologies</h3>
                        <p>
                            We use cookies, web beacons, and similar tracking technologies to collect information about 
                            your browsing activities. This helps us improve our website and provide a better user experience. 
                            You can manage your cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect for the following purposes:</p>
                        <ul>
                            <li><strong>To Provide Services:</strong> Fulfill orders, process payments, and deliver products or services</li>
                            <li><strong>Customer Support:</strong> Respond to inquiries, complaints, and feedback</li>
                            <li><strong>Account Management:</strong> Manage your account, including password resets and notifications</li>
                            <li><strong>Marketing:</strong> Send promotional materials, newsletters, and special offers (with your consent)</li>
                            <li><strong>Analytics:</strong> Analyze website usage to improve our services and user experience</li>
                            <li><strong>Legal Compliance:</strong> Comply with legal obligations and protect our legal rights</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>3. Legal Basis for Processing</h2>
                        <p>We process your personal data based on the following legal grounds:</p>
                        <ul>
                            <li><strong>Consent:</strong> Where you have given us explicit permission</li>
                            <li><strong>Contractual Necessity:</strong> To fulfill a contract with you</li>
                            <li><strong>Legal Obligation:</strong> To comply with legal requirements</li>
                            <li><strong>Legitimate Interests:</strong> For our legitimate business interests, provided they do not override your rights</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>4. Sharing Your Information</h2>
                        <p>We do not sell or rent your personal information to third parties. We may share your information with:</p>
                        <ul>
                            <li><strong>Service Providers:</strong> Third-party vendors who assist in providing our services (e.g., payment processors, shipping companies)</li>
                            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                        </ul>
                        <p>All third parties are required to maintain the confidentiality of your information and use it only for the purposes we specify.</p>
                    </section>

                    <section className="policy-section">
                        <h2>5. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal data 
                            against unauthorized access, alteration, disclosure, or destruction. These measures include:
                        </p>
                        <ul>
                            <li>Secure servers and encryption</li>
                            <li>Access controls and authentication</li>
                            <li>Regular security assessments</li>
                        </ul>
                        <p>
                            However, please note that no method of transmission over the internet is entirely secure, 
                            and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>6. Data Retention</h2>
                        <p>
                            We retain your personal data only for as long as necessary to fulfill the purposes outlined 
                            in this policy, unless a longer retention period is required by law. Once your data is no 
                            longer needed, we will securely delete or anonymize it.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>7. Your Rights</h2>
                        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
                        <ul>
                            <li><strong>Access:</strong> Request access to the personal data we hold about you</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                            <li><strong>Objection:</strong> Object to the processing of your data for certain purposes</li>
                            <li><strong>Restriction:</strong> Request restriction of processing under certain circumstances</li>
                            <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                        </ul>
                        <p>To exercise any of these rights, please contact us at:</p>
                        <div className="policy-contact-box">
                            <p><strong>Email:</strong> admin@wagnwonder.co</p>
                            <p><strong>Phone:</strong> +919339960164</p>
                            <p><strong>Website:</strong> www.wagnwonder.co</p>
                        </div>
                    </section>

                    <section className="policy-section">
                        <h2>8. Children's Privacy</h2>
                        <p>
                            Our services are not intended for children under the age of 13. We do not knowingly collect 
                            personal data from children. If we become aware that we have collected data from a child 
                            without parental consent, we will take steps to delete such information promptly.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>9. Third-Party Links</h2>
                        <p>
                            Our website may contain links to third-party websites. We are not responsible for the 
                            privacy practices or content of these external sites. We encourage you to read their 
                            privacy policies before providing any personal information.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>10. International Data Transfers</h2>
                        <p>
                            If you are accessing our services from outside India, please be aware that your information 
                            may be transferred to, stored, and processed in India or other countries where our servers 
                            are located. By using our services, you consent to this transfer.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>11. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time to reflect changes in our practices 
                            or legal obligations. We will notify you of any significant changes by posting the new 
                            policy on our website and updating the effective date. We encourage you to review this 
                            policy periodically.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>12. Contact Us</h2>
                        <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
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

export default PrivacyPolicy;