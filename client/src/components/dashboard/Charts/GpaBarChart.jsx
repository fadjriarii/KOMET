import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatGpa } from '@/utils/formatGpa';

/** Warna seri grafik: primary institusi + varian cyan untuk sorotan tertinggi. */
const BAR_COLOR = '#006192';
const BAR_COLOR_HIGHLIGHT = '#0090D6';

/**
 * Tooltip kustom untuk bar chart IPK.
 * Memastikan angka IPK diformat dua desimal dengan fitur tabular-nums.
 */
const GpaTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  return (
    <div className="rounded-control border border-[#E2E8F0] bg-white px-3 py-2 shadow-level-3">
      <p className="text-xs font-semibold text-on-surface">{entry.payload.program}</p>
      <p className="tabular-nums text-xs text-on-surface-variant">
        Average GPA: <span className="font-bold text-primary">{formatGpa(entry.value)}</span>
      </p>
      <p className="tabular-nums text-[11px] text-outline">
        {entry.payload.count} graduates
      </p>
    </div>
  );
};

/**
 * Visualisasi rata-rata IPK per program studi (bar chart horizontal).
 * Data dikelompokkan oleh utilitas groupGpaByProgramStudi; sumbu Y memakai
 * nama program, sumbu X rentang IPK 2.5–4.0 agar perbedaan antar prodi terbaca.
 *
 * @param {Object} props
 * @param {Array<GpaPerProgram>} props.data - Hasil groupGpaByProgramStudi
 */
export const GpaBarChart = ({ data }) => {
  // Program studi dengan IPK tertinggi disorot dengan warna cyan terang.
  const topProgram = useMemo(
    () => (data.length > 0 ? data[0].program : null),
    [data],
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Average GPA per Study Program</CardTitle>
        </div>
        <CardDescription>
          Mean cumulative GPA grouped by study program, computed live from the
          graduate registry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: Math.max(data.length * 36, 200) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
            >
              <CartesianGrid horizontal={false} stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[2.5, 4]}
                ticks={[2.5, 3.0, 3.5, 4.0]}
                tick={{ fontSize: 11, fill: '#6f7882' }}
                tickFormatter={(v) => v.toFixed(1)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="program"
                width={200}
                tick={{ fontSize: 11, fill: '#3f4850' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <Tooltip content={<GpaTooltip />} cursor={{ fill: 'rgba(0, 97, 146, 0.06)' }} />
              <Bar dataKey="gpaValue" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive>
                {data.map((entry) => (
                  <Cell
                    key={entry.program}
                    fill={entry.program === topProgram ? BAR_COLOR_HIGHLIGHT : BAR_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
