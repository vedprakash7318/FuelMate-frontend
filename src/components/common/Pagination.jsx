import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Mobile & Desktop Friendly Pagination Bar
 * @param {number} page - Current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} total - Total number of records across all pages
 * @param {number} limit - Items per page
 * @param {function} onPageChange - Callback when a page is selected (newPage)
 */
const Pagination = ({ page = 1, totalPages = 1, total = 0, limit = 20, onPageChange }) => {
  if (total <= 0) return null;

  const startRecord = Math.min((page - 1) * limit + 1, total);
  const endRecord = Math.min(page * limit, total);

  // Helper to generate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        start = 2;
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
      {/* Record Range Counter */}
      <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
        Showing <span className="font-bold text-slate-800">{startRecord}</span> to{' '}
        <span className="font-bold text-slate-800">{endRecord}</span> of{' '}
        <span className="font-bold text-slate-900">{total}</span> records
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95 transition-all flex items-center gap-1"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Number Pills (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-slate-400 select-none">
                  …
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Compact Mobile Page Indicator */}
        <div className="sm:hidden px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
          Page {page} of {totalPages}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-95 transition-all flex items-center gap-1"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
