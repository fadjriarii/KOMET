import EmptyState from '../../../../components/common/feedback/EmptyState';
import ChartLoadingSkeleton from '../../../../components/common/feedback/ChartLoadingSkeleton';
import { formatCompactNumber, formatPercentage } from '@komet/shared/formatters';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import TrendChartTooltip from '../../../../components/common/charts/TrendChartTooltip';
import { BarChart3 } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
            content={
              <TrendChartTooltip
                titleKey="academicYear"
                rows={[
                  {
                    key: 'totalCount',
                    label: 'Total Mahasiswa',
                    colorClass: 'bg-digital-blue-300 opacity-75',
                  },
                  {
                    key: 'foreignCount',
                    label: 'Mahasiswa Asing',
                    colorClass: 'bg-digital-blue-700',
                    indicatorClassName: 'w-3 h-1.5 rounded-full',
                  },
                ]}
                footer={{
                  key: 'percentage',
                  label: 'Persentase (Rasio)',
                  format: formatPercentage,
                }}
              />
            }
            cursor={{ fill: 'rgba(219,234,254,0.3)' }}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="square"
            wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '50px' }}
          />
          <Bar
            yAxisId="left"
            dataKey="totalCount"
            name="Total Mahasiswa (Orang)"
            fill={DIGITAL_BLUE[300]}
            opacity={0.75}
            radius={[4, 4, 0, 0]}
            maxBarSize={38}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="percentage"
            name="Rasio Mhs Asing (%)"
            stroke={DIGITAL_BLUE[600]}
            strokeWidth={2.4}
            dot={{ r: 4, fill: 'white', stroke: DIGITAL_BLUE[600], strokeWidth: 2 }}
            activeDot={{ r: 6, fill: DIGITAL_BLUE[600], stroke: 'white', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
