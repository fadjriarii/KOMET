import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const COLORS = {
  primary: '#006192',    // Primary blue for main bars
  accent: '#d97706',     // Amber/yellow for highlights
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

export const GpaOverviewView = ({
  s1Gpa,
  s2Gpa,
  prodiGpaData,
  facultyGpaData,
  gpaBandsData,
}) => {
  const [activeGpaTab, setActiveGpaTab] = useState('prodi');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Rata-rata IPK Sarjana (S1)
            </span>
            <div className="font-metric-display text-2xl font-extrabold text-primary mt-1">
              {s1Gpa.average}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Dihitung dari {s1Gpa.count} lulusan sarjana
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary">
            S1
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Rata-rata IPK Magister (S2)
            </span>
            <div className="font-metric-display text-2xl font-extrabold text-secondary mt-1">
              {s2Gpa.average}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Dihitung dari {s2Gpa.count} lulusan magister
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
            S2
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-surface-container-high">
        <button
          onClick={() => setActiveGpaTab('prodi')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeGpaTab === 'prodi'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          IPK Per Program Studi
          {activeGpaTab === 'prodi' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveGpaTab('faculty')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeGpaTab === 'faculty'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          IPK Per Fakultas
          {activeGpaTab === 'faculty' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveGpaTab('bands')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeGpaTab === 'bands'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Distribusi Rentang IPK
          {activeGpaTab === 'bands' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {activeGpaTab === 'prodi' && (
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
          <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
            Rata-rata IPK per Program Studi
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={prodiGpaData}
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={130} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="gpaValue" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeGpaTab === 'faculty' && (
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
          <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
            Rata-rata IPK per Fakultas
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={facultyGpaData}
                margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="gpaValue" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeGpaTab === 'bands' && (
        <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
          <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-3">
            Distribusi Lulusan Berdasarkan Rentang IPK
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gpaBandsData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Jumlah Lulusan" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
