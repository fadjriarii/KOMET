// Kartu metrik bersama — digunakan di semua 4 halaman data
// Props: label, value, description, iconName, iconBgClass, trendBadge, trendPositive,
//        trendIcon, footerLinkText, isFiltered, onClick, children (slot nilai kustom)
import React from 'react';

const MetricCard = ({
  label,
  value,
  description,
  iconName,
  iconBgClass = 'bg-primary-fixed/50 text-primary',
  trendBadge,
  trendPositive = null,
  trendIcon,
  footerLinkText = 'Lihat Rincian',
  isFiltered = false,
  onClick,
  children,
}) => {
  // Warna tren: null = netral, true = hijau, false = merah
  const trendColorClass =
    trendPositive === null ? 'text-on-surface-variant'
    : trendPositive ? 'text-emerald-600'
    : 'text-red-600';

  const resolvedTrendIcon =
    trendIcon || (trendPositive === null ? 'remove' : trendPositive ? 'arrow_upward' : 'arrow_downward');

  const isClickable = !isFiltered && typeof onClick === 'function';

  // Ambil koordinat kartu untuk animasi zoom modal
  const handleClick = (e) => {
    if (!isClickable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onClick({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick(e) : undefined}
      className={[
        'bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30',
        'transition-all relative group flex flex-col justify-between',
        isClickable ? 'hover:border-primary hover:shadow-md cursor-pointer' : 'cursor-default',
      ].join(' ')}
    >
      {/* Badge "Filtered" saat filter aktif */}
      {isFiltered && (
        <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
          <span className="material-symbols-outlined text-[11px]">filter_alt</span>
          Filtered
        </span>
      )}

      {/* Bagian atas: label, ikon, nilai */}
      <div>
        <div className="flex items-center justify-between">
          <span className="font-caption text-caption text-on-surface-variant font-medium">{label}</span>
          {iconName && (
            <div className={['w-8 h-8 rounded-lg flex items-center justify-center transition-transform', iconBgClass, isClickable ? 'group-hover:scale-105' : ''].join(' ')}>
              <span className="material-symbols-outlined text-[18px]">{iconName}</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          {/* Slot children menggantikan value jika diisi (misal dual S1/S2) */}
          {children ? children : (
            <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
              {value}
            </div>
          )}
          {description && (
            <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: badge tren + link lihat detail */}
      {(trendBadge || footerLinkText) && (
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
          {trendBadge && (
            <span className={`inline-flex items-center text-xs font-semibold ${trendColorClass}`}>
              <span className="material-symbols-outlined text-[14px]">{resolvedTrendIcon}</span>
              &nbsp;{trendBadge}
            </span>
          )}
          {!isFiltered && isClickable ? (
            <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline ml-auto">
              {footerLinkText}
              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-outline-variant select-none ml-auto">
              Summary View
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
