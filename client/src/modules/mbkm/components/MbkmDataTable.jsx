import { useMemo } from 'react';
import { Briefcase, Building2, CheckCircle2, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import DataTable from '../../../components/common/tables/DataTable';
import Badge from '../../../components/common/ui/Badge';
import { formatNumber, getRowNumber } from '../../../utils/uiHelpers';

function getStatusBadgeVariant(status) {
  if (!status) return 'default';
  const s = String(status).toLowerCase();
  if (s.includes('selesai')) return 'success';
  if (s.includes('setuju') || s.includes('disetujui') || s.includes('aktif') || s.includes('berjalan')) return 'primary';
  if (s.includes('aju') || s.includes('diajukan') || s.includes('evaluasi') || s.includes('proses')) return 'warning';
  if (s.includes('tolak') || s.includes('batal')) return 'danger';
  return 'default';
}

function getStatusIcon(status) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  if (s.includes('selesai')) return CheckCircle2;
  if (s.includes('setuju') || s.includes('disetujui') || s.includes('aktif')) return Briefcase;
  if (s.includes('aju') || s.includes('evaluasi')) return Clock;
  return AlertCircle;
}

function getActivityBadgeVariant(jenis) {
  if (!jenis) return 'default';
  const j = String(jenis).toLowerCase();
  if (j.includes('magang')) return 'primary';
  if (j.includes('studi') || j.includes('independen')) return 'info';
  if (j.includes('iisma') || j.includes('pertukaran')) return 'warning';
  if (j.includes('riset') || j.includes('penelitian')) return 'success';
  return 'default';
}

/**
 * MbkmDataTable - Presenter tabel daftar partisipan MBKM
 * Data berasal dari endpoint GET /api/mbkm/list (server-side pagination).
 */
export default function MbkmDataTable({
  rows = [],
  page = 1,
  limit = 10,
  pagination,
  onPageChange,
  isLoading = false,
}) {
  const columns = useMemo(() => [
    {
      key: 'no',
      label: 'No',
      headerClassName: 'w-[4%] text-center',
      cellClassName: 'text-center text-gray-400 font-medium',
      render: (_row, idx) => getRowNumber(idx, page, limit),
    },
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
      label: 'Nama Mahasiswa',
      headerClassName: 'w-[14%]',
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
      headerClassName: 'w-[14%] whitespace-normal leading-tight',
      cellClassName: 'break-words',
      render: (row) => (
        <span className="block font-semibold text-gray-800 whitespace-normal break-words leading-snug">
          {row.programStudi || row.program_studi || '-'}
        </span>
      ),
    },
    {
      key: 'fakultas',
      label: 'Fakultas',
      headerClassName: 'w-[11%]',
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
      key: 'periode',
      label: 'Periode',
      headerClassName: 'w-[6%] text-center',
      cellClassName: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
          {row.periode || '-'}
        </span>
      ),
    },
    {
      key: 'jenisAktivitas',
      label: 'BKP MBKM',
      headerClassName: 'w-[11%] text-center whitespace-normal break-words leading-tight',
      cellClassName: 'text-center',
      render: (row) => {
        const jenis = row.jenisAktivitas || row.jenis_kegiatan || row.bentuk_kegiatan || '-';
        return (
          <Badge size="sm" variant={getActivityBadgeVariant(jenis)} className="justify-center text-xs">
            <span className="whitespace-normal break-words">{jenis}</span>
          </Badge>
        );
      },
    },
    {
      key: 'mitra',
      label: 'Mitra Instansi',
      headerClassName: 'w-[11%]',
      cellClassName: 'break-words',
      render: (row) => {
        const mitra = row.mitra || row.instansi || '-';
        return (
          <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium whitespace-normal break-words">
            <Building2 size={13} className="text-gray-400 shrink-0" />
            <span>{mitra}</span>
          </div>
        );
      },
    },
    {
      key: 'statusAktivitas',
      label: 'Status',
      headerClassName: 'w-[8%] text-center',
      cellClassName: 'text-center',
      render: (row) => {
        const status = row.statusAktivitas || row.status_aktivitas || '-';
        const IconComponent = getStatusIcon(status);
        return (
          <Badge size="sm" variant={getStatusBadgeVariant(status)} className="justify-center text-xs">
            {IconComponent && <IconComponent size={12} className="mr-1 opacity-80" />}
            <span>{status}</span>
          </Badge>
        );
      },
    },
  ], [page, limit]);

  return (
    <DataTable
      title="Daftar Partisipan MBKM"
      description="Daftar mahasiswa peserta program Merdeka Belajar Kampus Merdeka, mitra instansi, dan status verifikasi."
      headerMeta={`${formatNumber(pagination?.total || 0)} partisipan`}
      columns={columns}
      data={rows}
      isLoading={isLoading}
      emptyTitle="Partisipan Tidak Ditemukan"
      emptyMessage="Tidak ada data MBKM yang cocok dengan filter yang dipilih."
      emptyIcon={Briefcase}
      pagination={{
        currentPage: page,
        totalPages: pagination?.totalPages || 1,
        totalItems: pagination?.total,
        pageSize: limit,
        onPageChange,
      }}
      tableClassName="table-fixed min-w-[880px]"
      tableViewportClassName="overflow-x-hidden overflow-y-hidden"
      density="compact"
      className="min-h-[360px]"
    />
  );
}
