import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const ForeignTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[210px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">{dataPoint.cohortLabel || `Cohort ${label}`}</p>
        <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {dataPoint.percentageFormatted || `${dataPoint.percentage}%`}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            WNA Aktif:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.foreignActive?.toLocaleString('en-US')} mhs
          </span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Total Mahasiswa Aktif:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.totalActive?.toLocaleString('en-US')} mhs
          </span>
        </div>
      </div>
    </div>
  );
};

export const ForeignStudentsView = ({
  foreignTrendData,
  sortedForeignTableData,
}) => {
  const latestData = foreignTrendData.length > 0 ? foreignTrendData[foreignTrendData.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Ringkasan Banner Mahasiswa Asing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Definisi & Ruang Lingkup
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            Persentase mahasiswa berkewarganegaraan Asing (Non-WNI) terhadap total mahasiswa aktif pada tiap periode.
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Formula: (Jumlah Mahasiswa Asing / Total Mahasiswa) × 100%
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">
            Persentase Angkatan Terkini
          </div>
          <div className="font-metric-display text-2xl font-extrabold text-secondary">
            {latestData ? latestData.percentageFormatted : '0.0%'}
          </div>
          {latestData && latestData.deltaFormatted !== '-' && (
            <div
              className={`text-xs font-semibold mt-0.5 ${
                latestData.deltaPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {latestData.deltaFormatted}
            </div>
          )}
        </div>
      </div>

      {/* Chart Utama: Tren 5 Tahun Persentase Mahasiswa Asing */}
      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              Tren 5 Tahun: Persentase Mahasiswa Asing
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Perkembangan jumlah dan persentase mahasiswa internasional aktif antar angkatan 5 tahun terakhir
            </p>
          </div>
          <div className="inline-flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
            <span className="flex items-center gap-1.5 font-medium text-on-surface">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-600"></span> Persentase Asing (%)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-on-surface">
              <span className="w-3 h-3 rounded bg-primary/20 border border-primary"></span> Total Mahasiswa
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={foreignTrendData}
              margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
            >
              <defs>
                <linearGradient id="foreignRatioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey="cohortLabel"
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={false}
                tickLine={false}
                unit="%"
                allowDecimals={true}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#6f7882' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip content={<ForeignTrendTooltip />} />
              <Bar
                yAxisId="right"
                dataKey="foreignActive"
                name="WNA Aktif"
                fill="#006192"
                opacity={0.25}
                radius={[4, 4, 0, 0]}
                barSize={36}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="percentage"
                name="Persentase Asing (%)"
                stroke="#d97706"
                strokeWidth={3}
                fill="url(#foreignRatioGradient)"
                dot={{ r: 4.5, fill: '#d97706', strokeWidth: 0 }}
                activeDot={{ r: 6.5, fill: '#d97706', stroke: '#fef3c7', strokeWidth: 2 }}
                isAnimationActive
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rincian Tabel Angkatan (Newest to Oldest) */}
      <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
          <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Tabel Rekapitulasi Mahasiswa Asing (5 Tahun Terakhir)
          </h5>
          <span className="text-[11px] text-outline font-medium">PDDikti Verified</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Angkatan / Periode</th>
              <th className="py-2.5 px-4 text-right">Jumlah Mahasiswa Asing</th>
              <th className="py-2.5 px-4 text-right">Total Seluruh Mahasiswa</th>
              <th className="py-2.5 px-4 text-right">Persentase (%)</th>
              <th className="py-2.5 px-4 text-right">Pertumbuhan dari Periode Lalu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
            {sortedForeignTableData.map((row, idx) => {
              const isLatest = idx === 0;
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
                        Terkini
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-on-surface tabular-nums">
                    {row.foreignActive.toLocaleString('en-US')} Mhs
                  </td>
                  <td className="py-2.5 px-4 text-right text-on-surface tabular-nums">
                    {row.totalActive.toLocaleString('en-US')} Mhs
                  </td>
                  <td className="py-2.5 px-4 text-right text-amber-700 font-bold tabular-nums">
                    {row.percentageFormatted}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-semibold tabular-nums ${
                      row.deltaPercentage === null
                        ? 'text-outline'
                        : row.deltaPercentage >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {row.deltaFormatted}
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
