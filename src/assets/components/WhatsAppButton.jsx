import React, { useState } from 'react';

const WhatsAppButton = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const phoneNumber = "919339960164";
    const message = "Hi! I need help with WagNWonder.";

    const handleClick = () => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div 
            className="whatsapp-float-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isHovered && (
                <div className="whatsapp-tooltip">
                    Chat with us!
                </div>
            )}
            <div className="whatsapp-btn-wrapper">
                <button
                    className="whatsapp-close-btn"
                    onClick={handleClose}
                    aria-label="Close chat button"
                >
                    <i className="bi bi-x"></i>
                </button>
                <button
                    className="whatsapp-float-btn"
                    onClick={handleClick}
                    aria-label="Chat on WhatsApp"
                >
                    <i className="bi bi-whatsapp"></i>
                </button>
            </div>
        </div>
    );
};

export default WhatsAppButton;