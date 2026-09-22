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

const IntakeTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const isNeg = dataPoint.growthNum !== null && dataPoint.growthNum < 0;
  const isPos = dataPoint.growthNum !== null && dataPoint.growthNum >= 0;

  return (
    <div className="rounded-xl border border-surface-container-high bg-white p-3.5 shadow-xl min-w-[240px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-2 mb-2">
        <p className="text-xs font-bold text-on-surface">{dataPoint.cohortLabel || `Angkatan ${label}`}</p>
        {dataPoint.growth && dataPoint.growth !== '-' && (
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
              isNeg
                ? 'text-red-700 bg-red-50 border-red-200'
                : isPos
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-outline bg-slate-50 border-slate-200'
            }`}
          >
            {dataPoint.growth}
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006192]"></span>
            Semester Ganjil:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.ganjil?.toLocaleString('en-US')} mhs <span className="text-[11px] font-medium text-on-surface-variant">({dataPoint.ganjilPct})</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A389]"></span>
            Semester Genap:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.genap?.toLocaleString('en-US')} mhs <span className="text-[11px] font-medium text-on-surface-variant">({dataPoint.genapPct})</span>
          </span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-surface-container-high/60 font-bold">
          <span className="text-on-surface">Total Mahasiswa Baru:</span>
          <span className="text-primary tabular-nums">
            {dataPoint.intake?.toLocaleString('en-US')} Mahasiswa
          </span>
        </div>
      </div>
    </div>
  );
};

export const IntakeTrendView = ({
  intakeTrendData,
  sortedIntakeTableData,
}) => {
  const latest = intakeTrendData.length > 0 ? intakeTrendData[intakeTrendData.length - 1] : null;
  const isNeg = latest && latest.growthNum !== null && latest.growthNum < 0;
  const isPos = latest && latest.growthNum !== null && latest.growthNum >= 0;

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards: Intake Terkini, Semester Ganjil, Semester Genap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Intake Angkatan Terkini */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Intake {latest ? latest.cohortLabel : 'Terkini'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="font-metric-display text-2xl font-extrabold text-primary">
              {latest ? `${latest.intake.toLocaleString('en-US')} Mhs` : '0 Mhs'}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {latest && (
                <span
                  className={`text-xs font-semibold ${
                    isNeg ? 'text-red-600' : isPos ? 'text-emerald-600' : 'text-outline'
                  }`}
                >
                  {latest.growth}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Semester Ganjil */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Semester Ganjil ({latest ? latest.cohortLabel : 'Terkini'})
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#006192]/10 flex items-center justify-center text-[#006192]">
              <span className="material-symbols-outlined text-[16px]">login</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="font-metric-display text-2xl font-extrabold text-[#006192]">
              {latest ? `${latest.ganjil.toLocaleString('en-US')} Mhs` : '0 Mhs'}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Proporsi: <span className="font-bold text-on-surface">{latest ? latest.ganjilPct : '0%'}</span> dari intake tahun ini
            </p>
          </div>
        </div>

        {/* Card 3: Semester Genap */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
              Semester Genap ({latest ? latest.cohortLabel : 'Terkini'})
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#00A389]/10 flex items-center justify-center text-[#00A389]">
              <span className="material-symbols-outlined text-[16px]">sensor_door</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="font-metric-display text-2xl font-extrabold text-[#00A389]">
              {latest ? `${latest.genap.toLocaleString('en-US')} Mhs` : '0 Mhs'}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Proporsi: <span className="font-bold text-on-surface">{latest ? latest.genapPct : '0%'}</span> dari intake tahun ini
            </p>
          </div>
        </div>
      </div>

      {/* Chart Utama: Distribusi Mahasiswa Baru per Semester (Stacked Bar Chart) */}
      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              Distribusi Intake Mahasiswa Baru per Semester (5 Tahun Terakhir)
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Perbandingan jumlah mahasiswa baru yang terdaftar di Semester Ganjil vs Semester Genap
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded-lg border border-surface-container-high shadow-xs">
              <span className="w-3 h-3 rounded bg-[#006192]"></span>
              <span className="font-medium text-on-surface">Semester Ganjil</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded-lg border border-surface-container-high shadow-xs">
              <span className="w-3 h-3 rounded bg-[#00A389]"></span>
              <span className="font-medium text-on-surface">Semester Genap</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={intakeTrendData}
              margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
            >
              <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey="cohortLabel"
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip content={<IntakeTrendTooltip />} />
              <Bar
                dataKey="ganjil"
                name="Semester Ganjil"
                stackId="intakeStack"
                fill="#006192"
                radius={[0, 0, 0, 0]}
                barSize={44}
                isAnimationActive
              />
              <Bar
                dataKey="genap"
                name="Semester Genap"
                stackId="intakeStack"
                fill="#d97706"
                radius={[6, 6, 0, 0]}
                barSize={44}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rincian Tabel Angkatan (Newest to Oldest) */}
      <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
          <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Tabel Rekapitulasi Intake Mahasiswa Baru per Semester
          </h5>
          <span className="text-[11px] text-outline font-medium">PDDikti & Sevima Verified</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Angkatan / Cohort</th>
              <th className="py-2.5 px-4 text-center">Semester Ganjil</th>
              <th className="py-2.5 px-4 text-center">Semester Genap</th>
              <th className="py-2.5 px-4 text-right">Total Intake</th>
              <th className="py-2.5 px-4 text-right">Pertumbuhan YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
            {sortedIntakeTableData.map((row, idx) => {
              const isLatest = idx === 0;
              const isItemNeg = row.growthNum !== null && row.growthNum < 0;
              const isItemPos = row.growthNum !== null && row.growthNum >= 0;

              return (
                <tr
                  key={row.year}
                  className={`${
                    isLatest ? 'bg-primary-fixed/20 font-bold' : 'hover:bg-surface-container-low/40'
                  } transition-colors`}
                >
                  <td className="py-2.5 px-4 text-on-surface flex items-center gap-2">
                    <span>{row.cohortLabel}</span>
                    {isLatest && (
                      <span className="text-[10px] px-2 py-0.2 bg-primary text-white rounded font-bold">
                        Cohort Terkini
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center text-on-surface tabular-nums">
                    <span className="font-semibold text-[#006192]">{row.ganjil.toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">({row.ganjilPct})</span>
                  </td>
                  <td className="py-2.5 px-4 text-center text-on-surface tabular-nums">
                    <span className="font-semibold text-[#00A389]">{row.genap.toLocaleString('en-US')}</span>
                    <span className="text-[10px] text-on-surface-variant ml-1">({row.genapPct})</span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-primary font-bold tabular-nums">
                    {row.intake.toLocaleString('en-US')} Mahasiswa
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-semibold tabular-nums ${
                      isItemNeg ? 'text-red-600' : isItemPos ? 'text-emerald-600' : 'text-outline'
                    }`}
                  >
                    {row.growth}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
