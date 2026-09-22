import React from 'react';

export const GraduateMetricsRow = ({
  isFiltered,
  totalGraduates,
  totalOriginalCount,
  avgGpa,
  avgGpaS1,
  avgGpaS2,
  onTimeRate,
  onTimeRateS2,
  studySuccess,
  studySuccessS2,
  onOpenDetailModal,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {/* Card 1: Total Lulusan */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('total-graduates', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }
        }
      >
        {isFiltered && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
            <span className="material-symbols-outlined text-[11px]">filter_alt</span>
            Filtered
          </span>
        )}
        <div>
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Total Lulusan (PDDIKTI)
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {totalGraduates.toLocaleString('en-US')}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              {isFiltered
                ? `${totalGraduates.toLocaleString('en-US')} lulusan terfilter dari total ${totalOriginalCount} seluruh lulusan terdaftar.`
                : 'Akumulasi seluruh mahasiswa yang telah diyudisium dan terdata pada pangkalan data PDDIKTI.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +5.8% YoY
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
              Lihat Rincian <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none">
              Summary View
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Rata-rata IPK */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('gpa-overview', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }
        }
      >
        {isFiltered && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
            <span className="material-symbols-outlined text-[11px]">filter_alt</span>
            Filtered
          </span>
        )}
        <div>
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Rata-rata IPK Lulusan
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grade</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {avgGpa.average}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              Rata-rata IPK: Sarjana S1 ({avgGpaS1.average}) · Magister S2 ({avgGpaS2.average}).
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          <span className="inline-flex items-center text-xs font-semibold text-teal-700">
            <span className="material-symbols-outlined text-[14px]">school</span> S1: {avgGpaS1.average} · S2: {avgGpaS2.average}
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
              Lihat IPK Prodi <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none">
              Summary View
            </span>
          )}
        </div>
      </div>

      {/* Card 3: Lulus Tepat Waktu */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('on-time-graduation', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }
        }
      >
        {isFiltered && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
            <span className="material-symbols-outlined text-[11px]">filter_alt</span>
            Filtered
          </span>
        )}
        <div>
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Lulus Tepat Waktu
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-tertiary transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">timer</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {onTimeRate.rate}
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary-fixed/60 px-1.5 py-0.5 rounded">S1</span>
              <span className="text-sm font-bold text-purple-700 leading-none">{onTimeRateS2.rate}</span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">S2</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              Evaluasi 5 Thn · S1 (4 thn): {onTimeRate.onTimeCount} dari {onTimeRate.totalIntake} mhs ({onTimeRate.rate}) · S2 (2 thn): {onTimeRateS2.onTimeCount} dari {onTimeRateS2.totalS2} mhs ({onTimeRateS2.rate})
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40 gap-2">
          <span className="inline-flex items-center text-xs font-semibold text-amber-700 min-w-0 overflow-hidden">
            <span className="material-symbols-outlined text-[14px] shrink-0">how_to_reg</span>
            <span className="ml-1 truncate">S1: {onTimeRate.badge}</span>
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline shrink-0">
              Lihat 6 Angkatan <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none shrink-0">
              Summary View
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Keberhasilan Studi */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('study-success', {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }
        }
      >
        {isFiltered && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
            <span className="material-symbols-outlined text-[11px]">filter_alt</span>
            Filtered
          </span>
        )}
        <div>
          <div className="flex items-center justify-between">
            <span className="font-caption text-caption text-on-surface-variant font-medium">
              Keberhasilan Studi
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {studySuccess.rate}
              </div>
              <span className="text-[11px] font-bold text-primary bg-primary-fixed/60 px-1.5 py-0.5 rounded">S1</span>
              <span className="text-sm font-bold text-purple-700 leading-none">{studySuccessS2.rate}</span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">S2</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              S1 (Evaluasi max 7 thn): {studySuccess.graduatedCount} dari {studySuccess.totalIntake} mhs ({studySuccess.rate}) · S2 (Evaluasi max 4 thn): {studySuccessS2.graduatedCount} dari {studySuccessS2.totalS2} mhs ({studySuccessS2.rate})
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40 gap-2">
          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 min-w-0 overflow-hidden">
            <span className="material-symbols-outlined text-[14px] shrink-0">military_tech</span>
            <span className="ml-1 truncate">S1: {studySuccess.badge}</span>
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline shrink-0">
              Lihat 6 Angkatan <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none shrink-0">
              Summary View
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
