import Skeleton from '../../feedback/Skeleton';
import EmptyState from '../../feedback/EmptyState';
import { Table as TableIcon } from 'lucide-react';
import { ModalTableHead } from './ModalTableHead';
import { ModalTableBody } from './ModalTableBody';

/**
 * ModalTable - Reusable Styled Table Container khusus Popup Modal
 * @param {Array} columns - [{ key, label, icon?: Icon, headerClassName, cellClassName, render: (row, idx) => JSX }]
 * @param {Array} data - Array data baris tabel
 * @param {boolean} isLoading - Loading state
 * @param {string|null} error - Error message bila gagal
 * @param {string} emptyTitle - Judul empty state
 * @param {string} emptyDescription - Deskripsi empty state
 * @param {Component} emptyIcon - Icon untuk empty state
 */
export default function ModalTable({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  emptyTitle = 'Tidak Ada Data',
  emptyDescription = 'Belum ada data riwayat dari backend.',
  emptyIcon = TableIcon,
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
    return <EmptyState title="Gagal Memuat Data" description={error} icon={emptyIcon} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;
  }

  return (
    <div
      className={`bg-white border border-digital-blue-100/90 rounded-2xl overflow-hidden shadow-xs flex flex-col min-w-0 ${className}`}
    >
      <div className="max-h-[235px] overflow-auto custom-scrollbar">
        <table className="w-full min-w-[560px] text-left border-collapse text-xs">
          <ModalTableHead columns={columns} />
          <ModalTableBody columns={columns} data={data} />
        </table>
      </div>
    </div>
  );
}
