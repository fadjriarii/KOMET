import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Tooltip kustom grafik tren kelulusan dengan angka tabular-nums.
 */
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-control border border-[#E2E8F0] bg-white px-3 py-2 shadow-level-3">
      <p className="text-xs font-semibold text-on-surface">Academic Year {label}</p>
      <p className="tabular-nums text-xs text-on-surface-variant">
        Graduates: <span className="font-bold text-primary">{payload[0].value}</span>
      </p>
    </div>
  );
};

/**
 * Visualisasi tren jumlah lulusan per tahun akademik.
 * Menggunakan AreaChart Recharts dengan isian gradien halus dan diberi judul
 * serta label "Graduate Trends Line Chart" sesuai spesifikasi desain.
 *
 * @param {Object} props
 * @param {Array<{year: string|number, graduates: number}>} props.data - Data deret kelulusan
 */
export const GraduateLineChart = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Graduate Trends Line Chart</CardTitle>
        </div>
        <CardDescription>
          Longitudinal trend of graduates per academic year, tracked longitudinally across
          available reporting periods.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                {/* Gradien area lembut berbasis warna primary institusi */}
                <linearGradient id="gradLineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006192" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#006192" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={false}
                tickLine={false}
                width={40}
                allowDecimals={false}
              />
              <Tooltip content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="graduates"
                stroke="#006192"
                strokeWidth={2.5}
                fill="url(#gradLineFill)"
                dot={{ r: 3.5, fill: '#006192', strokeWidth: 0 }}
                activeDot={{ r: 5.5, fill: '#006192', stroke: '#cce5ff', strokeWidth: 2 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraduateLineChart;
