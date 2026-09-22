import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Standard colors untuk chart MBKM
const STATUS_COLORS = {
  'Selesai': '#10b981',        // Green
  'Evaluasi': '#d97706',       // Amber
  'Berjalan': '#006192',       // Primary blue
  'Tunda': '#6b7280',          // Gray
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

export const MbkmActiveActivitiesView = ({
  activityData,
  prodiData,
  statusData,
}) => {
  const [activeTab, setActiveTab] = useState('activity');

  // Tambahkan warna standar ke statusData
  const statusWithColors = statusData.map((s) => ({
    ...s,
    color: STATUS_COLORS[s.name] || '#6b7280',
  }));

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-surface-container-high">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === 'activity' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Distribusi Jenis Aktivitas MBKM
          {activeTab === 'activity' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('prodi')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === 'prodi' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Sebaran per Program Studi
          {activeTab === 'prodi' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeTab === 'status' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Status Verifikasi & Evaluasi
          {activeTab === 'status' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {activeTab === 'activity' && (
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
          <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
            Sebaran Peserta Berdasarkan 8 Bentuk Kegiatan Pembelajaran (BKP) MBKM
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={activityData} margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={175} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#006192" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'prodi' && (
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
          <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
            Partisipasi MBKM per Program Studi
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={prodiData} margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#006192" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
          <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
            Distribusi Status Aktivitas MBKM
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusWithColors}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={4}
                  >
                    {statusWithColors.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statusWithColors.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white border border-surface-container-high text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-on-surface">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-on-surface">{s.count} mahasiswa</span>
                    <span className="text-outline">{s.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
