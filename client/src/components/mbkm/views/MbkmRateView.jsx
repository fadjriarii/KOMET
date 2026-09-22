import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const name = label || item.name;
  const value = item.value;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-on-surface">{name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums mt-0.5">
        Jumlah: <span className="font-bold text-primary">{value}</span> kegiatan
      </p>
      {item.payload?.percentage && (
        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
          Proporsi: {item.payload.percentage}
        </p>
      )}
    </div>
  );
};

export const MbkmRateView = ({
  participantStats,
  eligibleCount,
  eligibleRate,
  facultyData,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Formula & Definisi KPI MBKM
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            %MBKM = (MBKM / Eligible) × 100%
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            MBKM = Status Aktif, Jenis Aktivitas terisi, Status Selesai/Evaluasi ({participantStats.count} mhs).
            Eligible = Total mahasiswa aktif semester 7 ({eligibleCount} mhs).
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">Capaian Rasio</div>
          <div className="font-metric-display text-2xl font-extrabold text-primary">
            {eligibleRate.percentage}
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
              eligibleRate.numPercentage >= 20
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {eligibleRate.badge}
          </span>
        </div>
      </div>

      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
          Distribusi Kegiatan MBKM per Fakultas
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={facultyData} margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
