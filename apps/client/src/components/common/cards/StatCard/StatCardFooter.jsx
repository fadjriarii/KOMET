import { ChevronRight } from 'lucide-react';

/** Footer kartu KPI: badge status di kiri, tombol aksi di kanan. */
export function StatCardFooter({ badge, isFiltered, hasAction, actionLabel, onViewDetails }) {
  return (
    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
      {/* Kiri Bawah: Badge Status / Label */}
      <div className="flex items-center min-h-[24px]">
        {badge || isFiltered ? (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
              isFiltered
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gray-100/90 text-gray-700 border-gray-200/50'
            }`}
          >
            {isFiltered ? 'Terfilter' : badge}
          </span>
        ) : (
          <span className="h-6"></span>
        )}
      </div>

      {/* Kanan Bawah: Button Lihat Rincian dengan Icon */}
      {hasAction && (
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all duration-150 text-digital-blue-600 hover:text-digital-blue-700 hover:bg-digital-blue-50/70 active:bg-digital-blue-100/70 cursor-pointer group/btn"
        >
          <span>{actionLabel}</span>
          <ChevronRight
            size={14}
            className="group-hover/btn:translate-x-0.5 transition-transform duration-150"
          />
        </button>
      )}
    </div>
  );
}
