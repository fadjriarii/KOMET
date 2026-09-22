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
  emerald: '#059669',
};

const SuccessTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[210px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">{p.cohortLabel}</p>
        {p.isIncomplete ? (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
            Sedang Berjalan
          </span>
        ) : (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {p.rateFormatted}
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <div className="flex justify-between">
          <span>Lulus (≤ 7 Thn):</span>
          <span className="font-bold text-emerald-700">{p.successCount} mhs</span>
        </div>
        <div className="flex justify-between">
          <span>Total Lulusan:</span>
          <span className="font-bold text-on-surface">{p.total} mhs</span>
        </div>
        <div className="flex justify-between border-t border-surface-container-high pt-1">
          <span>Total Intake Angkatan:</span>
          <span className="font-bold text-primary">{p.intake} mhs</span>
        </div>
      </div>
      {p.isIncomplete && (
        <p className="text-[10px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded mt-2 border border-emerald-200/60 leading-tight">
          Tahun terbaru dalam tabel (belum dihitung dalam evaluasi 5 tahun).
        </p>
      )}
    </div>
  );
};

const SuccessTooltipS2 = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="rounded-lg border border-surface-container-high bg-white px-3.5 py-2.5 shadow-xl min-w-[210px]">
      <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5 mb-1.5">
        <p className="text-xs font-bold text-on-surface">{p.cohortLabel}</p>
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
          <span>Lulus (≤ 4 Thn):</span>
          <span className="font-bold text-emerald-700">{p.successCount} mhs</span>
        </div>
        <div className="flex justify-between border-t border-surface-container-high pt-1">
          <span>Total Intake S2:</span>
          <span className="font-bold text-primary">{p.intake || p.total || p.totalS2} mhs</span>
        </div>
      </div>
      {p.isIncomplete && (
        <p className="text-[10px] text-purple-800 bg-purple-50/80 p-1.5 rounded mt-2 border border-purple-200/60 leading-tight">
          Tahun terbaru dalam tabel (belum dihitung dalam evaluasi 5 tahun).
        </p>
      )}
    </div>
  );
};

