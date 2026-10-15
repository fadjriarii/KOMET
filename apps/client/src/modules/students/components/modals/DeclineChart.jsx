import EmptyState from '../../../../components/common/feedback/EmptyState';
import ChartLoadingSkeleton from '../../../../components/common/feedback/ChartLoadingSkeleton';
import TrendBarChart from '../../../../components/common/charts/TrendBarChart';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { BarChart3 } from 'lucide-react';

/** Chart tren penurunan: skeleton → empty → bar chart intake 5 periode. */
export function DeclineChart({ chartList, hasData, isLoading, error, yearsCount = 5 }) {
  if (isLoading) return <ChartLoadingSkeleton />;
  if (!hasData) {
    return (
      <EmptyState
        title="Tidak Ada Data Penurunan"
        description={error || 'Belum ada data fluktuasi mahasiswa baru dari backend.'}
        icon={BarChart3}
      />
    );
  }
  return (
    <div className="h-48 sm:h-56 md:h-64 w-full">
      <TrendBarChart
        data={chartList}
        xDataKey="academicYear"
        bars={[
          {
            dataKey: 'intakeCount',
            name: `Jumlah Intake Mahasiswa Baru (${yearsCount} Periode)`,
            color: '#2563eb',
            labelKey: 'intakeCount',
          },
        ]}
        tooltipContent={
          <TrendChartTooltip
            titleKey="academicYear"
            rows={[
              {
                key: 'intakeCount',
                label: 'Jumlah Intake',
                colorClass: 'bg-digital-blue-600',
              },
            ]}
            titleAccessory={(item) =>
              item.label && (
                <span className="w-5 h-5 rounded-full bg-digital-blue-50 text-digital-blue-700 font-bold inline-flex items-center justify-center text-[10px] border border-digital-blue-200">
                  {item.label}
                </span>
              )
            }
          />
        }
      />
    </div>
  );
}
