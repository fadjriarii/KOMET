import { Calendar, Globe, Percent, Users } from 'lucide-react';
import { YearDotCell } from '../../../../components/common/tables/modalCells';
import { formatNumber, formatPercentage } from '@komet/shared/formatters';

export const FOREIGN_TABLE_COLUMNS = [
  {
    key: 'academicYear',
    label: 'Tahun Akademik',
    icon: Calendar,
    render: (row) => <YearDotCell value={row.academicYear} />,
  },
  {
    key: 'foreignCount',
    label: 'Mahasiswa Asing (Non-WNI)',
    icon: Globe,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => (
      <span className="bg-digital-blue-50/80 text-digital-blue-800 px-2 py-0.5 rounded-md border border-digital-blue-100 font-medium">
        {formatNumber(row.foreignCount)} mhs
      </span>
    ),
  },
  {
    key: 'totalCount',
    label: 'Total Mahasiswa Aktif',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-gray-800',
    render: (row) => `${formatNumber(row.totalCount)} mhs`,
  },
  {
    key: 'percentage',
    label: 'Persentase Mahasiswa Asing',
    icon: Percent,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-100/70 text-digital-blue-800 border border-digital-blue-200 shadow-2xs">
        {formatPercentage(row.percentage)}
      </span>
    ),
  },
];
