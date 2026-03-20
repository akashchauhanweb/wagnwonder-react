import { useEffect } from "react";

function RefundPolicy() {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="policy-page">
            <div className="policy-container">
                <div className="policy-header">
                    <h1>Refund Policy</h1>
                    <p className="policy-meta">Effective Date: May 20, 2026</p>
                </div>

                <div className="policy-content">
                    <p className="policy-intro">
                        At Wag N Wonder, customer satisfaction is our priority. Below is our cancellation and refund 
                        policy for the services we currently offer.
                    </p>

                    <section className="policy-section">
                        <h2>1. Boarding Cancellation & Refund Policy</h2>
                        <p>
                            The following cancellation policy applies to pet boarding bookings made through Wag N Wonder.
                            Refunds are calculated based on how far in advance the cancellation is made before the check-in date.
                        </p>

                        <h3 style={{ marginTop: "20px", marginBottom: "12px" }}>Cancellation Fee Schedule</h3>
                        <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                            <table style={{
                                width: "100%", borderCollapse: "collapse", fontSize: "0.9rem",
                                border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden"
                            }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#1e293b", fontWeight: 600 }}>Cancellation Timeframe</th>
                                        <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#7c3aed", fontWeight: 600 }}>Refund to Woof Wallet</th>
                                        <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "2px solid #e2e8f0", color: "#2563eb", fontWeight: 600 }}>Refund to Original Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>72 hours or more before check-in</td>
                                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", textAlign: "center", color: "#059669", fontWeight: 600 }}>95% refund <span style={{ color: "#94a3b8", fontWeight: 400 }}>(5% fee)</span></td>
                                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", textAlign: "center", color: "#059669", fontWeight: 600 }}>90% refund <span style={{ color: "#94a3b8", fontWeight: 400 }}>(10% fee)</span></td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", color: "#334155" }}>Less than 72 hours before check-in</td>
                                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", textAlign: "center", color: "#d97706", fontWeight: 600 }}>85% refund <span style={{ color: "#94a3b8", fontWeight: 400 }}>(15% fee)</span></td>
                                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", textAlign: "center", color: "#d97706", fontWeight: 600 }}>75% refund <span style={{ color: "#94a3b8", fontWeight: 400 }}>(25% fee)</span></td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "12px 16px", color: "#334155" }}>After check-in date (no-show)</td>
                                        <td style={{ padding: "12px 16px", textAlign: "center", color: "#dc2626", fontWeight: 600 }}>No refund</td>
                                        <td style={{ padding: "12px 16px", textAlign: "center", color: "#dc2626", fontWeight: 600 }}>No refund</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <h3 style={{ marginTop: "20px", marginBottom: "12px" }}>Key Points</h3>
                        <ul>
                            <li>Refunds to Woof Wallet are processed instantly. Refunds to the original payment method may take 5–7 business days.</li>
                            <li>For bookings made using both Woof Wallet and online payment, the wallet portion is always refunded to the wallet at the wallet fee rate. The online portion can be refunded to either the wallet or the original payment method, at the respective fee rate.</li>
                            <li>Bookings with a "Checked In" status cannot be cancelled. Early checkouts are not eligible for refunds.</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>2. Events</h2>
                        <p>
                            Event bookings are non-refundable once confirmed. If an event is cancelled by Wag N Wonder, 
                            a full refund will be issued to your Woof Wallet or original payment method.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>3. Woof Wallet</h2>
                        <p>
                            Woofs purchased for the Woof Wallet are non-refundable and cannot be converted back to cash. 
                            Woofs can only be used towards booking services on Wag N Wonder.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>4. Contact Us</h2>
                        <p>If you have any questions about cancellations or refunds, please contact us:</p>
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

export default RefundPolicy;