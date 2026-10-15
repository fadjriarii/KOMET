import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Footer pagination: label rentang + tombol halaman. */
export function TablePagination({ pagination, paginationMeta, paginationItems, onPageChange }) {
  if (!pagination) return null;
  return (
    <div className="px-5 py-3.5 sm:px-6 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
      <div className="font-medium text-gray-500">
        {pagination.total !== undefined && paginationMeta && (
          <span>
            Menampilkan{' '}
            <strong className="font-bold text-gray-800">{paginationMeta.rangeLabel}</strong> dari{' '}
            <strong className="font-bold text-gray-800">{paginationMeta.totalLabel}</strong> data
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange?.(pagination.page - 1)}
          disabled={paginationMeta?.isFirstPage}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-digital-blue-200 hover:text-digital-blue-700 hover:bg-digital-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-colors cursor-pointer"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex items-center gap-1">
          {paginationItems.map((item) => {
            if (typeof item === 'string') {
              return (
                <span
                  key={item}
                  className="inline-flex items-center justify-center h-8 w-7 text-gray-400 font-bold select-none"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isActive = item === paginationMeta?.currentPage;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange?.(item)}
                disabled={isActive}
                className={`inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-digital-blue-600 border-digital-blue-600 text-white shadow-2xs cursor-default'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-digital-blue-200 hover:text-digital-blue-700 hover:bg-digital-blue-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Halaman ${item}`}
              >
                {item}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange?.(pagination.page + 1)}
          disabled={paginationMeta?.isLastPage}
          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-digital-blue-200 hover:text-digital-blue-700 hover:bg-digital-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-colors cursor-pointer"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
