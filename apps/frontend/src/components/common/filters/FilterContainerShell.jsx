import { memo, useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, SlidersHorizontal } from 'lucide-react';
import FilterContainerCard from '../cards/FilterContainerCard';

/** Shared header, reset feedback, and footer for dashboard filter forms. */
const FilterContainerShell = memo(function FilterContainerShell({
  title,
  activeCount = 0,
  onResetAll,
  isLoading = false,
  className = '',
  children,
}) {
  const [resetFlash, setResetFlash] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const handleReset = () => {
    onResetAll?.();
    setResetFlash(true);
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setResetFlash(false), 1200);
  };

  return (
    <FilterContainerCard className={className}>
      <div className="space-y-4 sm:space-y-5 w-full">
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-digital-blue-50 text-digital-blue-600 flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <span>{title}</span>
              {activeCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-digital-blue-50 text-digital-blue-700 border border-digital-blue-200/70 animate-fade-in">
                  {activeCount} filter aktif
                </span>
              )}
            </h3>
          </div>
        </div>

        {children}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-500">
            {activeCount > 0 ? (
              <span className="text-gray-600">
                Diterapkan{' '}
                <strong className="text-digital-blue-700 font-bold">{activeCount} filter</strong>{' '}
                kustom
              </span>
            ) : (
              <span className="text-gray-400">Seluruh filter dalam kondisi default</span>
            )}
          </div>
          <div className="flex items-center justify-end w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              disabled={activeCount === 0 || isLoading}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs group ${
                resetFlash
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : activeCount > 0
                    ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-200 active:scale-98'
                    : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed opacity-60'
              }`}
              title="Reset semua filter ke kondisi awal"
            >
              {resetFlash ? (
                <Check size={14} />
              ) : (
                <RotateCcw
                  size={14}
                  className={`transition-transform duration-300 ${activeCount > 0 ? 'group-hover:-rotate-45' : ''}`}
                />
              )}
              <span>{resetFlash ? 'Filter direset' : 'Reset Filter'}</span>
            </button>
          </div>
        </div>
      </div>
    </FilterContainerCard>
  );
});

export default FilterContainerShell;
