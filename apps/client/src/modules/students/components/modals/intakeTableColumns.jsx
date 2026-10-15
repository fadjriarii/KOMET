import { Calendar, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { CountBadge, YearDotCell } from '../../../../components/common/tables/modalCells';
import { formatSignedPercentage } from '@komet/shared/formatters';

export const INTAKE_TABLE_COLUMNS = [
  {
    key: 'tahun',
    label: 'Tahun Akademik / Angkatan',
    icon: Calendar,
    render: (row) => <YearDotCell value={row.tahun} />,
  },
  {
    key: 'intakeCount',
    label: 'Jumlah Intake (Semester 1)',
    icon: Users,
    headerClassName: 'text-right',
    cellClassName: 'text-right font-medium text-digital-blue-900',
    render: (row) => <CountBadge value={row.intakeCount} />,
  },
  {
    key: 'growthPercentage',
    label: 'Pertumbuhan Intake',
    icon: TrendingUp,
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row) => {
      // Tanpa pembanding tidak ada tren: tampil netral, jangan hijau/merah.
      if (row.growthPercentage === null || row.growthPercentage === undefined) {
        return <span className="text-gray-400 font-medium">-</span>;
      }
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${
            row.isPositive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {row.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {formatSignedPercentage(row.growthPercentage)}
        </span>
      );
    },
  },
];
