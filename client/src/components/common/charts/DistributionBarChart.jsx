import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_PALETTE, DIGITAL_BLUE } from '../../../utils/theme';
import EmptyState from '../feedback/EmptyState';
import Skeleton from '../feedback/Skeleton';
import { formatCompactNumber, formatPercentage, getDistributionChartHeight } from '../../../utils/uiHelpers';

/** Shared horizontal distribution chart; modules provide only their data contract and tooltip. */
export default function DistributionBarChart({
  items = [], dataKey = 'count', nameKey = 'name', labelKey = 'percentage',
  isLoading = false, error = null, emptyTitle = 'Tidak Ada Data', emptyDescription,
  emptyIcon, yAxisWidth = 180, barColor = DIGITAL_BLUE[600], useMultiColor = false,
  tooltipContent, labelFormatter,
}) {
  const chartItems = Array.isArray(items) ? items : [];
  if (isLoading) {
    return <div className="space-y-3 py-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-3"><Skeleton className="h-5 w-36 sm:w-44 shrink-0 rounded" /><Skeleton className="h-6 flex-1 rounded-lg" /><Skeleton className="h-5 w-12 shrink-0 rounded" /></div>)}</div>;
  }
  if (error) return <EmptyState title="Gagal Memuat Data" description={error} icon={emptyIcon} />;
  if (!chartItems.length) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;

  return (
    <div className="w-full">
      <div style={{ height: `${getDistributionChartHeight(chartItems.length)}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartItems} margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={formatCompactNumber} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
            <YAxis type="category" dataKey={nameKey} width={yAxisWidth} tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} tickLine={false} axisLine={false} />
            <Tooltip content={tooltipContent} cursor={{ fill: 'rgba(219, 234, 254, 0.25)', radius: 6 }} />
            <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={800}>
              {chartItems.map((_, index) => <Cell key={`cell-${index}`} fill={useMultiColor ? CHART_PALETTE[index % CHART_PALETTE.length] : barColor} className="hover:opacity-90 transition-opacity cursor-pointer" />)}
              {labelKey && <LabelList dataKey={labelKey} formatter={labelFormatter || (labelKey === 'percentage' ? (value) => formatPercentage(value) : undefined)} position="right" style={{ fill: DIGITAL_BLUE[700], fontSize: 11, fontWeight: 700 }} />}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
