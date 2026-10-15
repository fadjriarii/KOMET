import { BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { getDistributionChartHeight } from '../../../../utils/uiHelpers';
import { formatCompactNumber } from '@komet/shared/formatters';
import { DistributionStates } from './DistributionStates';
import { DistributionSeries } from './DistributionSeries';

/** Shared horizontal distribution chart; modules provide only their data contract and tooltip. */
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
  useMultiColor = false,
  tooltipContent,
  labelFormatter,
}) {
  const chartItems = Array.isArray(items) ? items : [];
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
      <div
        style={{ height: `${getDistributionChartHeight(chartItems.length)}px` }}
        className="w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartItems}
            margin={{ top: 10, right: 60, left: 10, bottom: 10 }}
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
              width={yAxisWidth}
              tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={tooltipContent}
              cursor={{ fill: 'rgba(219, 234, 254, 0.25)', radius: 6 }}
            />
            <DistributionSeries
              chartItems={chartItems}
              dataKey={dataKey}
              labelKey={labelKey}
              useMultiColor={useMultiColor}
              barColor={barColor}
              labelFormatter={labelFormatter}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
