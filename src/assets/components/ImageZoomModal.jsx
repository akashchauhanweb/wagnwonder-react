import React from 'react';

const ImageZoomModal = ({ images, currentIndex, onClose, onIndexChange }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="image-zoom-overlay" onClick={onClose}>
            <button className="zoom-close-btn" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
            </button>
            <img 
                src={images[currentIndex]?.image_url} 
                alt="Zoomed" 
                className="zoom-main-image" 
                onClick={(e) => e.stopPropagation()} 
            />
            {images.length > 1 && (
                <div className="zoom-thumbnails" onClick={(e) => e.stopPropagation()}>
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img.image_url}
                            alt="Thumb"
                            className={currentIndex === idx ? "active" : ""}
                            onClick={() => onIndexChange(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageZoomModal;