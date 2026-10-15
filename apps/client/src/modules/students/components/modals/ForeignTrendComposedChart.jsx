import EmptyState from '../../../../components/common/feedback/EmptyState';
import ChartLoadingSkeleton from '../../../../components/common/feedback/ChartLoadingSkeleton';
import { formatCompactNumber } from '@komet/shared/formatters';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { ForeignChartSeries, ForeignChartTooltipContent } from './ForeignChartParts';
import { BarChart3 } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ForeignTrendComposedChart({ data = [], isLoading, error }) {
  if (isLoading) return <ChartLoadingSkeleton />;
  if (!data.length)
    return (
      <EmptyState
        title="Tidak Ada Data Tren"
        description={error || 'Belum ada data tren historis mahasiswa asing dari backend.'}
        icon={BarChart3}
      />
    );

  return (
    <div className="h-48 sm:h-56 md:h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 4, bottom: 52 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="academicYear"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            angle={-38}
            textAnchor="end"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            dy={6}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, 'auto']}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={formatCompactNumber}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: DIGITAL_BLUE[600] }}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            content={<ForeignChartTooltipContent />}
            cursor={{ fill: 'rgba(219,234,254,0.3)' }}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="square"
            wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '50px' }}
          />
          <ForeignChartSeries />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
