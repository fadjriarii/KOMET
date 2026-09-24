import { GraduationCap, Users } from 'lucide-react';
import DataTable from '../../../components/common/tables/DataTable';
import Badge from '../../../components/common/ui/Badge';
import { formatNumber, getStatusBadgeVariant, getRowNumber } from '../../../utils/logic';

/**
 * StudentDataTable - Pure presenter tabel daftar mahasiswa
 * Data berasal dari endpoint GET /api/students/students (server-side pagination).
 */
export default function StudentDataTable({
  rows = [],
  page = 1,
  limit = 10,
  pagination,
  onPageChange,
  isLoading = false,
}) {
  const columns = [
    {
      key: 'no',
      label: 'No',
      headerClassName: 'w-[5%] text-center',
      cellClassName: 'text-center text-gray-400 font-medium',
      render: (_row, idx) => getRowNumber(idx, page, limit),
    },
    {
      key: 'nim',
      label: 'NIM',
      headerClassName: 'w-[10%]',
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
      headerClassName: 'w-[18%]',
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
      headerClassName: 'w-[17%] whitespace-normal leading-tight',
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
      headerClassName: 'w-[13%]',
      cellClassName: 'text-gray-600 whitespace-normal break-words leading-snug',
    },
    {
      key: 'angkatan',
      label: 'Angkatan',
      headerClassName: 'w-[10%]',
      cellClassName: 'whitespace-normal break-words',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 whitespace-normal">
          <GraduationCap size={13} className="text-gray-400" />
          {row.angkatan || '-'}
        </span>
      ),
    },
    {
      key: 'periode',
      label: 'Periode',
      headerClassName: 'w-[8%] text-center',
      cellClassName: 'text-center break-words',
      render: (row) => row.periodeMasuk || row.periode || '-',
    },
    {
      key: 'semester',
      label: 'Semester',
      headerClassName: 'w-[8%] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center justify-center min-w-8 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
          {row.semester || '-'}
        </span>
      ),
    },
    {
      key: 'kewarganegaraan',
      label: 'Kewarganegaraan',
      headerClassName: 'w-[10%] text-center whitespace-normal break-words leading-tight',
      cellClassName: 'text-center',
      render: (row) => (
        <Badge
          size="sm"
          variant={row.kewarganegaraan === 'WNA' ? 'warning' : 'default'}
          className="justify-center min-w-16"
        >
          {row.kewarganegaraan || '-'}
        </Badge>
      ),
    },
    {
      key: 'statusKeaktifan',
      label: 'Status Keaktifan',
      headerClassName: 'w-[11%] whitespace-normal leading-tight',
      render: (row) => (
        <Badge size="sm" variant={getStatusBadgeVariant(row.statusKeaktifan)}>
          <span className="whitespace-normal break-words">{row.statusKeaktifan || '-'}</span>
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      title="Daftar Mahasiswa"
      description="Daftar identitas akademik, asal, dan status keaktifan mahasiswa."
      headerMeta={`${formatNumber(pagination?.total || 0)} mahasiswa`}
      columns={columns}
      data={rows}
      isLoading={isLoading}
      emptyTitle="Mahasiswa Tidak Ditemukan"
      emptyMessage="Tidak ada mahasiswa yang cocok dengan filter yang dipilih."
      emptyIcon={Users}
      pagination={{
        currentPage: page,
        totalPages: pagination?.totalPages || 1,
        totalItems: pagination?.total,
        pageSize: limit,
        onPageChange,
      }}
      tableClassName="table-fixed"
      tableViewportClassName="overflow-x-hidden overflow-y-hidden"
      className="min-h-[360px]"
    />
  );
}
