import { STUDENT_STATUS } from '@komet/shared/constants';
import Badge from '../../../components/common/ui/Badge';
import { getStatusBadgeVariant } from '../../../utils/uiHelpers';
import { formatCutiHistory } from '../../../utils/studentText';

export const STUDENT_TABLE_COLUMNS = [
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
    headerClassName: 'w-[20%]',
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
    headerClassName: 'w-[12%] whitespace-normal leading-tight',
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
  },
  {
    key: 'angkatan',
    label: 'Angkatan',
    headerClassName: 'w-[7%]',
    cellClassName: 'whitespace-normal break-words',
    render: (row) => (
      <span className="text-xs font-semibold text-gray-700 whitespace-normal">
        {row.angkatan || '-'}
      </span>
    ),
  },
  {
    key: 'periode',
    label: 'Periode',
    headerClassName: 'w-[6%] text-center',
    cellClassName: 'text-center break-words',
    render: (row) => row.periode || '-',
  },
  {
    key: 'semester',
    label: 'Semester',
    headerClassName: 'w-[6%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <span className="inline-flex items-center justify-center min-w-8 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
        {row.semester || '-'}
      </span>
    ),
  },
  {
    key: 'jenjang',
    label: 'Jenjang',
    headerClassName: 'w-[7%] text-center',
    cellClassName: 'text-center',
    render: (row) => (
      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100/80">
        {row.jenjang || '-'}
      </span>
    ),
  },
  {
    key: 'kewarganegaraan',
    label: 'Kewarganegaraan',
    headerClassName: 'w-[12%] text-center whitespace-normal break-words leading-tight',
    cellClassName: 'text-center',
    render: (row) => (
      <Badge
        size="sm"
        variant={row.kewarganegaraan && row.kewarganegaraan !== 'Indonesia' ? 'warning' : 'default'}
        className="justify-center min-w-14 text-xs"
      >
        {row.kewarganegaraan || '-'}
      </Badge>
    ),
  },
  {
    key: 'statusKeaktifan',
    label: 'Status Keaktifan',
    headerClassName: 'w-[10%] whitespace-normal leading-tight text-center',
    cellClassName: 'text-center',
    render: (row) => {
      const cutiHistory =
        row.statusKeaktifan === STUDENT_STATUS.CUTI
          ? formatCutiHistory(row.cutiPeriods, row.cutiSemesterCount)
          : '';
      return (
        <div className="inline-flex flex-col items-center gap-1">
          <Badge size="sm" variant={getStatusBadgeVariant(row.statusKeaktifan)}>
            <span className="whitespace-normal break-words">{row.statusKeaktifan || '-'}</span>
          </Badge>
          {cutiHistory && (
            <span className="text-[10px] font-medium leading-tight text-gray-500">
              {cutiHistory}
              {row.isHistoricalCuti ? ' · historis' : ''}
            </span>
          )}
        </div>
      );
    },
  },
];
