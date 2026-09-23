import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DataTable - Reusable Table Container
 * Menyediakan layout tabel standar, loading state, empty state, dan pagination
 */
export default function DataTable({
  columns = [], // [{ key: 'id', label: 'ID', render: (row) => ... }]
  data = [],
  isLoading = false,
  emptyMessage = "Belum ada data tersedia",
  pagination, // { currentPage, totalPages, onPageChange, totalItems }
  className = '',
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80 text-sm text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-digital-blue-600 border-t-transparent mb-2"></div>
                  <p className="text-xs">Memuat data...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-gray-400 text-xs">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr 
                  key={row.id || rowIdx}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} className={`px-5 py-3.5 ${col.cellClassName || ''}`}>
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
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-gray-500">
          <div>
            {pagination.totalItems !== undefined && (
              <span>Total <strong className="font-semibold text-gray-800">{pagination.totalItems}</strong> data</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium text-gray-700">
              {pagination.currentPage} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => pagination.onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
