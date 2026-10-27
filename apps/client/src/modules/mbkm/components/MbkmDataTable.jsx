import { Briefcase, Building2, Check, GraduationCap, X } from 'lucide-react';
import DataTable from '../../../components/common/tables/DataTable';
import Badge from '../../../components/common/ui/Badge';
import { formatNumber } from '@komet/shared/formatters';
import { badgeVariantForCategory, badgeVariantForJenis } from '../utils/mbkmBadges';

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Tanggal SEVIMA `YYYY-MM-DD`; kosong (data sebelum 2024/2025) = "-". */
function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return '';
  const [year, month, day] = value.split('-').map(Number);
  return dateFormat.format(new Date(year, month - 1, day));
}

const dateRange = (row) =>
  [formatDate(row.tanggalMulai), formatDate(row.tanggalSelesai)].filter(Boolean).join(' s.d. ') ||
  '-';

function buildColumns(jenisOrder) {
  return [
    {
      key: 'nim',
      label: 'NIM',
      headerClassName: 'w-[7%]',
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
      headerClassName: 'w-[12%]',
      cellClassName: 'break-words',
      render: (row) => (
        <div className="leading-snug">
          <span className="block font-bold text-gray-900 whitespace-normal break-words">
            {row.nama || '-'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
            <GraduationCap size={12} aria-hidden="true" className="text-gray-400" />
            {row.angkatan || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'programStudi',
      label: 'Program Studi',
      headerClassName: 'w-[11%] whitespace-normal leading-tight',
      cellClassName: 'break-words',
      render: (row) => (
        <div className="leading-snug">
          <span className="block font-semibold text-gray-800 whitespace-normal break-words">
            {row.programStudi || '-'}
          </span>
          <span className="block text-[11px] text-gray-500 whitespace-normal break-words">
            {row.fakultas || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'periode',
      label: 'Periode',
      headerClassName: 'w-[8%]',
      cellClassName: 'text-xs font-semibold text-gray-700 whitespace-normal leading-snug',
      render: (row) => row.periodeLabel || '-',
    },
    {
      key: 'tanggal',
      label: 'Tanggal Mulai s.d. Selesai',
      headerClassName: 'w-[9%] whitespace-normal leading-tight',
      cellClassName: 'text-xs text-gray-600 whitespace-normal leading-snug',
      render: dateRange,
    },
    {
      key: 'jenisAktivitas',
      label: 'BKP MBKM',
      headerClassName: 'w-[10%] text-center whitespace-normal break-words leading-tight',
      cellClassName: 'text-center',
      render: (row) =>
        row.jenisAktivitas ? (
          <Badge
            size="sm"
            variant={badgeVariantForJenis(row.jenisAktivitas, jenisOrder)}
            className="justify-center text-xs"
          >
            <span className="whitespace-normal break-words">{row.jenisAktivitas}</span>
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'judulAktivitas',
      label: 'Judul Aktivitas',
      headerClassName: 'w-[13%]',
      cellClassName: 'text-xs text-gray-700 whitespace-normal break-words leading-snug',
      render: (row) => row.judulAktivitas || '-',
    },
    {
      key: 'mitra',
      label: 'Mitra Instansi',
      headerClassName: 'w-[10%]',
      cellClassName: 'break-words',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium whitespace-normal break-words">
          <Building2 size={13} aria-hidden="true" className="text-gray-400 shrink-0" />
          <span>{row.mitra || '-'}</span>
        </div>
      ),
    },
    {
      key: 'sksKonversi',
      label: 'SKS Konversi',
      headerClassName: 'w-[6%] text-center whitespace-normal leading-tight',
      cellClassName: 'text-center text-xs tabular-nums',
      render: (row) => (
        <div className="leading-snug">
          <span className="block font-bold text-gray-900">
            {row.sksKonversi === null ? '-' : formatNumber(row.sksKonversi)}
          </span>
          {row.totalSks !== null && row.totalSks !== row.sksKonversi && (
            <span className="block text-[11px] text-gray-500">
              total {formatNumber(row.totalSks)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'statusAktivitas',
      label: 'Status',
      headerClassName: 'w-[7%] text-center',
      cellClassName: 'text-center',
      render: (row) =>
        row.statusAktivitas ? (
          <Badge
            size="sm"
            variant={badgeVariantForCategory(row.statusCategory)}
            className="justify-center text-xs"
          >
            {row.statusAktivitas}
          </Badge>
        ) : (
          '-'
        ),
    },
    {
      key: 'counted',
      label: 'Dihitung',
      headerClassName: 'w-[7%]',
      cellClassName: 'text-xs whitespace-normal leading-snug',
      render: (row) =>
        row.counted ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <Check size={14} aria-hidden="true" /> Ya
          </span>
        ) : (
          <span className="inline-flex items-start gap-1 text-gray-600">
            <X size={14} aria-hidden="true" className="mt-px shrink-0 text-rose-600" />
            <span>{row.countedReason || 'Tidak'}</span>
          </span>
        ),
    },
  ];
}

/**
 * MbkmDataTable - Presenter tabel MBKM. Populasi dan periode sama dengan kartu;
 * kolom Dihitung menjelaskan kenapa sebuah baris masuk atau tidak ke angka kartu.
 * Data berasal dari endpoint GET /api/mbkm/list (server-side pagination).
 */
export default function MbkmDataTable({
  rows = [],
  pagination,
  onPageChange,
  isLoading = false,
  error = null,
  filterOptions = {},
}) {
  return (
    <DataTable
      title="Daftar Aktivitas MBKM"
      description="Aktivitas MBKM pada periode terpilih beserta status dan alasan dihitung atau tidaknya sebagai partisipasi."
      headerMeta={`${formatNumber(pagination?.total || 0)} baris`}
      columns={buildColumns(filterOptions.jenisAktivitas || [])}
      rowNumber
      data={rows}
      isLoading={isLoading}
      error={error}
      emptyTitle="Data Tidak Ditemukan"
      emptyMessage="Tidak ada data MBKM yang cocok dengan filter yang dipilih."
      emptyIcon={Briefcase}
      pagination={pagination}
      onPageChange={onPageChange}
      tableClassName="table-fixed min-w-[1180px]"
      density="compact"
      className="min-h-[360px]"
    />
  );
}
