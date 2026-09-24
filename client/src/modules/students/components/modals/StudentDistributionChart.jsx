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
import { DIGITAL_BLUE } from '../../../../utils/theme';
import EmptyState from '../../../../components/common/feedback/EmptyState';
import Skeleton from '../../../../components/common/feedback/Skeleton';

/**
 * Custom Tooltip untuk Recharts Distribusi Mahasiswa
 */
function CustomChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md border border-digital-blue-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs min-w-[160px] z-50">
      <p className="font-bold text-gray-900 mb-1.5 leading-tight">{data.name}</p>
      <div className="flex items-center justify-between gap-3 text-gray-600 mb-1">
        <span>Jumlah Mahasiswa:</span>
        <span className="font-bold text-gray-900">{data.formattedCount || data.count} mhs</span>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 text-digital-blue-700 font-semibold">
        <span>Kontribusi:</span>
        <span className="bg-digital-blue-50 px-1.5 py-0.5 rounded text-[11px] font-bold">
          {data.percentageFormatted || `${data.percentage}%`}
        </span>
      </div>
    </div>
  );
}

/**
 * StudentDistributionChart - Visualisasi Horizontal BarChart menggunakan Recharts
 */
export default function StudentDistributionChart({
  items = [],
  isLoading = false,
  error = null,
  emptyTitle = 'Tidak Ada Data',
  emptyDescription = 'Belum ada data distribusi mahasiswa dari backend.',
  emptyIcon,
  yAxisWidth = 180,
  barColor = DIGITAL_BLUE[600],
  barHoverColor = DIGITAL_BLUE[700],
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

  // Hitung tinggi container secara dinamis agar setiap bar memiliki ruang yang ideal
  const dynamicHeight = Math.max(240, items.length * 38);

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
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v)}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            
            <Tooltip
              content={<CustomChartTooltip />}
              cursor={{ fill: 'rgba(219, 234, 254, 0.25)', radius: 6 }}
            />
            
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              maxBarSize={22}
              animationDuration={800}
            >
              {items.map((_, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={barColor}
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                />
              ))}
              <LabelList
                dataKey="percentageFormatted"
                position="right"
                style={{ fill: DIGITAL_BLUE[700], fontSize: 11, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
