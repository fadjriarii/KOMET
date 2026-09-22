import React from 'react';

export const StudentMetricsRow = ({
  isFiltered,
  dynamicMetrics,
  filteredCount,
  timeHorizon,
  selectedCustomYears,
  onOpenDetailModal,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {/* Card 1: Total Mahasiswa Aktif */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('active-students', {
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
              Total Mahasiswa Aktif
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {dynamicMetrics.activeCohort.toLocaleString('en-US')}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              {isFiltered
                ? `${dynamicMetrics.activeCohort.toLocaleString('en-US')} mahasiswa aktif dari total ${filteredCount} record terfilter.`
                : 'Jumlah seluruh mahasiswa yang memiliki status keaktifan akademik aktif pada periode berjalan.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>{' '}
            +4.1% dari periode lalu
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

      {/* Card 2: Menghitung % Mahasiswa Asing */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('foreign-students', {
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
              Persentase Mahasiswa Asing
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">public</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {dynamicMetrics.foreign.percentage}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              {dynamicMetrics.foreign.count} Mahasiswa Asing Non-WNI dari total {dynamicMetrics.foreign.totalActive} mahasiswa aktif.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              dynamicMetrics.foreign.trendBadge.startsWith('-') ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {dynamicMetrics.foreign.trendBadge.startsWith('-') ? 'arrow_downward' : 'arrow_upward'}
            </span>{' '}
            {dynamicMetrics.foreign.trendBadge}
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
              Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none">
              Summary View
            </span>
          )}
        </div>
      </div>

      {/* Card 3: Menghitung Intake */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('intake-students', {
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
              Intake Mahasiswa Baru (MB)
            </span>
            <div
              className={`w-8 h-8 rounded-lg bg-tertiary-fixed/50 flex items-center justify-center text-tertiary transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {dynamicMetrics.intake.count.toLocaleString('en-US')}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              {dynamicMetrics.intake.percentage} dari total {dynamicMetrics.intake.totalActive} mahasiswa aktif (Mahasiswa Semester 1).
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              dynamicMetrics.intake.trendBadge.startsWith('-') ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {dynamicMetrics.intake.trendBadge.startsWith('-') ? 'arrow_downward' : 'arrow_upward'}
            </span>{' '}
            {dynamicMetrics.intake.trendBadge}
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
              Lihat Detail <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none">
              Summary View
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Penurunan / Pertumbuhan MB */}
      <div
        className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${
          isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
        }`}
        onClick={
          isFiltered
            ? undefined
            : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenDetailModal('intake-fluctuation', {
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
              {timeHorizon === 'custom'
                ? selectedCustomYears.length > 0
                  ? `Penurunan MB (${selectedCustomYears.length} Tahun)`
                  : 'Penurunan MB (Custom Tahun)'
                : timeHorizon === 'all'
                ? 'Penurunan MB (All Time)'
                : 'Penurunan Mahasiswa Baru (5 Thn)'}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${
                isFiltered ? '' : 'group-hover:scale-105'
              } ${
                dynamicMetrics.trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {dynamicMetrics.trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {dynamicMetrics.trend.trendPercentage}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              {timeHorizon === 'custom' && selectedCustomYears.length > 0
                ? `Rata-rata fluktuasi/penurunan mahasiswa baru dari cohort yang dipilih (${[...selectedCustomYears].sort((a, b) => a - b).join(', ')}).`
                : timeHorizon === 'custom' && selectedCustomYears.length === 0
                ? 'Pilih tahun angkatan pada filter di bawah untuk melihat tren fluktuasi mahasiswa baru.'
                : 'Rata-rata fluktuasi/penurunan mahasiswa baru dari kohort 5 tahun terakhir: % Penurunan MB = average(Δ/A).'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              dynamicMetrics.trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {dynamicMetrics.trend.isPositive ? 'arrow_upward' : 'arrow_downward'}
            </span>{' '}
            {dynamicMetrics.trend.trendBadge}
          </span>
          {!isFiltered ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
              Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none">
              Summary View
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
