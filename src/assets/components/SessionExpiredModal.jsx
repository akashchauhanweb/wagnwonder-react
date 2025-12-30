import React from 'react';

const SessionExpiredModal = ({ isOpen, onLogin }) => {
    if (!isOpen) return null;

    const handleLogin = () => {
        localStorage.clear();
        if (onLogin) {
            onLogin();
        } else {
            window.location.href = "/login";
        }
    };

    return (
        <div className="session-expired-overlay">
            <div className="session-expired-modal">
                <div className="session-expired-icon">
                    <i className="bi bi-shield-exclamation"></i>
                </div>
                <h3>Session Expired</h3>
                <p>Your session has expired. Please login again to continue.</p>
                <button onClick={handleLogin}>
                    <i className="bi bi-box-arrow-in-right"></i>
                    Login Again
                </button>
            </div>
        </div>
    );
};

export default SessionExpiredModal;