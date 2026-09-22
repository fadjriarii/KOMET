import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const OnTimeTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-xl border border-surface-container-high bg-white p-3.5 shadow-xl min-w-[230px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-2 mb-2">
        <div>
          <p className="text-xs font-bold text-on-surface">{p.cohortLabel}</p>
          <p className="text-[10px] text-on-surface-variant">Tahun Kelulusan: {p.tahunLulusTepat || (p.cohort + 4)}</p>
        </div>
        {p.isIncomplete ? (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
            Sedang Berjalan
          </span>
        ) : (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {p.rateFormatted}
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <div className="flex justify-between">
          <span>Lulus &lt; 4 Thn (Cepat):</span>
          <span className="font-medium text-sky-700">{p.fastCount || 0} mhs</span>
        </div>
        <div className="flex justify-between">
          <span>Lulus Tepat (4 Thn):</span>
          <span className="font-bold text-emerald-700">{p.isIncomplete ? 'Sedang berjalan' : `${p.onTimeCount} mhs`}</span>
        </div>
        <div className="flex justify-between">
          <span>Lulus &gt; 4 Thn:</span>
          <span className="font-medium text-rose-600">{p.lateCount || 0} mhs</span>
        </div>
        <div className="flex justify-between border-t border-surface-container-high pt-1.5 font-semibold">
          <span>Total Intake Angkatan:</span>
          <span className="font-bold text-primary">{p.intake} mhs</span>
        </div>
      </div>
      {p.isIncomplete && (
        <p className="text-[10px] text-amber-700 bg-amber-50/80 p-1.5 rounded mt-2 border border-amber-200/60 leading-tight">
          Tahun terbaru dalam tabel (belum dihitung dalam evaluasi 5 tahun).
        </p>
      )}
    </div>
  );
};

const OnTimeTooltipS2 = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-xl border border-surface-container-high bg-white p-3.5 shadow-xl min-w-[230px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-2 mb-2">
        <div>
          <p className="text-xs font-bold text-on-surface">{p.cohortLabel}</p>
          <p className="text-[10px] text-on-surface-variant">Tahun Kelulusan: {p.tahunLulusTepat || (p.cohort + 2)}</p>
        </div>
        {p.isIncomplete ? (
          <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
            Sedang Berjalan
          </span>
        ) : (
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            {p.rateFormatted}
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <div className="flex justify-between">
          <span>Lulus &lt; 2 Thn (Cepat):</span>
          <span className="font-medium text-sky-700">{p.fastCount || 0} mhs</span>
        </div>
        <div className="flex justify-between">
          <span>Lulus Tepat (2 Thn):</span>
          <span className="font-bold text-purple-700">{p.isIncomplete ? 'Sedang berjalan' : `${p.onTimeCount} mhs`}</span>
        </div>
        <div className="flex justify-between">
          <span>Lulus &gt; 2 Thn:</span>
          <span className="font-medium text-rose-600">{p.lateCount || 0} mhs</span>
        </div>
        <div className="flex justify-between border-t border-surface-container-high pt-1.5 font-semibold">
          <span>Total Intake S2:</span>
          <span className="font-bold text-primary">{p.intake || p.totalS2} mhs</span>
        </div>
      </div>
      {p.isIncomplete && (
        <p className="text-[10px] text-purple-700 bg-purple-50/80 p-1.5 rounded mt-2 border border-purple-200/60 leading-tight">
          Tahun terbaru dalam tabel (belum dihitung dalam evaluasi 5 tahun).
        </p>
      )}
    </div>
  );
};

export const OnTimeGraduationView = ({
  onTimeRateS1,
  onTimeRateS2,
  onTimeCohortData,
  onTimeCohortDataS2,
  onTimeChartData,
  onTimeChartDataS2,
}) => {
  const [activeOnTimeTab, setActiveOnTimeTab] = useState('s1');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Sarjana (S1) — Lulus Tepat Waktu
            </span>
            <div className="font-metric-display text-2xl font-extrabold text-primary mt-1">
              {onTimeRateS1.rate}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {onTimeRateS1.onTimeCount} dari {onTimeRateS1.totalIntake} mhs ({onTimeRateS1.cohortLabel})
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary shrink-0">
            S1 (4 Thn)
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Magister (S2) — Lulus Tepat Waktu
            </span>
            <div className="font-metric-display text-2xl font-extrabold text-purple-700 mt-1">
              {onTimeRateS2.rate}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {onTimeRateS2.onTimeCount} dari {onTimeRateS2.totalS2} mhs ({onTimeRateS2.cohortLabel})
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 shrink-0">
            S2 (2 Thn)
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-surface-container-high">
        <button
          onClick={() => setActiveOnTimeTab('s1')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeOnTimeTab === 's1'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Sarjana (S1) — 4 Tahun
          {activeOnTimeTab === 's1' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveOnTimeTab('s2')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeOnTimeTab === 's2'
              ? 'text-purple-700 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Magister (S2) — 2 Tahun
          {activeOnTimeTab === 's2' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {activeOnTimeTab === 's1' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950">
            <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">info</span>
            <div>
              <p className="font-semibold text-amber-900">Evaluasi Kelulusan Tepat Waktu (S1):</p>
              <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
                Tabel menyajikan data 6 angkatan secara individual (satu per satu). Persentase dihitung untuk 5 angkatan yang telah menyelesaikan masa studi 4 tahun. Angkatan terbaru ({onTimeCohortData[0]?.cohort || 2022}) berstatus sedang berjalan sehingga belum dihitung dalam persentase.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  Persentase Kelulusan Tepat Waktu per Angkatan (S1)
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Tren kelulusan tepat 4 tahun untuk 6 angkatan terakhir
                </p>
              </div>
              <div className="inline-flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
                <span className="flex items-center gap-1.5 font-medium text-on-surface">
                  <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-600" /> % Tepat Waktu
                </span>
                <span className="flex items-center gap-1.5 font-medium text-on-surface">
                  <span className="w-3 h-3 rounded bg-primary/20 border border-primary" /> Total Intake
                </span>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={onTimeChartData} margin={{ top: 16, right: 24, bottom: 8, left: -10 }}>
                  <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <XAxis dataKey="cohortLabel" tick={{ fontSize: 11, fill: '#6f7882' }} tickLine={false} />
                  <YAxis yAxisId="left" unit="%" tick={{ fontSize: 11, fill: '#6f7882' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6f7882' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip content={<OnTimeTooltip />} />
                  <Bar yAxisId="right" dataKey="intake" name="Total Intake Angkatan" fill="#006192" opacity={0.25} radius={[4, 4, 0, 0]} barSize={36} />
                  <Area yAxisId="left" type="monotone" dataKey="rate" name="% Tepat Waktu" stroke="#d97706" strokeWidth={3} fill="#d97706" fillOpacity={0.15} dot={{ r: 4.5, fill: '#d97706' }} activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
              <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Tabel Evaluasi Kelulusan Tepat Waktu — S1 (6 Angkatan)
              </h5>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Tepat Waktu = 4 Thn</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Angkatan</th>
                  <th className="py-2.5 px-4 text-center">Tahun Lulus Tepat</th>
                  <th className="py-2.5 px-4 text-right">Lulus &lt; 4 Thn</th>
                  <th className="py-2.5 px-4 text-right">Lulus Tepat (4 Thn)</th>
                  <th className="py-2.5 px-4 text-right">Lulus &gt; 4 Thn</th>
                  <th className="py-2.5 px-4 text-right">Intake</th>
                  <th className="py-2.5 px-4 text-right">% Tepat Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                {onTimeCohortData.map((row) => (
                  <tr key={row.cohort} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2.5 px-4 text-on-surface font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{row.cohortLabel}</span>
                        {row.isIncomplete && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Sedang Berjalan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center text-on-surface-variant font-medium">
                      {row.tahunLulusTepat}
                      {row.isIncomplete ? '*' : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right text-sky-700 font-semibold tabular-nums">{row.fastCount || 0} mhs</td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-bold tabular-nums">
                      {row.onTimeCount} mhs
                    </td>
                    <td className="py-2.5 px-4 text-right text-rose-600 tabular-nums">{row.lateCount} mhs</td>
                    <td className="py-2.5 px-4 text-right text-primary font-semibold tabular-nums">{row.intake} mhs</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-amber-700 tabular-nums">
                      {row.isIncomplete ? (
                        <span className="text-outline font-semibold italic" title="Data kelulusan reguler belum lengkap">-*</span>
                      ) : (
                        row.rateFormatted
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeOnTimeTab === 's2' && (
        <div className="space-y-4">
          {onTimeCohortDataS2.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-[36px] text-outline">school</span>
              <p className="text-sm font-medium">Belum ada data lulusan S2 pada rentang angkatan ini.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-950">
                <span className="material-symbols-outlined text-[18px] text-purple-700 shrink-0 mt-0.5">info</span>
                <div>
                  <p className="font-semibold text-purple-900">Evaluasi Kelulusan Tepat Waktu (S2):</p>
                  <p className="text-purple-800/90 text-[11px] mt-0.5 leading-relaxed">
                    Tabel menyajikan data 6 angkatan secara individual (satu per satu). Persentase dihitung untuk 5 angkatan yang telah menyelesaikan masa studi 2 tahun. Angkatan terbaru ({onTimeCohortDataS2[0]?.cohort || 2024}) berstatus sedang berjalan sehingga belum dihitung dalam persentase.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      Persentase Kelulusan Tepat Waktu per Angkatan (S2)
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Tepat waktu S2 = 2 tahun sejak angkatan masuk (6 angkatan terakhir)
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs">
                    <span className="flex items-center gap-1.5 font-medium text-on-surface">
                      <span className="w-3 h-3 rounded bg-purple-400/40 border border-purple-600" /> % Tepat Waktu S2
                    </span>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={onTimeChartDataS2} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="cohortLabel" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                      <RechartsTooltip content={<OnTimeTooltipS2 />} />
                      <Bar dataKey="rate" name="% Tepat Waktu S2" fill="#d97706" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Evaluasi Kelulusan Tepat Waktu — S2 (6 Angkatan)
                  </h5>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Tepat Waktu = 2 Thn</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Angkatan</th>
                      <th className="py-2.5 px-4 text-center">Tahun Lulus Tepat</th>
                      <th className="py-2.5 px-4 text-right">Lulus &lt; 2 Thn</th>
                      <th className="py-2.5 px-4 text-right">Lulus Tepat (2 Thn)</th>
                      <th className="py-2.5 px-4 text-right">Lulus &gt; 2 Thn</th>
                      <th className="py-2.5 px-4 text-right">Intake S2</th>
                      <th className="py-2.5 px-4 text-right">% Tepat Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {onTimeCohortDataS2.map((row) => (
                      <tr key={row.cohort} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-2.5 px-4 text-on-surface font-semibold">
                          <div className="flex items-center gap-1.5">
                            <span>{row.cohortLabel}</span>
                            {row.isIncomplete && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Sedang Berjalan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center text-on-surface-variant font-medium">
                          {row.tahunLulusTepat}
                          {row.isIncomplete ? '*' : ''}
                        </td>
                        <td className="py-2.5 px-4 text-right text-sky-700 font-semibold tabular-nums">{row.fastCount || 0} mhs</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-bold tabular-nums">
                          {row.onTimeCount} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right text-rose-600 tabular-nums">{row.lateCount} mhs</td>
                        <td className="py-2.5 px-4 text-right text-primary font-semibold tabular-nums">{row.intake} mhs</td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-purple-700 tabular-nums">
                          {row.isIncomplete ? (
                            <span className="text-outline font-semibold italic" title="Masa studi berjalan">-*</span>
                          ) : (
                            row.rateFormatted
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
