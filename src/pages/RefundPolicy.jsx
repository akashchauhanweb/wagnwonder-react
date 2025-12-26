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
                    <p className="policy-meta">Effective Date: May 18, 2025 | Last Updated: May 18, 2025</p>
                </div>

                <div className="policy-content">
                    <p className="policy-intro">
                        At Wag N Wonder, customer satisfaction is our priority. If you are not entirely satisfied 
                        with your purchase, we're here to help.
                    </p>

                    <section className="policy-section">
                        <h2>1. Returns</h2>
                        <p>You have 7 calendar days to return an item from the date you received it.</p>
                        <p>To be eligible for a return:</p>
                        <ul>
                            <li>The item must be unused and in the same condition that you received it.</li>
                            <li>It must be in the original packaging.</li>
                            <li>You must provide the receipt or proof of purchase.</li>
                        </ul>
                        <p className="policy-note">
                            <strong>Note:</strong> Personalized or perishable items (like treats, grooming services, 
                            or custom pet accessories) are not eligible for return unless defective.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>2. Refunds</h2>
                        <p>
                            Once we receive your returned item, we will inspect it and notify you of the status 
                            of your refund.
                        </p>
                        <ul>
                            <li>If approved, the refund will be initiated to your original method of payment.</li>
                            <li>The amount will be credited within 7–10 business days, depending on your payment provider.</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>3. Late or Missing Refunds</h2>
                        <p>If you haven't received a refund after 10 business days:</p>
                        <ol>
                            <li>Recheck your bank account.</li>
                            <li>Contact your credit card company or payment provider.</li>
                            <li>If you've done all this and still have not received your refund, please contact us at admin@wagnwonder.co.</li>
                        </ol>
                    </section>

                    <section className="policy-section">
                        <h2>4. Exchanges</h2>
                        <p>
                            We only replace items if they are defective or damaged. If you need to exchange it for 
                            the same item, email us at admin@wagnwonder.co and send your item to:
                        </p>
                        <div className="policy-contact-box">
                            <p><strong>Wag N Wonder</strong></p>
                            <p>Shikha Road, Ballam Para</p>
                            <p>Farabari, West Bengal, 735135</p>
                        </div>
                    </section>

                    <section className="policy-section">
                        <h2>5. Shipping Returns</h2>
                        <p>
                            You will be responsible for paying for your own shipping costs for returning the item. 
                            Shipping costs are non-refundable.
                        </p>
                        <p>
                            If you receive a refund, the cost of return shipping will be deducted from your refund 
                            if applicable.
                        </p>
                    </section>

                    <section className="policy-section">
                        <h2>6. Service Cancellations</h2>
                        <p>
                            For cancellations of booked services (e.g., grooming or training), please notify us at 
                            least 24 hours in advance.
                        </p>
                        <ul>
                            <li>
                                Cancellations made less than 24 hours before the scheduled service may incur a 
                                cancellation fee of ₹100 or no refund, depending on the service.
                            </li>
                            <li>
                                Alternatively, the canceled service amount can be added to your Woof/Meow Wallet 
                                for future transactions, after deducting applicable taxes or related charges.
                            </li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h2>7. Contact Us</h2>
                        <p>If you have any questions about returns or refunds, please contact us:</p>
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