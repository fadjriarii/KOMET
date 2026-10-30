import DataTable from '../../../components/common/tables/DataTable';
import Badge from '../../../components/common/ui/Badge';
import { formatDecimal, formatNumber } from '@komet/shared/formatters';
import { STUDENT_STATUS } from '@komet/shared/constants';
import { badgeVariantForPredikat } from '../utils/predikatBadge';

const COLUMNS = [
  {
    key: 'nim',
    label: 'NIM',
    headerClassName: 'w-[8%]',
    cellClassName: 'break-words',
    render: (row) => (
      <span className="font-mono text-xs font-bold text-gray-800 break-words">
        {row.nim || '-'}
      </span>
    ),
  },
  {
    key: 'nama',
    label: 'Nama',
    headerClassName: 'w-[15%]',
    cellClassName: 'break-words',
    render: (row) => (
      <span className="block font-bold text-gray-900 whitespace-normal break-words leading-snug">
        {row.nama || '-'}
      </span>
    ),
  },
  {
    key: 'programStudi',
    label: 'Program Studi',
    headerClassName: 'w-[15%] whitespace-normal leading-tight',
    cellClassName: 'break-words',
    render: (row) => (
      <span className="block font-semibold text-gray-800 whitespace-normal break-words leading-snug">
        {row.programStudi || '-'}
      </span>
    ),
  },
  {
    key: 'fakultas',
    label: 'Fakultas',
    headerClassName: 'w-[12%]',
    cellClassName: 'text-gray-600 whitespace-normal break-words leading-snug',
    render: (row) => row.fakultas || '-',
  },
  {
    key: 'jenjang',
    label: 'Jenjang',
    headerClassName: 'w-[6%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100/80">
        {row.jenjang || '-'}
      </span>
    ),
  },
  {
    key: 'angkatan',
    label: 'Angkatan',
    headerClassName: 'w-[7%] text-center',
    cellClassName: 'text-center whitespace-normal break-words',
    render: (row) => (
      <span className="text-xs font-semibold text-gray-700 whitespace-normal">
        {row.angkatan || '-'}
      </span>
    ),
  },
  {
    key: 'tahunLulus',
    label: 'Tahun Lulus',
    headerClassName: 'w-[8%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <span className="text-xs font-semibold text-gray-700">{row.tahunLulus ?? '-'}</span>
    ),
  },
  {
    key: 'ipk',
    label: 'IPK',
    headerClassName: 'w-[7%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <Badge size="sm" variant={badgeVariantForPredikat(row.predikatLulus)} className="font-bold">
        {formatDecimal(row.ipk, 2)}
      </Badge>
    ),
  },
  {
    key: 'sksLulus',
    label: 'SKS',
    headerClassName: 'w-[5%] text-center',
    cellClassName: 'text-center font-medium text-gray-700 text-xs',
    render: (row) => (row.sksLulus === null || row.sksLulus === undefined ? '-' : row.sksLulus),
  },
  {
    key: 'predikatLulus',
    label: 'Predikat Kelulusan',
    headerClassName: 'w-[13%] text-center whitespace-normal break-words leading-tight',
    cellClassName: 'text-center',
    render: (row) => {
      const predikat = row.predikatLulus ?? '-';
      return (
        <Badge
          size="sm"
          variant={badgeVariantForPredikat(row.predikatLulus)}
          className="justify-center text-xs"
        >
          <span className="whitespace-normal break-words">{predikat}</span>
        </Badge>
      );
    },
  },
  {
    key: 'statusKelulusan',
    label: 'Status',
    headerClassName: 'w-[8%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <Badge
        size="sm"
        variant={row.statusKelulusan === STUDENT_STATUS.LULUS ? 'success' : 'default'}
        className="justify-center text-xs"
      >
        <span>{row.statusKelulusan || '-'}</span>
      </Badge>
    ),
  },
];

/**
 * GraduateDataTable - Pure presenter tabel daftar lulusan
 * Data berasal dari endpoint GET /api/graduates/list (server-side pagination).
 */
export default function GraduateDataTable({
  rows = [],
  pagination,
  onPageChange,
  isLoading = false,
  error = null,
}) {
  const headerMeta =
    error && rows.length === 0
      ? 'Gagal memuat data'
      : isLoading && rows.length === 0
        ? 'Memuat…'
        : `${formatNumber(pagination?.total || 0)} lulusan`;

  return (
    <DataTable
      title="Daftar Lulusan"
      description="Daftar identitas lulusan, capaian IPK, SKS lulus, dan predikat kelulusan."
      headerMeta={headerMeta}
      columns={COLUMNS}
      rowNumber
      rowKey="nim"
      data={rows}
      isLoading={isLoading}
      error={error}
      emptyTitle="Lulusan Tidak Ditemukan"
      emptyMessage="Tidak ada data lulusan yang cocok dengan filter yang dipilih."
      emptyIcon={null}
      pagination={pagination}
      onPageChange={onPageChange}
      tableClassName="table-fixed min-w-[1400px] 2xl:min-w-[850px]"
      tableViewportClassName="overflow-x-auto overflow-y-hidden custom-scrollbar"
      density="compact"
      className="min-h-[360px]"
    />
  );
}
