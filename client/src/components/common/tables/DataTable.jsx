import { ChevronLeft, ChevronRight, Database } from 'lucide-react';
import Skeleton from '../feedback/Skeleton';
import EmptyState from '../feedback/EmptyState';
import { getPaginationItems, getPaginationMeta } from '../../../utils/logic';

/**
 * DataTable - Reusable Table Container
 * Menyediakan layout tabel standar, loading state, empty state, dan pagination
 */
export default function DataTable({
  columns = [], // [{ key: 'id', label: 'ID', render: (row) => ... }]
  data = [],
  isLoading = false,
  title,
  description,
  headerMeta,
  emptyTitle = 'Belum Ada Data',
  emptyMessage = 'Belum ada data tersedia',
  emptyIcon = Database,
  pagination, // { currentPage, totalPages, onPageChange, totalItems, pageSize }
  className = '',
  tableClassName = 'min-w-[920px]',
  tableViewportClassName = 'overflow-x-auto overflow-y-hidden custom-scrollbar',
}) {
  const paginationMeta = pagination
    ? getPaginationMeta({
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        pageSize: pagination.pageSize,
        currentCount: data.length,
      })
    : null;
  const paginationItems = paginationMeta
    ? getPaginationItems(paginationMeta.currentPage, paginationMeta.totalPages)
    : [];

  return (
    <section className={`bg-white rounded-2xl border border-gray-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col min-w-0 ${className}`}>
      {(title || description || headerMeta) && (
        <div className="px-5 py-4 sm:px-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerMeta && (
            <div className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-digital-blue-50 text-digital-blue-700 border border-digital-blue-100 text-xs font-bold whitespace-nowrap">
              {headerMeta}
            </div>
          )}
        </div>
      )}

      <div className={`flex-1 min-w-0 ${tableViewportClassName}`}>
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-200/80 bg-gray-50/95 backdrop-blur">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  scope="col"
                  className={`px-4 first:pl-5 last:pr-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider ${col.headerClassName || 'whitespace-nowrap'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80 text-sm text-gray-700">
            {isLoading ? (
              Array.from({ length: pagination?.pageSize || 8 }, (_, i) => (
                <tr key={`skeleton-${i}`} className="bg-white">
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`px-4 first:pl-5 last:pr-5 py-4 ${col.cellClassName || ''}`}>
                      <Skeleton className={`h-4 ${colIdx === 0 ? 'w-8 mx-auto' : 'w-full max-w-[150px]'}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyMessage}
                    icon={emptyIcon}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr 
                  key={row.id || rowIdx}
                  className="odd:bg-white even:bg-gray-50/30 hover:bg-digital-blue-50/45 transition-colors group"
                >
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`px-4 first:pl-5 last:pr-5 py-4 align-middle ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-5 py-3.5 sm:px-6 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="font-medium text-gray-500">
            {pagination.totalItems !== undefined && paginationMeta && (
              <span>
                Menampilkan <strong className="font-bold text-gray-800">{paginationMeta.rangeLabel}</strong> dari{' '}
                <strong className="font-bold text-gray-800">{paginationMeta.totalLabel}</strong> data
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange?.(pagination.currentPage - 1)}
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
                    onClick={() => pagination.onPageChange?.(item)}
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
              onClick={() => pagination.onPageChange?.(pagination.currentPage + 1)}
              disabled={paginationMeta?.isLastPage}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-digital-blue-200 hover:text-digital-blue-700 hover:bg-digital-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 disabled:hover:border-gray-200 transition-colors cursor-pointer"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
