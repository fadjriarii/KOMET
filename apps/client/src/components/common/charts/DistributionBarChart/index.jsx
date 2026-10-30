import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { getDistributionChartHeight } from '../../../../utils/uiHelpers';
import { formatCompactNumber, formatPercentage } from '@komet/shared/formatters';
import { DistributionStates } from './DistributionStates';
import { DistributionSeries } from './DistributionSeries';
import ChartLegend from '../ChartLegend';
import { roundedStackShape } from '../roundedStackShape';
import { useId } from 'react';
import { useNarrowChart } from '../useNarrowChart';

/** Seri terakhir yang terisi pada satu baris = ujung tumpukan. */
function lastFilledKey(series, row) {
  return series.findLast(({ key }) => row?.byStatus?.[key] > 0)?.key;
}

/**
 * Shared horizontal distribution chart; modules provide only their data contract and tooltip.
 * `series` ([{ key, label, color }]) menumpuk bar per `item.byStatus[key]`; label
 * persentase tetap satu per baris, di ujung tumpukan.
 */
export default function DistributionBarChart({
  items = [],
  dataKey = 'count',
  nameKey = 'name',
  labelKey = 'percentage',
  isLoading = false,
  error = null,
  emptyTitle = 'Tidak Ada Data',
  emptyDescription,
  emptyIcon,
  yAxisWidth = 180,
  barColor = DIGITAL_BLUE[600],
  tooltipContent,
  labelFormatter,
  series,
}) {
  const isNarrow = useNarrowChart();
  const effectiveYAxisWidth = isNarrow ? Math.min(yAxisWidth, 120) : yAxisWidth;
  const idPrefix = `dist${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const stackShape = roundedStackShape({
    keys: (series || []).map((item) => item.key),
    valueOf: (row, key) => row?.byStatus?.[key],
    vertical: false,
    radius: 6,
    idPrefix,
  });
  // Kategori bernilai 0 tidak perlu memakan baris: chart distribusi hanya
  // menampilkan kelompok yang benar-benar punya data.
  const chartItems = (Array.isArray(items) ? items : []).filter(
    (item) => Number(item?.[dataKey]) > 0,
  );
  if (isLoading || error || !chartItems.length) {
    return (
      <DistributionStates
        isLoading={isLoading}
        error={error}
        isEmpty={!chartItems.length}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyIcon={emptyIcon}
      />
    );
  }

  return (
    <div className="w-full">
      {series?.length > 0 && <ChartLegend items={series} shape="circle" />}
      <div
        style={{ height: `${getDistributionChartHeight(chartItems.length)}px` }}
        className="w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartItems}
            margin={{ top: 10, right: isNarrow ? 44 : 60, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={formatCompactNumber}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              type="category"
              dataKey={nameKey}
              width={effectiveYAxisWidth}
              tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={tooltipContent}
              cursor={{ fill: 'rgba(219, 234, 254, 0.25)', radius: 6 }}
            />
            {series?.length ? (
              <>
                {series.map(({ key, label, color }) => (
                  <Bar
                    key={key}
                    name={label}
                    dataKey={(item) => item.byStatus?.[key] ?? 0}
                    stackId="series"
                    fill={color}
                    maxBarSize={22}
                    animationDuration={800}
                    // Ujung tumpukan membulat (radius sama dengan bar tunggal).
                    shape={stackShape(key)}
                  >
                    {labelKey && (
                      <LabelList
                        position="right"
                        style={{ fill: DIGITAL_BLUE[700], fontSize: 11, fontWeight: 700 }}
                        // Satu label per baris, di segmen terisi terakhir (ujung tumpukan).
                        valueAccessor={(entry) => {
                          const row = entry.payload ?? entry;
                          if (lastFilledKey(series, row) !== key) return null;
                          const value = row[labelKey];
                          return labelFormatter
                            ? labelFormatter(value)
                            : labelKey === 'percentage'
                              ? formatPercentage(value)
                              : value;
                        }}
                      />
                    )}
                  </Bar>
                ))}
              </>
            ) : (
              <DistributionSeries
                chartItems={chartItems}
                dataKey={dataKey}
                labelKey={labelKey}
                barColor={barColor}
                labelFormatter={labelFormatter}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
