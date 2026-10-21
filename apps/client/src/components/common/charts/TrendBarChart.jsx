import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { DIGITAL_BLUE } from '../../../utils/theme';
import { formatCompactNumber } from '@komet/shared/formatters';
import Skeleton from '../feedback/Skeleton';
import EmptyState from '../feedback/EmptyState';
import { humanizeErrorMessage } from '../../../modules/errors/errorStates';
import { compactBarLayout } from './compactBarLayout';

function CompactBarShape({
  x,
  y,
  width,
  height,
  payload,
  dataKey,
  labelKey,
  labelFormatter,
  color,
  bars,
}) {
  const layout = compactBarLayout({ bars, payload, dataKey, x, width });
  if (!layout || !(height > 0)) return null;

  const label = payload[labelKey ?? dataKey];
  return (
    <g>
      <rect x={layout.x} y={y} width={layout.width} height={height} rx={4} fill={color} />
      <text
        x={layout.x + layout.width / 2}
        y={y - 4}
        textAnchor="middle"
        style={{ fill: DIGITAL_BLUE[800], fontSize: 10, fontWeight: 700 }}
      >
        {labelFormatter ? labelFormatter(label) : label}
      </text>
    </g>
  );
}

/** Configurable shared bar chart for dashboard trend visualizations. */
export default function TrendBarChart({
  data = [],
  xDataKey = 'tahun',
  bars = [{ dataKey: 'count', name: 'Jumlah', color: DIGITAL_BLUE[600] }],
  height = '100%',
  xAngle = -25,
  tooltipContent,
  legendHeight = 36,
  barGap = 4,
  compactZeroBars = false,
  isLoading = false,
  error = null,
}) {
  // Kegagalan fetch harus tampil sebagai kegagalan, bukan chart kosong yang
  // membaca sebagai "nol data".
  if (isLoading)
    return (
      <div className="h-full flex items-end gap-4 px-6 pb-10">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-3/4 flex-1 rounded-t-lg" />
        ))}
      </div>
    );
  if (error)
    return (
      <EmptyState
        title="Gagal Memuat Data"
        description={humanizeErrorMessage(error)}
        icon={AlertCircle}
      />
    );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        barGap={compactZeroBars ? 0 : barGap}
        margin={{ top: 12, right: 24, left: 4, bottom: 44 }}
      >
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
            radius={bar.stackId ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            maxBarSize={bar.maxBarSize || 44}
            animationDuration={800}
            shape={
              compactZeroBars && !bar.stackId
                ? (props) => (
                    <CompactBarShape
                      {...props}
                      bars={bars}
                      dataKey={bar.dataKey}
                      labelKey={bar.labelKey || bar.dataKey}
                      labelFormatter={bar.labelFormatter}
                      color={bar.color || DIGITAL_BLUE[600]}
                    />
                  )
                : bar.shape
            }
            {...(bar.stackId ? { stackId: bar.stackId } : null)}
          >
            {bar.stackId
              ? data.map((entry, index) => {
                  // Segmen teratas tiap baris (nilai > 0 terakhir dalam tumpukan
                  // yang sama) menjaga sudut rounded luar; sambungan antar
                  // warna tetap menyatu tanpa radius.
                  const topKey = [...bars]
                    .reverse()
                    .find(
                      (stacked) =>
                        stacked.stackId === bar.stackId && Number(entry?.[stacked.dataKey]) > 0,
                    )?.dataKey;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      radius={bar.dataKey === topKey ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  );
                })
              : null}
            {bar.labelKey && !compactZeroBars && (
              <LabelList
                dataKey={bar.labelKey}
                formatter={bar.labelFormatter}
                position={bar.labelPosition || 'top'}
                style={{ fill: DIGITAL_BLUE[800], fontSize: 10, fontWeight: 700 }}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
