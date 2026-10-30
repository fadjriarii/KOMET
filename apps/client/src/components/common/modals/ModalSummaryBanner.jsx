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
  valueClassName = 'text-digital-blue-900',
  sublabelClassName = 'text-digital-blue-700',
}) {
  return (
    <div className={`flex flex-col lg:flex-row gap-3 shrink-0 ${className}`}>
      {/* Narasi Deskripsi & Formula */}
      <div className="w-full lg:flex-1 min-w-0 bg-digital-blue-50/70 border border-digital-blue-100 rounded-2xl p-3.5 sm:p-5 flex items-center">
        {typeof description === 'string' ? (
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-left sm:text-justify">
            {description}
          </p>
        ) : (
          <div className="w-full text-xs sm:text-sm text-gray-700 leading-relaxed text-left sm:text-justify">
            {description}
          </div>
        )}
      </div>

      {/* Kotak Highlight Angka / Metrik */}
      <div className="w-full lg:w-48 shrink-0 bg-digital-blue-50/80 border border-digital-blue-100 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center gap-1 shadow-xs">
        {label && (
          <span className="text-digital-blue-700/90 text-[11px] font-bold uppercase tracking-wider max-w-full">
            {label}
          </span>
        )}
        <h4
          className={`text-2xl sm:text-3xl font-black leading-none tracking-tight my-0.5 max-w-full break-words ${valueClassName}`}
        >
          {value ?? '-'}
        </h4>
        {sublabel && (
          <p
            className={`text-xs font-semibold max-w-full leading-snug break-words ${sublabelClassName}`}
          >
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
