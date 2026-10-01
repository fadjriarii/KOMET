import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
} from 'recharts';
import { DIGITAL_BLUE, CHART_PALETTE } from '../../../../utils/theme';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import Skeleton from '../../../../components/common/feedback/Skeleton';
import {
  formatCompactNumber,
  getDistributionChartHeight,
  getTooltipPayloadItem,
} from '../../../../utils/uiHelpers';

function CustomGraduateChartTooltip({ active, payload, countUnit = 'lulusan' }) {
  if (!active || !payload || !payload.length) return null;
  const data = getTooltipPayloadItem(payload);
  if (!data) return null;

  const percentageText = data.percentageFormatted || (data.percentage != null ? `${data.percentage}` : (data.gpaValue ? `IPK ${data.gpaValue}` : '-'));

  return (
    <div className="bg-white/95 backdrop-blur-md border border-digital-blue-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[160px] z-50">
      <p className="font-bold text-gray-900 mb-1.5 leading-tight">{data.name || data.range || data.tahun}</p>
      <div className="flex items-center justify-between gap-3 text-gray-600 mb-1">
        <span>Jumlah:</span>
        <span className="font-bold text-gray-900">{data.formattedCount || data.count} {countUnit}</span>
      </div>
      {data.gpaValue !== undefined && (
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 text-digital-blue-700 font-semibold">
          <span>Rata-rata IPK:</span>
          <span className="bg-digital-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
            {data.gpaValue}
          </span>
        </div>
      )}
      {data.percentage && (
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 text-digital-blue-700 font-semibold">
          <span>Persentase:</span>
          <span className="bg-digital-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
            {percentageText}
          </span>
        </div>
      )}
    </div>
  );
}

export default function GraduateDistributionChart({
  items = [],
  dataKey = 'count',
  nameKey = 'name',
  labelKey = 'percentageFormatted',
  isLoading = false,
  error = null,
  emptyTitle = 'Tidak Ada Data',
  emptyDescription = 'Belum ada data distribusi lulusan dari backend.',
  emptyIcon,
  yAxisWidth = 180,
  barColor = DIGITAL_BLUE[600],
  useMultiColor = false,
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-36 sm:w-44 shrink-0 rounded" />
            <Skeleton className="h-6 flex-1 rounded-lg" />
            <Skeleton className="h-5 w-12 shrink-0 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Gagal Memuat Data"
        description={error}
        icon={emptyIcon}
      />
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  const dynamicHeight = getDistributionChartHeight(items.length);

  return (
    <div className="w-full">
      <div style={{ height: `${dynamicHeight}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={items}
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
              content={<CustomGraduateChartTooltip />}
              cursor={{ fill: 'rgba(219, 234, 254, 0.25)', radius: 6 }}
            />
            <Bar
              dataKey={dataKey}
              radius={[0, 6, 6, 0]}
              maxBarSize={22}
              animationDuration={800}
            >
              {items.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={useMultiColor ? CHART_PALETTE[idx % CHART_PALETTE.length] : barColor}
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                />
              ))}
              {labelKey && (
                <LabelList
                  dataKey={labelKey}
                  position="right"
                  style={{ fill: DIGITAL_BLUE[700], fontSize: 11, fontWeight: 700 }}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
