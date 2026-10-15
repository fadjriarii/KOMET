import { Calendar, TrendingUp, TrendingDown, Users, Percent } from 'lucide-react';
import { CountBadge } from '../../../../components/common/tables/modalCells';
import { formatSignedPercentage } from '@komet/shared/formatters';

export const DECLINE_TABLE_COLUMNS = [
  {
    key: 'label',
    label: 'Simbol Rumus',
    icon: Percent,
    render: (row, idx) => (
      <span className="w-6 h-6 rounded-full bg-digital-blue-100/80 text-digital-blue-800 font-bold inline-flex items-center justify-center text-xs border border-digital-blue-200 shadow-2xs">
        {row.label || String.fromCharCode(65 + idx)}
      </span>
    ),
  },
  {
    key: 'academicYear',
    label: 'Tahun Akademik',
    icon: Calendar,
    cellClassName: 'font-semibold text-gray-900',
  },
  {
    key: 'intakeCount',
    label: 'Jumlah Mahasiswa Baru (Smt 1)',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => <CountBadge value={row.intakeCount} />,
  },
  {
    key: 'changeFromPrev',
    label: 'Persentase Perubahan',
    icon: TrendingUp,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => {
      const hasChange = row.changeFromPrev !== null && row.changeFromPrev !== undefined;
      const isPositive = Number(row.changeFromPrev) >= 0;

      if (!hasChange) {
        return <span className="text-gray-400 font-medium">-</span>;
      }

      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${
            isPositive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {formatSignedPercentage(row.changeFromPrev, 1)}
        </span>
      );
    },
  },
];
