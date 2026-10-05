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
import { DIGITAL_BLUE } from '../../../utils/theme';
import { formatCompactNumber } from '../../../utils/uiHelpers';

/** Configurable shared bar chart for dashboard trend visualizations. */
export default function TrendBarChart({
  data = [],
  xDataKey = 'tahun',
  bars = [{ dataKey: 'count', name: 'Jumlah', color: DIGITAL_BLUE[600] }],
  height = '100%',
  xAngle = -25,
  tooltipContent,
  legendHeight = 36,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 12, right: 24, left: 4, bottom: 44 }}>
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
          height={legendHeight}
          iconType="square"
          wrapperStyle={{ fontSize: '11px', color: '#6b7280', paddingBottom: '20px' }}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.color || DIGITAL_BLUE[600]}
            radius={[4, 4, 0, 0]}
            maxBarSize={bar.maxBarSize || 44}
            animationDuration={800}
          >
            {bar.labelKey && (
              <LabelList
                dataKey={bar.labelKey}
                formatter={bar.labelFormatter}
                position="top"
                style={{ fill: DIGITAL_BLUE[800], fontSize: 10, fontWeight: 700 }}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
