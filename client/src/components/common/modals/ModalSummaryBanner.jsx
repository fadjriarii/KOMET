/**
 * ModalSummaryBanner - Reusable Header Banner untuk Popup / Modal Detail
 * Menyajikan layout split 80/20:
 * - Kiri (80%): Paragraf narasi deskripsi / formula yang dapat di-highlight
 * - Kanan (20%): Kartu ringkasan angka metrik / KPI utama
 */
export default function ModalSummaryBanner({
  description,
  label,
  value,
  sublabel,
  className = '',
}) {
  return (
    <div className={`flex gap-3 shrink-0 ${className}`}>
      {/* KIRI (80%): Narasi Deskripsi & Formula */}
      <div className="w-[80%] bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-4 sm:p-5 flex items-center">
        {typeof description === 'string' ? (
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-justify">
            {description}
          </p>
        ) : (
          <div className="w-full text-xs sm:text-sm text-gray-700 leading-relaxed">
            {description}
          </div>
        )}
      </div>

      {/* KANAN (20%): Kotak Highlight Angka / Metrik */}
      <div className="w-[20%] bg-digital-blue-50/80 border border-digital-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 shadow-xs">
        {label && (
          <span className="text-digital-blue-700/90 text-[11px] font-bold uppercase tracking-wider truncate max-w-full">
            {label}
          </span>
        )}
        <h4 className="text-2xl sm:text-3xl font-black text-digital-blue-900 leading-none tracking-tight my-0.5 truncate max-w-full">
          {value ?? '-'}
        </h4>
        {sublabel && (
          <p className="text-xs font-semibold text-digital-blue-700 truncate max-w-full">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
