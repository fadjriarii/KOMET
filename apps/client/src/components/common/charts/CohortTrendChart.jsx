import { BarChart3 } from 'lucide-react';
import EmptyState from '../feedback/EmptyState';
import TrendBarChart from './TrendBarChart';
import TrendChartTooltip from './TrendChartTooltip';

/**
 * Chart batang per angkatan (kohort) untuk modal rincian. Pemanggil memberi
 * seri (`bars`: dataKey, name, color, tooltipLabel); tooltip dibangun dari seri
 * yang sama. Tanpa satu pun nilai > 0 = EmptyState, bukan chart kosong.
 */
export default function CohortTrendChart({
  cohorts = [],
  bars,
  isLoading,
  error,
  note,
  emptyTitle = 'Tidak Ada Data Angkatan',
  emptyDescription,
  emptyIcon = BarChart3,
}) {
  const hasData = cohorts.some((row) => bars.some((bar) => Number(row?.[bar.dataKey]) > 0));
  if (!isLoading && !error && !hasData) {
    return (
      <div className="h-56 sm:h-64 md:h-72 w-full flex items-center justify-center">
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col pt-0.5 px-1">
      <div className="h-56 sm:h-64 md:h-72 w-full">
        <TrendBarChart
          data={cohorts}
          xDataKey="cohortLabel"
          isLoading={isLoading}
          error={error}
          compactZeroBars
          bars={bars.map(({ dataKey, name, color }) => ({
            dataKey,
            name,
            color,
            labelKey: dataKey,
          }))}
          tooltipContent={
            <TrendChartTooltip
              titleKey="cohortLabel"
              rows={bars.map(({ dataKey, tooltipLabel, name, color }) => ({
                key: dataKey,
                label: tooltipLabel || name,
                color,
              }))}
            />
          }
        />
      </div>
      {note && <p className="text-[10px] text-gray-500 text-center">{note}</p>}
    </div>
  );
}
