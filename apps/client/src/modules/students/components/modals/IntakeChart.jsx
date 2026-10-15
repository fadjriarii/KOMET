import EmptyState from '../../../../components/common/feedback/EmptyState';
import ChartLoadingSkeleton from '../../../../components/common/feedback/ChartLoadingSkeleton';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { formatSignedPercentage } from '@komet/shared/formatters';
import { BarChart3 } from 'lucide-react';

/** Chart tren intake: skeleton → empty → bar chart semester 1. */
export function IntakeChart({ trendList, hasData, isLoading, error }) {
  if (isLoading) return <ChartLoadingSkeleton />;
  if (!hasData) {
    return (
      <EmptyState
        title="Tidak Ada Data Tren Intake"
        description={error || 'Belum ada data tren intake mahasiswa baru dari backend.'}
        icon={BarChart3}
      />
    );
  }
  return (
    <div className="h-48 sm:h-56 md:h-64 w-full">
      <TrendBarChart
        data={trendList}
        bars={[
          {
            dataKey: 'intakeCount',
            name: 'Jumlah Intake Mahasiswa Baru (Semester 1)',
            color: '#2563eb',
            labelKey: 'intakeCount',
          },
        ]}
        tooltipContent={
          <TrendChartTooltip
            titleKey="tahun"
            rows={[
              {
                key: 'intakeCount',
                label: 'Intake Mahasiswa',
                colorClass: 'bg-digital-blue-600',
              },
            ]}
            footer={{
              key: 'growthPercentage',
              label: 'Pertumbuhan',
              format: formatSignedPercentage,
              valueClassName: (_value, item) =>
                item.growthPercentage === null || item.growthPercentage === undefined
                  ? 'font-bold px-1.5 py-0.5 rounded text-[11px] bg-gray-100 text-gray-500'
                  : `font-bold px-1.5 py-0.5 rounded text-[11px] ${item.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`,
            }}
          />
        }
      />
    </div>
  );
}
