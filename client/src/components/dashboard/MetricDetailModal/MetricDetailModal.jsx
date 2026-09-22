import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatGpa } from '@/utils/formatGpa';

/**
 * Definisi kolom audit untuk tabel rincian data kelulusan di dalam modal.
 * Judul kolom berbahasa Inggris; angka diformat tabular-nums via CSS sel.
 */
const AUDIT_COLUMNS = [
  {
    accessorKey: 'nim',
    header: 'Student ID',
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-on-surface">{row.getValue('nim')}</span>
    ),
  },
  {
    accessorKey: 'nama',
    header: 'Name',
    cell: ({ row }) => <span className="text-on-surface">{row.getValue('nama')}</span>,
  },
  {
    accessorKey: 'program_studi',
    header: 'Study Program',
    cell: ({ row }) => (
      <span className="text-on-surface-variant">{row.getValue('program_studi')}</span>
    ),
  },
  {
    accessorKey: 'jenjang',
    header: 'Level',
    cell: ({ row }) => (
      <span className="inline-flex rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
        {row.getValue('jenjang')}
      </span>
    ),
  },
  {
    accessorKey: 'tahun_lulus',
    header: 'Year',
    cell: ({ row }) => (
      <span className="tabular-nums text-right">{row.getValue('tahun_lulus')}</span>
    ),
  },
  {
    accessorKey: 'ipk',
    header: 'GPA',
    cell: ({ row }) => (
      <span className="tabular-nums font-bold text-primary">{formatGpa(row.getValue('ipk'))}</span>
    ),
  },
];

/**
 * Modal rincian metrik (PRD bagian 4 - Modal System).
 * Menampilkan tabel audit bergaya TanStack Table berisi baris data kelulusan
 * mentah sebagai sumber perhitungan kartu KPI yang diklik.
 *
 * @param {Object} props
 * @param {boolean} props.open - Status keterbukaan modal
 * @param {Function} props.onOpenChange - Handler perubahan status
 * @param {string} props.title - Judul modal (Bahasa Inggris)
 * @param {string} props.description - Subjudul penjelas lingkup data
 * @param {Array<Kelulusan>} props.rows - Baris data audit
 */
export const MetricDetailModal = ({ open, onOpenChange, title, description, rows }) => {
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data: rows,
    columns: AUDIT_COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const rangeLabel = useMemo(() => {
    const total = table.getFilteredRowModel().rows.length;
    if (total === 0) return 'No records';
    const from = pageIndex * table.getState().pagination.pageSize + 1;
    const to = Math.min((pageIndex + 1) * table.getState().pagination.pageSize, total);
    return `${from}–${to} of ${total}`;
  }, [pageIndex, pageCount, rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Tabel audit: header 44px, baris 52px, hover slate-100 (DESIGN.md) */}
        <div className="max-h-[420px] overflow-auto rounded-card border border-[#E2E8F0]">
          <table className="w-full text-left text-sm tabular-nums">
            <thead className="sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b-2 border-[#E2E8F0] bg-canvas">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-11 px-3 font-label-sm text-label-sm uppercase text-[#475569]"
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={
                    i % 2 === 1
                      ? 'border-b border-[#F1F5F9] hover:bg-[#F1F5F9]'
                      : 'border-b border-[#F1F5F9] bg-white hover:bg-[#F1F5F9]'
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="h-[52px] px-3 py-2 text-body-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kontrol paginasi tabel */}
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span className="tabular-nums">{rangeLabel}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
