import Skeleton from '../feedback/Skeleton';
import EmptyState from '../feedback/EmptyState';
import { Table as TableIcon } from 'lucide-react';

/**
 * ModalTable - Reusable Styled Table Container khusus Popup Modal
 * @param {Array} columns - [{ key, label, icon?: Icon, headerClassName, cellClassName, render: (row, idx) => JSX }]
 * @param {Array} data - Array data baris tabel
 * @param {boolean} isLoading - Loading state
 * @param {string|null} error - Error message bila gagal
 * @param {string} emptyTitle - Judul empty state
 * @param {string} emptyDescription - Deskripsi empty state
 * @param {Component} emptyIcon - Icon untuk empty state
 * @param {string} maxHeight - Max height container (e.g. 'max-h-[240px]')
 */
export default function ModalTable({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  emptyTitle = 'Tidak Ada Data',
  emptyDescription = 'Belum ada data riwayat dari backend.',
  emptyIcon = TableIcon,
  maxHeight = 'max-h-[235px]',
  className = '',
}) {
  if (isLoading) {
    return (
      <div className="space-y-2.5 py-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-1/4 rounded-lg" />
            <Skeleton className="h-7 flex-1 rounded-lg" />
            <Skeleton className="h-7 w-1/4 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <EmptyState
        title="Gagal Memuat Data"
        description={error}
        icon={emptyIcon}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  return (
    <div className={`bg-white border border-digital-blue-100/90 rounded-2xl overflow-hidden shadow-xs flex flex-col min-w-0 ${className}`}>
      <div className={`${maxHeight} overflow-auto custom-scrollbar`}>
        <table className="w-full min-w-[560px] text-left border-collapse text-xs">
          {/* Sticky Header */}
          <thead className="bg-gradient-to-r from-digital-blue-50/90 to-digital-blue-50/60 backdrop-blur-sm sticky top-0 z-10 border-b border-digital-blue-100 text-digital-blue-900">
            <tr>
              {columns.map((col, idx) => {
                const Icon = col.icon;
                return (
                  <th
                    key={col.key || idx}
                    className={`px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-digital-blue-900 ${
                      col.headerClassName || ''
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.headerClassName?.includes('text-right') ? 'justify-end' : ''
                      }`}
                    >
                      {Icon && <Icon size={13} className="text-digital-blue-600 shrink-0" />}
                      <span>{col.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body with alternating rows & hover */}
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || row.key || rowIdx}
                className={`transition-colors duration-150 hover:bg-digital-blue-50/50 ${
                  rowIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key || colIdx}
                    className={`px-4 py-2.5 ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
