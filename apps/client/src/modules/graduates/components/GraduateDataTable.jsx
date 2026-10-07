import { GraduationCap, Award, CheckCircle2 } from 'lucide-react';
import DataTable from '../../../components/common/tables/DataTable';
import Badge from '../../../components/common/ui/Badge';
import { formatNumber } from '@komet/shared/formatters';
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
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 whitespace-normal">
        <GraduationCap size={13} className="text-gray-400" />
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
      <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
        {row.tahunLulus ?? '-'}
      </span>
    ),
  },
  {
    key: 'ipk',
    label: 'IPK',
    headerClassName: 'w-[7%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <Badge size="sm" variant={badgeVariantForPredikat(row.predikatLulus)} className="font-bold">
        {typeof row.ipk === 'number' ? row.ipk.toFixed(2) : (row.ipk ?? '-')}
      </Badge>
    ),
  },
  {
    key: 'sksLulus',
    label: 'SKS',
    headerClassName: 'w-[5%] text-center',
    cellClassName: 'text-center font-medium text-gray-700 text-xs',
    render: (row) => `${row.sksLulus ?? '-'}`,
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
          <Award size={12} className="mr-1 opacity-80" />
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
      <Badge size="sm" variant="success" className="justify-center text-xs">
        <CheckCircle2 size={12} className="mr-1 opacity-80" />
        <span>{row.statusKelulusan || 'Lulus'}</span>
      </Badge>
    ),
  },
];

/**
 * GraduateDataTable - Pure presenter tabel daftar wisudawan / lulusan
 * Data berasal dari endpoint GET /api/graduates/list (server-side pagination).
 */
export default function GraduateDataTable({
  rows = [],
  pagination,
  onPageChange,
  isLoading = false,
}) {
  return (
    <DataTable
      title="Daftar Lulusan"
      description="Daftar identitas wisudawan, capaian IPK, SKS lulus, dan predikat kelulusan."
      headerMeta={`${formatNumber(pagination?.total || 0)} lulusan`}
      columns={COLUMNS}
      rowNumber
      data={rows}
      isLoading={isLoading}
      emptyTitle="Lulusan Tidak Ditemukan"
      emptyMessage="Tidak ada data lulusan yang cocok dengan filter yang dipilih."
      emptyIcon={GraduationCap}
      pagination={pagination}
      onPageChange={onPageChange}
      tableClassName="table-fixed min-w-[850px]"
      tableViewportClassName="overflow-x-hidden overflow-y-hidden"
      density="compact"
      className="min-h-[360px]"
    />
  );
}
