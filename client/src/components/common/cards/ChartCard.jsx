import Skeleton from '../feedback/Skeleton';

/**
 * ChartCard - Container Card untuk visualisasi grafik/chart
 * Mendukung status isLoading dengan Skeleton loader
 */
export default function ChartCard({
  title,
  subtitle,
  headerAction,
  children,
  isLoading = false,
  className = '',
  footer,
}) {
  return (
    <div className={`bg-white p-5 md:p-6 rounded-2xl border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col ${className}`}>
      {/* Header Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-50">
        <div className="space-y-1">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-32 mt-1" />
            </>
          ) : (
            <>
              {title && <h3 className="text-base font-bold text-gray-800 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </>
          )}
        </div>
        {headerAction && !isLoading && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {headerAction}
          </div>
        )}
      </div>

      {/* Body Visualisasi */}
      <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-3 justify-center items-center p-4">
            <Skeleton className="w-full h-44 rounded-xl" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500">
          {isLoading ? <Skeleton className="h-3 w-48" /> : footer}
        </div>
      )}
    </div>
  );
}
