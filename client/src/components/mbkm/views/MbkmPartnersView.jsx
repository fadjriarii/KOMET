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

export const MbkmPartnersView = ({
  mitraData,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Mitra Industri, Riset Hayati, & Universitas Global
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            Kerja sama resmi penyediaan tempat magang industri farmasi/bioteknologi, lab riset hayati, dan pertukaran pelajar.
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Memastikan konversi penuh hingga 20 SKS rekognisi kurikulum i3L.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">Mitra Aktif</div>
          <div className="font-metric-display text-2xl font-extrabold text-purple-700">
            {mitraData.length} Instansi
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-bold border border-purple-200">
            Terverifikasi
          </span>
        </div>
      </div>

      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
          Distribusi Penempatan Peserta MBKM per Mitra
        </h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={mitraData.slice(0, 10)} margin={{ top: 5, right: 30, left: 190, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={185} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#006192" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
