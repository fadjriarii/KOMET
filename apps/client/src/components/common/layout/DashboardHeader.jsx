import QueryErrorBanner from '../feedback/QueryErrorBanner';

/** Judul halaman + filter tahun ajaran header + banner error query. */
export function DashboardHeader({
  title,
  description,
  HeaderExtra,
  filters,
  setters,
  summaryQuery,
  availableFilterOptions,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {HeaderExtra ? (
          <HeaderExtra
            filters={filters}
            setters={setters}
            summaryQuery={summaryQuery}
            options={availableFilterOptions}
          />
        ) : null}
        {/* Hanya sampai di sini kalau data lama masih tampil (lihat DashboardErrorGuard). */}
        <QueryErrorBanner
          error={summaryQuery.error}
          hasData={Boolean(summaryQuery.data)}
          status={summaryQuery.error?.status}
          onRetry={() => summaryQuery.refetch()}
        />
      </div>
    </div>
  );
}