export const StudySuccessView = ({
  studySuccessRateS1,
  studySuccessRateS2,
  successCohortData,
  successCohortDataS2,
  successChartData,
  successChartDataS2,
}) => {
  const [activeSuccessTab, setActiveSuccessTab] = useState('s1');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Sarjana (S1) — Keberhasilan Studi
            </span>
            <div className="font-metric-display text-2xl font-extrabold text-emerald-700 mt-1">
              {studySuccessRateS1.rate}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {studySuccessRateS1.successCount} dari {studySuccessRateS1.totalIntake} mhs ({studySuccessRateS1.cohortLabel})
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
            S1 (Maks. 7 Thn)
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Magister (S2) — Keberhasilan Studi
            </span>
            <div className="font-metric-display text-2xl font-extrabold text-purple-700 mt-1">
              {studySuccessRateS2.rate}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {studySuccessRateS2.successCount} dari {studySuccessRateS2.totalS2} mhs ({studySuccessRateS2.cohortLabel})
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 shrink-0">
            S2 (Maks. 4 Thn)
          </span>
        </div>
      </div>

      <div className="flex gap-4 border-b border-surface-container-high">
        <button
          onClick={() => setActiveSuccessTab('s1')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeSuccessTab === 's1'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Sarjana (S1) — Maks. 7 Tahun
          {activeSuccessTab === 's1' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveSuccessTab('s2')}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors relative cursor-pointer ${
            activeSuccessTab === 's2'
              ? 'text-purple-700 font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Magister (S2) — Maks. 4 Tahun
          {activeSuccessTab === 's2' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
        </button>
      </div>

      {activeSuccessTab === 's1' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950">
            <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0 mt-0.5">info</span>
            <div>
              <p className="font-semibold text-emerald-900">Evaluasi Keberhasilan Studi (S1):</p>
              <p className="text-emerald-800/90 text-[11px] mt-0.5 leading-relaxed">
                Tabel menyajikan data 6 angkatan secara individual (satu per satu). Persentase dihitung untuk 5 angkatan yang telah melewati siklus studi 7 tahun. Angkatan terbaru ({successCohortData[0]?.cohort || 2022}) berstatus sedang berjalan sehingga belum dihitung dalam persentase.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
            <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Tingkat Keberhasilan Studi per Angkatan (S1)
            </h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Rasio mahasiswa S1 yang lulus dalam batas 7 tahun terhadap total intake angkatan (6 angkatan terakhir)
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={successChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="cohortLabel" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<SuccessTooltip />} />
                  <Bar dataKey="rate" name="Keberhasilan Studi (%)" fill="#006192" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
              <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Tabel Evaluasi Keberhasilan Studi — S1 (6 Angkatan)
              </h5>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Batas Maks. 7 Thn</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Angkatan</th>
                  <th className="py-2.5 px-4 text-right">Lulus Dalam 7 Tahun</th>
                  <th className="py-2.5 px-4 text-right">Intake Mahasiswa</th>
                  <th className="py-2.5 px-4 text-right">Tingkat Keberhasilan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                {successCohortData.map((row) => (
                  <tr key={row.cohort} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-2.5 px-4 text-on-surface font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{row.cohortLabel}</span>
                        {row.isIncomplete && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Sedang Berjalan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 font-bold tabular-nums">
                      {row.successCount} mhs
                    </td>
                    <td className="py-2.5 px-4 text-right text-primary font-semibold tabular-nums">{row.intake} mhs</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700 tabular-nums">
                      {row.isIncomplete ? (
                        <span className="text-outline font-semibold italic" title="Masa studi maksimal (7 tahun) masih berjalan">-*</span>
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

      {activeSuccessTab === 's2' && (
        <div className="space-y-4">
          {successCohortDataS2.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-[36px] text-outline">school</span>
              <p className="text-sm font-medium">Belum ada data lulusan S2 pada rentang angkatan ini.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs text-purple-950">
                <span className="material-symbols-outlined text-[18px] text-purple-700 shrink-0 mt-0.5">info</span>
                <div>
                  <p className="font-semibold text-purple-900">Evaluasi Keberhasilan Studi (S2):</p>
                  <p className="text-purple-800/90 text-[11px] mt-0.5 leading-relaxed">
                    Tabel menyajikan data 6 angkatan secara individual (satu per satu). Persentase dihitung untuk 5 angkatan yang telah melewati masa studi 4 tahun. Angkatan terbaru ({successCohortDataS2[0]?.cohort || 2024}) berstatus sedang berjalan sehingga belum dihitung dalam persentase.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-xl p-5">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Tingkat Keberhasilan Studi per Angkatan (S2)
                </h4>
                <p className="text-xs text-on-surface-variant mb-4">
                  Rasio mahasiswa S2 yang lulus dalam batas 4 tahun terhadap total intake S2 angkatan (6 angkatan terakhir)
                </p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={successChartDataS2} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="cohortLabel" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                      <RechartsTooltip content={<SuccessTooltipS2 />} />
                      <Bar dataKey="rate" name="Keberhasilan Studi S2 (%)" fill="#d97706" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface-container-low/30 border border-surface-container-high/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Tabel Evaluasi Keberhasilan Studi — S2 (6 Angkatan)
                  </h5>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Batas Maks. 4 Thn</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low/80 border-b border-surface-container-high text-outline text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Angkatan</th>
                      <th className="py-2.5 px-4 text-right">Lulus Dalam 4 Tahun</th>
                      <th className="py-2.5 px-4 text-right">Intake S2</th>
                      <th className="py-2.5 px-4 text-right">Tingkat Keberhasilan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/60 bg-surface-container-lowest font-medium">
                    {successCohortDataS2.map((row) => (
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
                        <td className="py-2.5 px-4 text-right text-emerald-700 font-bold tabular-nums">
                          {row.successCount} mhs
                        </td>
                        <td className="py-2.5 px-4 text-right text-primary font-semibold tabular-nums">{row.intake} mhs</td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-purple-700 tabular-nums">
                          {row.isIncomplete ? (
                            <span className="text-outline font-semibold italic" title="Masa studi maksimal (4 tahun) masih berjalan">-*</span>
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
