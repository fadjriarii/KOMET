import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const FluctuationTrendTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[220px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">Tahun {dataPoint.year}</p>
        <span
          className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
            dataPoint.deltaPercentage !== null && dataPoint.deltaPercentage >= 0
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : dataPoint.deltaPercentage !== null
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-outline bg-slate-50 border-slate-200'
          }`}
        >
          {dataPoint.deltaFormatted}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Total Intake:
          </span>
          <span className="font-bold text-on-surface tabular-nums">
            {dataPoint.absolutCount?.toLocaleString('en-US')} Mahasiswa
          </span>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            Perubahan YoY:
          </span>
          <span className="font-bold text-[#D97706] tabular-nums">
            {dataPoint.deltaFormatted}
          </span>
        </div>
      </div>
    </div>
  );
};

export const IntakeFluctuationView = ({
  fluctuationData,
  sortedFluctuationTableData,
}) => {
  return (
    <div className="space-y-6">
      {/* Ringkasan Banner Fluktuasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
            Definisi & Ringkasan Perubahan (5 Tahun)
          </span>
          <p className="text-xs font-semibold text-on-surface mt-1">
            Rata-rata tingkat perubahan jumlah mahasiswa baru (intake) yang dihitung dari perbandingan 5 tahun terakhir.
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            Menampilkan pertumbuhan tahunan dan rata-rata kumulatif penerimaan mahasiswa baru.
          </p>
        </div>
        <div className="text-right sm:border-l sm:border-surface-container-high sm:pl-4">
          <div className="text-[11px] text-outline font-semibold uppercase">
            Rata-Rata Perubahan
          </div>
          <div
            className={`font-metric-display text-2xl font-extrabold ${
              fluctuationData.isPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {fluctuationData.finalAverage}
          </div>
          <div
            className={`text-xs font-semibold mt-0.5 ${
              fluctuationData.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            Status: {fluctuationData.trendBadge}
          </div>
        </div>
      </div>

      {/* Chart Utama: BarChart Sederhana & Bersih Fluktuasi Intake */}
      <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006192]"></span>
              Grafik Intake Mahasiswa Baru (5 Tahun Terakhir)
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Jumlah penerimaan mahasiswa baru per tahun dengan indikasi persentase perubahan tahunan
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
            <span className="w-3 h-3 rounded bg-[#006192]"></span>
            <span className="font-medium text-on-surface">Intake Mahasiswa (Jumlah)</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fluctuationData.chartData}
              margin={{ top: 16, right: 24, bottom: 8, left: -10 }}
            >
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
                allowDecimals={false}
              />
              <RechartsTooltip content={<FluctuationTrendTooltip />} />
              <Bar
                dataKey="absolutCount"
                name="Intake Mahasiswa"
                fill="#006192"
                radius={[6, 6, 0, 0]}
                barSize={44}
                isAnimationActive
              >
                {fluctuationData.chartData.map((entry, index) => (
                  <Cell
                    key={`fluc-cell-${index}`}
                    fill={index === fluctuationData.chartData.length - 1 ? '#d97706' : '#006192'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rincian Tabel Perubahan 5 Tahun (Newest to Oldest) */}
      <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
          <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Tabel Rekapitulasi Perubahan Intake (5 Tahun Terakhir)
          </h5>
          <span className="text-[11px] text-outline font-medium">PDDikti & Sevima Verified</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Tahun</th>
              <th className="py-2.5 px-4 text-right">Jumlah Intake</th>
              <th className="py-2.5 px-4 text-right">Persentase Perubahan (YoY)</th>
              <th className="py-2.5 px-4 text-right">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
            {sortedFluctuationTableData.map((row, idx) => {
              const isLatest = idx === 0;
              const isPos = row.deltaPercentage !== null && row.deltaPercentage >= 0;
              return (
                <tr
                  key={row.year}
                  className={`${
                    isLatest ? 'bg-primary-fixed/20 font-bold' : 'hover:bg-surface-container-low/40'
                  } transition-colors`}
                >
                  <td className="py-2.5 px-4 text-on-surface flex items-center gap-2">
                    <span>Tahun {row.year}</span>
                    {isLatest && (
                      <span className="text-[10px] px-2 py-0.2 bg-primary text-white rounded font-bold">
                        Terkini
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-on-surface font-bold tabular-nums">
                    {row.absolutCount.toLocaleString('en-US')} Mahasiswa
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                      row.deltaPercentage === null
                        ? 'text-outline'
                        : isPos
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {row.deltaFormatted}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {row.deltaPercentage === null ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        -
                      </span>
                    ) : isPos ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        Tumbuh
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        Menyusut
                      </span>
                    )}
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
