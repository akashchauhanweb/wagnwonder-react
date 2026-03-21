import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems, theme = "user" }) {
    if (totalPages <= 1 && !onItemsPerPageChange) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`pagination-wrapper pagination-${theme}`}>
            <div className="pagination-info">
                <span>Showing {startItem}–{endItem} of {totalItems}</span>
                {onItemsPerPageChange && (
                    <select
                        className="pagination-per-page"
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    >
                        {[10, 20, 50, 100].map(n => (
                            <option key={n} value={n}>{n} per page</option>
                        ))}
                    </select>
                )}
            </div>
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        className="pagination-btn pagination-nav"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                            <span key={`dots-${idx}`} className="pagination-dots">...</span>
                        ) : (
                            <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? "active" : ""}`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        )
                    )}
                    <button
                        className="pagination-btn pagination-nav"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            )}
        </div>
    );
}