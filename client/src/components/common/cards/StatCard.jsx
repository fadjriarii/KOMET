import { ChevronRight } from 'lucide-react';
import Skeleton from '../feedback/Skeleton';

/**
 * StatCard - Komponen kartu KPI / Statistik reusable
 * Layout terstruktur: Judul, Angka (Value), Subtitle (teks di atas garis), dan Footer (Garis, Badge, Aksi)
 * selalu sejajar horizontal di setiap card berkat min-height yang konsisten.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  actionLabel = 'Lihat Rincian',
  onViewDetails,
  actionDisabled = false,
  isLoading = false,
  className = '',
  valueClassName = 'text-gray-900',
  iconClassName = 'bg-digital-blue-50 text-digital-blue-600',
}) {
  if (isLoading) {
    return (
      <div className={`bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full min-h-[185px] ${className}`}>
        {/* Skeleton Header: Title & Icon */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-h-[34px] flex items-start flex-1 pt-0.5">
            <Skeleton className="h-3.5 w-28" />
          </div>
          <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        </div>

        {/* Skeleton Body: Angka & Subtitle */}
        <div className="mt-3 space-y-1.5">
          <Skeleton className="h-7 w-32" />
          <div className="min-h-[20px] flex items-center">
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Skeleton Footer: Garis pemisah, Badge, Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between h-full min-h-[185px] group ${className}`}
    >
      {/* 1. Bagian Atas: Title (min-height konsisten 2 baris) & Icon */}
      <div className="flex items-start justify-between gap-2.5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider leading-snug min-h-[34px] flex items-start flex-1">
          {title}
        </p>

        {Icon && (
          <div className={`p-2.5 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 duration-200 -mt-0.5 ${iconClassName}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* 2. Bagian Tengah: Angka KPI (Value) & Subtitle tepat di atas garis pemisah */}
      <div className="mt-3 space-y-1">
        <h3 className={`text-2xl font-bold tracking-tight leading-tight ${valueClassName}`}>
          {value ?? '-'}
        </h3>
        <p className="text-xs text-gray-500 font-normal leading-snug min-h-[20px] flex items-center">
          {subtitle || '\u00A0'}
        </p>
      </div>

      {/* 3. Bagian Bawah (Footer): Garis pemisah, Badge di Kiri & Button Aksi di Kanan */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        {/* Kiri Bawah: Badge Status / Label */}
        <div className="flex items-center min-h-[24px]">
          {badge ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100/90 text-gray-700 border border-gray-200/50">
              {badge}
            </span>
          ) : (
            <span className="h-6"></span>
          )}
        </div>

        {/* Kanan Bawah: Button Lihat Rincian dengan Icon */}
        <button
          type="button"
          onClick={actionDisabled ? undefined : onViewDetails}
          disabled={actionDisabled}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all duration-150 group/btn ${
            actionDisabled
              ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'text-digital-blue-600 hover:text-digital-blue-700 hover:bg-digital-blue-50/70 active:bg-digital-blue-100/70 cursor-pointer'
          }`}
        >
          <span>{actionLabel}</span>
          {!actionDisabled && (
            <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform duration-150" />
          )}
        </button>
      </div>
    </div>
  );
}
