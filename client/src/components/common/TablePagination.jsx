import React, { useState, useRef, useMemo } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

/**
 * Reusable Table Pagination Component with row count indicator,
 * page size dropdown popover, and smart ellipsis page numbers.
 */
export const TablePagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}) => {
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef(null);

  useClickOutside(pageSizeRef, () => setIsPageSizeOpen(false));

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      }
    }

    const pages = [];
    let prev = 0;
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) {
          pages.push(prev + 1);
        } else if (i - prev > 2) {
          pages.push('...');
        }
      }
      pages.push(i);
      prev = i;
    }

    return pages;
  }, [totalPages, currentPage]);

  const displayStart = totalItems === 0 ? 0 : startIndex + 1;

  return (
    <div
      className="p-4 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest"
      id="table-pagination-footer"
    >
      <div className="flex items-center gap-4 text-xs text-on-surface-variant font-medium">
        <span>
          Menampilkan {displayStart} - {endIndex} dari {totalItems} data
        </span>

        <div className="relative inline-block" ref={pageSizeRef}>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Baris per halaman:</span>
            <button
              type="button"
              id="page-size-selector-btn"
              onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
              className="flex items-center gap-1 px-2.5 py-1 bg-surface border border-outline-variant/60 rounded text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span>{pageSize}</span>
              <span
                className={`material-symbols-outlined text-[16px] text-outline transition-transform duration-150 ${
                  isPageSizeOpen ? 'rotate-180' : ''
                }`}
              >
                arrow_drop_down
              </span>
            </button>
          </div>

          {isPageSizeOpen && (
            <div
              id="page-size-dropdown-menu"
              className="absolute bottom-full mb-1 left-28 w-20 bg-surface border border-outline-variant/60 rounded-lg shadow-level-2 py-1 z-30 animate-dropdown-pop"
            >
              {pageSizeOptions.map((opt) => {
                const isSelected = opt === pageSize;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onPageSizeChange(opt);
                      setIsPageSizeOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[13px] text-primary">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1" id="pagination-controls">
        <button
          id="btn-prev"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:bg-surface-container text-on-surface-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        <div id="page-numbers" className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-xs font-bold text-outline select-none"
                >
                  ...
                </span>
              );
            }

            const isCur = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded text-xs font-medium cursor-pointer transition-colors ${
                  isCur
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'border border-outline-variant/40 hover:bg-surface-container text-on-surface'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          id="btn-next"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:bg-surface-container text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
