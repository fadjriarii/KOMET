// Tabel data universal dengan paginasi dan drag-to-scroll horizontal
// Kolom: { key, header, render?, className?, headerClass?, align? }
// Props: data, columns, tableTitle, keyField, defaultPageSize, pageSizeOptions, sortFn, emptyMessage
import React, { useMemo, useRef, useState } from 'react';
import { TablePagination } from './TablePagination';
import { useTableDragScroll } from '@/hooks/useTableDragScroll';

const DataTable = ({
  data = [],
  columns = [],
  tableTitle = 'Data Registry',
  keyField = 'nim',
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  sortFn,
  emptyMessage = 'Tidak ada data yang sesuai dengan filter yang diterapkan.',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset ke halaman 1 saat panjang data berubah
  const prevDataLength = useRef(data.length);
  if (data.length !== prevDataLength.current) {
    prevDataLength.current = data.length;
    if (currentPage !== 1) setCurrentPage(1);
  }

  // Urutkan data lalu potong sesuai halaman aktif
  const sortedData = useMemo(() => {
    if (!sortFn) return data;
    return [...data].sort(sortFn);
  }, [data, sortFn]);

  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pageData = sortedData.slice(startIndex, endIndex);

  const tableRef = useRef(null);
  const dragScroll = useTableDragScroll(tableRef);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header tabel */}
      <div className="px-5 py-3.5 border-b border-surface-container-high flex items-center justify-between">
        <span className="text-[13px] font-bold text-on-surface">{tableTitle}</span>
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
          {totalItems.toLocaleString('en-US')} records
        </span>
      </div>

      {/* Area tabel dengan drag-to-scroll horizontal */}
      <div
        ref={tableRef}
        className="overflow-x-auto"
        style={{ cursor: dragScroll?.isDragging ? 'grabbing' : 'grab' }}
        {...dragScroll?.handlers}
      >
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-surface-container-low text-[12px] uppercase font-bold tracking-wider text-on-surface-variant border-b border-surface-container-high">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    'px-4 py-3 whitespace-nowrap select-none',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.headerClass || '',
                  ].join(' ')}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[32px] block mb-2 text-outline">search_off</span>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((item, rowIdx) => (
                <tr
                  key={item[keyField] || startIndex + rowIdx}
                  className="border-b border-surface-container-high/60 hover:bg-primary/10 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-2.5 whitespace-nowrap',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                        col.className || '',
                      ].join(' ')}
                    >
                      {col.render ? col.render(item, startIndex + rowIdx, safePage) : (item[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Komponen paginasi bersama */}
      <TablePagination
        currentPage={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  );
};

export default DataTable;
