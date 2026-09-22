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

export const MbkmEligibleStudentsView = ({
  eligibleCount,
  prodiData,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Kriteria Mahasiswa Eligible (Semester 7)
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            Mahasiswa aktif jenjang Sarjana yang berada di semester 7 pada periode berjalan.
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Memenuhi syarat mengambil program Merdeka Belajar Kampus Merdeka 20 SKS di luar program studi.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">Total Eligible</div>
          <div className="font-metric-display text-2xl font-extrabold text-amber-700">
            {eligibleCount} Mhs
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
            Semester 7 Aktif
          </span>
        </div>
      </div>

      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
          Sebaran Mahasiswa Eligible per Program Studi
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={prodiData} margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
