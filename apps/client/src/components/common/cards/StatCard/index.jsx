import { StatCardSkeleton } from './StatCardSkeleton';
import { StatCardFooter } from './StatCardFooter';

/**
 * Ubin rincian kartu unggulan: satu angka per kategori (mis. per jenjang).
 * Jumlah ubin mengikuti data; kolom menyesuaikan lebar kartu.
 */
function BreakdownTiles({ items }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-3">
      {items.map((item) => (
        <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 leading-none">
            {item.value ?? '-'}
            {item.unit && (
              <span className="ml-1 text-xs font-medium text-gray-500">{item.unit}</span>
            )}
          </p>
          {item.caption && <p className="mt-1.5 text-[11px] text-gray-500">{item.caption}</p>}
        </div>
      ))}
    </div>
  );
}

/**
 * StatCard - Komponen kartu KPI / Statistik reusable
 * Layout terstruktur: Judul, Angka (Value), Subtitle (teks di atas garis), dan Footer (Garis, Badge, Aksi)
 * selalu sejajar horizontal di setiap card berkat min-height yang konsisten.
 * Dengan `breakdown`, kartu menjadi kartu unggulan: judul + `caption`, ubin per
 * kategori menggantikan angka tunggal, lalu subtitle di atas footer.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  caption,
  breakdown,
  icon: Icon,
  badge,
  actionLabel = 'Lihat Rincian',
  onViewDetails,
  isFiltered = false,
  isLoading = false,
  className = '',
  valueClassName = 'text-gray-900',
}) {
  // Tanpa onViewDetails tidak ada yang bisa dibuka: jangan tawarkan tombol mati.
  const hasAction = Boolean(onViewDetails);
  if (isLoading) {
    return <StatCardSkeleton className={className} hasAction={hasAction} />;
  }

  return (
    <div
      className={`relative bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between h-full min-h-[185px] group ${className}`}
    >
      {/* 1. Bagian Atas: Title (min-height konsisten 2 baris) & Icon */}
      <div className="flex items-start justify-between gap-2.5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider leading-snug min-h-[34px] flex items-start flex-1">
          {title}
        </p>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-digital-blue-50 text-digital-blue-600 flex-shrink-0 transition-transform group-hover:scale-105 duration-200 -mt-0.5">
            <Icon size={20} />
          </div>
        )}
      </div>

      {breakdown?.length ? (
        <>
          {caption && <p className="-mt-2 text-sm text-gray-700">{caption}</p>}
          <div className="flex-1 flex flex-col justify-center py-5">
            <BreakdownTiles items={breakdown} />
          </div>
          <p className="text-xs text-gray-500 font-normal leading-relaxed">{subtitle}</p>
        </>
      ) : (
        /* 2. Bagian Tengah: Angka KPI (Value) & Subtitle tepat di atas garis pemisah */
        <div className="mt-3 space-y-1">
          <h3 className={`text-2xl font-bold tracking-tight leading-tight ${valueClassName}`}>
            {value ?? '-'}
          </h3>
          <p className="text-xs text-gray-500 font-normal leading-snug min-h-[20px] flex items-center">
            {subtitle || ' '}
          </p>
        </div>
      )}

      {/* 3. Bagian Bawah (Footer): Garis pemisah, Badge di Kiri & Button Aksi di Kanan */}
      <StatCardFooter
        badge={badge}
        isFiltered={isFiltered}
        hasAction={hasAction}
        actionLabel={actionLabel}
        onViewDetails={onViewDetails}
      />
    </div>
  );
}
