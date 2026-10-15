import Skeleton from '../../feedback/Skeleton';

/** Skeleton kartu KPI saat loading (cermin layout kartu asli). */
export function StatCardSkeleton({ className = '', hasAction = false }) {
  return (
    <div
      className={`bg-white p-5 rounded-2xl border border-gray-100/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full min-h-[185px] ${className}`}
    >
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
        {hasAction && <Skeleton className="h-5 w-24 rounded-lg" />}
      </div>
    </div>
  );
}
