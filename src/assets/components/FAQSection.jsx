import { useState } from "react";

const FAQS = [
    {
        question: "How do I book a boarding for my pet?",
        answer: "Simply use our search form on the homepage to select your city, check-in and check-out dates, and the number of pets. Browse through our verified partner facilities, compare prices and amenities, and book your preferred option in just a few clicks."
    },
    {
        question: "Are all the kennels and facilities verified?",
        answer: "Yes! We carefully vet all our partner facilities before listing them on our platform. We check for proper licensing, hygiene standards, safety measures, and quality of care to ensure your pet gets the best experience."
    },
    {
        question: "Can I visit the facility before booking?",
        answer: "Absolutely! We encourage pet parents to visit facilities before booking. You can contact the facility directly through our platform to schedule a visit and see where your furry friend will be staying."
    },
    {
        question: "What if I need to cancel my booking?",
        answer: "You can cancel your booking through your account dashboard. Please refer to our refund policy for details on cancellation timelines and refund eligibility. We recommend canceling at least 48 hours before check-in for a full refund."
    },
    {
        question: "Do I need to provide my pet's vaccination records?",
        answer: "Yes, for the safety of all pets at our partner facilities, we require up-to-date vaccination records. You can upload your pet's vaccine card when adding them to your profile."
    },
    {
        question: "What happens if my pet has special needs or requires medication?",
        answer: "Our partner facilities are equipped to handle pets with special needs. When booking, you can mention any specific requirements, dietary restrictions, or medication schedules. The facility staff will ensure your pet receives proper care."
    },
    {
        question: "Is there live CCTV access to check on my pet?",
        answer: "Many of our partner facilities offer live CCTV access so you can check on your pet anytime. Look for the CCTV feature tag when browsing facilities to find ones that offer this service."
    },
    {
        question: "How do I contact customer support?",
        answer: "You can reach us through the Contact Us page, raise a support ticket from your account, or call us directly at +91 93399 60164. Our support team is available Monday to Saturday, 9 AM to 7 PM."
    }
];

function FAQSection({ showHeader = true, maxItems = null }) {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const displayedFAQs = maxItems ? FAQS.slice(0, maxItems) : FAQS;

    return (
        <div className="faq-wrapper">
            {showHeader && (
                <div className="info-header">
                    <span className="info-badge">FAQs</span>
                    <h2 className="info-title">Frequently Asked Questions</h2>
                    <p className="info-subtitle">
                        Got questions? We've got answers. Find everything you need to know about our services.
                    </p>
                </div>
            )}

            <div className="faq-list">
                {displayedFAQs.map((faq, index) => (
                    <div 
                        key={index} 
                        className={`faq-item ${openIndex === index ? 'open' : ''}`}
                    >
                        <button 
                            className="faq-question"
                            onClick={() => toggleFAQ(index)}
                            aria-expanded={openIndex === index}
                        >
                            <span>{faq.question}</span>
                            <i className={`bi ${openIndex === index ? 'bi-dash' : 'bi-plus'}`}></i>
                        </button>
                        <div className="faq-answer">
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FAQSection;
export { FAQS };