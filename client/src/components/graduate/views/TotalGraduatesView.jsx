import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = {
  primary: '#006192',
  predikatColors: {
    'Cum Laude': '#006192',         // Primary blue
    'Sangat Memuaskan': '#10b981',  // Green
    'Memuaskan': '#d97706',          // Amber
    'Cukup': '#6b7280',              // Gray
  },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const name = label || item.name;
  const value = item.value;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-on-surface">{name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
        Nilai: <span className="font-bold text-primary">{value}</span>
      </p>
      {item.payload?.count !== undefined && (
        <p className="text-[11px] text-on-surface-variant mt-0.5">
          Jumlah: {item.payload.count} lulusan
        </p>
      )}
    </div>
  );
};

export const TotalGraduatesView = ({
  totalCount,
  yearTrendData,
  predikatData,
}) => {
  // Tambahkan warna ke predikat data
  const predikatWithColors = predikatData.map((p) => ({
    ...p,
    color: COLORS.predikatColors[p.name] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Definisi & Ruang Lingkup
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            Akumulasi seluruh mahasiswa yang telah menyelesaikan studi dan diyudisium di PDDIKTI.
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Data mencakup lulusan jenjang Sarjana (S1) dan Magister (S2) terverifikasi.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">Total Lulusan</div>
          <div className="font-metric-display text-2xl font-extrabold text-primary">
            {totalCount.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">+5.8% YoY</div>
        </div>
      </div>

      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          Tren Akumulasi Lulusan per Tahun Kelulusan
        </h4>
        <p className="text-xs text-on-surface-variant mb-4">
          Perkembangan jumlah lulusan yang diwisuda pada setiap tahun akademik
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                name="Jumlah Lulusan"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ r: 5, fill: COLORS.primary }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
          Distribusi Predikat Kelulusan Mahasiswa
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={predikatData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                  paddingAngle={4}
                >
                  {predikatWithColors.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {predikatWithColors.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-surface-container-high text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-medium text-on-surface">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-on-surface">{p.count} orang</span>
                  <span className="text-outline">{p.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
