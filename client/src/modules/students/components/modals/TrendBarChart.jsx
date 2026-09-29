import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { DIGITAL_BLUE } from '../../../../utils/theme';
import { formatCompactNumber } from '../../../../utils/uiHelpers';

/** Recharts BarChart reusable untuk tren data mahasiswa. */
export default function TrendBarChart({
  data = [],
  xDataKey = 'tahun',
  barDataKey = 'intakeCount',
  labelDataKey = 'intakeCountFormatted',
  legendLabel = 'Jumlah',
  barColor = DIGITAL_BLUE[600],
  height = '100%',
  xAngle = -25,
  tooltipContent,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 24, left: 4, bottom: 44 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey={xDataKey}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          angle={xAngle}
          textAnchor="end"
          interval={0}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          dy={6}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          tickFormatter={formatCompactNumber}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        {tooltipContent && (
          <Tooltip content={tooltipContent} cursor={{ fill: 'rgba(219,234,254,0.3)' }} />
        )}
        <Legend
          verticalAlign="top"
          height={32}
          formatter={() => legendLabel}
          iconType="square"
          wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '50px' }}
        />
        <Bar
          dataKey={barDataKey}
          name={barDataKey}
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          animationDuration={800}
        >
          {labelDataKey && (
            <LabelList
              dataKey={labelDataKey}
              position="top"
              style={{ fill: DIGITAL_BLUE[800], fontSize: 10, fontWeight: 700 }}
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
