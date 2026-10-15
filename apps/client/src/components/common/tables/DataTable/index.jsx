import { memo } from 'react';
import { Database } from 'lucide-react';
import { useTableModel } from './useTableModel';
import { TableHead } from './TableHead';
import { TableBody } from './TableBody';
import { TablePagination } from './TablePagination';

/**
 * DataTable - Reusable Table Container
 * Menyediakan layout tabel standar, loading state, empty state, dan pagination.
 * Bentuk `pagination` sama dengan yang dikirim server (`{ page, limit, total,
 * totalPages }`), jadi tidak ada adapter yang ditulis ulang per modul tabel.
 */
function DataTable({
  columns = [], // [{ key: 'id', label: 'ID', render: (row) => ... }]
  data = [],
  isLoading = false,
  error = null, // kegagalan fetch: tampil jujur, jangan samarkan sebagai "tidak ada data"
  title,
  description,
  headerMeta,
  emptyTitle = 'Belum Ada Data',
  emptyMessage = 'Belum ada data tersedia',
  emptyIcon = Database,
  pagination, // { page, limit, total, totalPages } — bentuk hook/server apa adanya
  onPageChange, // dipisah agar pembungkus tidak mengalokasikan objek baru tiap render
  rowNumber = false, // nomor baris absolut; per-hitung di sini, bukan per modul tabel
  rowKey = 'id', // key stabil baris; tabel mahasiswa memakai 'nim' (PK-nya tidak punya id)
  className = '',
  tableClassName = 'min-w-[920px]',
  tableViewportClassName = 'overflow-x-auto overflow-y-hidden custom-scrollbar',
  density = 'default',
}) {
  const cellPadding = density === 'compact' ? 'px-2 py-1.5' : 'px-4 py-4';
  const headerPadding = density === 'compact' ? 'px-2 py-2' : 'px-4 py-3';
  const tableInset = density === 'compact' ? 'px-2' : '';
  const { visibleColumns, paginationMeta, paginationItems } = useTableModel({
    columns,
    rowNumber,
    pagination,
    dataLength: data.length,
  });

  return (
    <section
      className={`bg-white rounded-2xl border border-gray-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.04)] overflow-hidden flex flex-col min-w-0 ${className}`}
    >
      {(title || description || headerMeta) && (
        <div className="px-5 py-4 sm:px-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-bold text-gray-900 tracking-tight">{title}</h3>}
            {description && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          {headerMeta && (
            <div className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-digital-blue-50 text-digital-blue-700 border border-digital-blue-100 text-xs font-bold whitespace-nowrap">
              {headerMeta}
            </div>
          )}
        </div>
      )}

      <div className={`flex-1 min-w-0 ${tableInset} ${tableViewportClassName}`}>
        {error && data.length > 0 && (
          <p className="px-5 pt-3 text-xs text-amber-700">
            Data mungkin basi: {typeof error === 'string' ? error : 'gagal memuat ulang.'}
          </p>
        )}
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          <TableHead visibleColumns={visibleColumns} headerPadding={headerPadding} />
          <tbody className="divide-y divide-gray-100/80 text-sm text-gray-700">
            <TableBody
              visibleColumns={visibleColumns}
              data={data}
              isLoading={isLoading}
              error={error}
              cellPadding={cellPadding}
              rowKey={rowKey}
              emptyTitle={emptyTitle}
              emptyMessage={emptyMessage}
              emptyIcon={emptyIcon}
              pageLimit={pagination?.limit}
            />
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <TablePagination
        pagination={pagination}
        paginationMeta={paginationMeta}
        paginationItems={paginationItems}
        onPageChange={onPageChange}
      />
    </section>
  );
}

export default memo(DataTable);
