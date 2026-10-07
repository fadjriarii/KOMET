import { useMemo } from 'react';
import MetricSummaryGrid from '../cards/MetricSummaryGrid';
import QueryErrorBanner from '../feedback/QueryErrorBanner';
import DashboardFilterForm from '../filters/DashboardFilterForm';
import { useDebouncedSearchParams } from '../../../hooks/useDebouncedSearchParams';
import { useModalOrigin } from '../../../hooks/useModalOrigin';
import { matchKpiFilterScope } from '../../../utils/kpiScope';

/**
 * Kerangka bersama halaman dashboard (students, graduates, mbkm): filter URL →
 * summary → kartu KPI → tabel → modal detail. Modul memasok konfigurasi dan
 * susunan kartunya saja, tidak menyalin JSX halaman.
 */
export default function DashboardPage({
  title,
  description,
  useFilters,
  filterForm,
  useSummary,
  useList,
  useKpiDisplay,
  buildCards,
  Table,
  DetailModal,
  filterOptions,
  headerExtra: HeaderExtra,
}) {
  const {
    values: filters,
    setters,
    filterParams,
    activeFilterParams,
    activeFilterCount,
    resetFilters,
  } = useFilters();
  const { params: requestParams, isDebouncing } = useDebouncedSearchParams(
    filterParams,
    filters.searchQuery,
  );

  const summaryQuery = useSummary(requestParams);
  const { rows, pagination, setPage, isLoading: isListLoading } = useList(requestParams);
  const { activeModalType, currentModalType, originRect, openModal, closeModal } = useModalOrigin();

  const availableFilterOptions = filterOptions || summaryQuery.data?.filterOptions || {};

  // Refetch senyap tidak boleh mengubah kartu yang sudah tampil menjadi skeleton.
  const isKpiLoading = summaryQuery.isLoading || isDebouncing;
  const display = useKpiDisplay(summaryQuery.data, isKpiLoading);
  const kpiScope = useMemo(
    () => matchKpiFilterScope(summaryQuery.data?.kpiFilterScope, activeFilterParams),
    [summaryQuery.data?.kpiFilterScope, activeFilterParams],
  );

  const actionLabel = activeFilterCount ? 'Lihat Data Terfilter' : 'Lihat Rincian';
  const cardProps = useMemo(
    () => ({ actionLabel, isLoading: isKpiLoading }),
    [actionLabel, isKpiLoading],
  );
  const cards = useMemo(
    () => buildCards({ ...display, kpiScope, openModal }),
    [buildCards, display, kpiScope, openModal],
  );

  return (
    <div className="space-y-6">
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
          <QueryErrorBanner error={summaryQuery.error} hasData={Boolean(summaryQuery.data)} />
        </div>
      </div>

      <MetricSummaryGrid cards={cards} cardProps={cardProps} />

      <DashboardFilterForm
        {...filterForm}
        values={filters}
        setters={setters}
        options={availableFilterOptions}
        activeCount={activeFilterCount}
        onResetAll={resetFilters}
        isLoading={summaryQuery.isLoading && !summaryQuery.data}
      />

      <Table rows={rows} pagination={pagination} onPageChange={setPage} isLoading={isListLoading} />

      <DetailModal
        isOpen={Boolean(activeModalType)}
        onClose={closeModal}
        modalType={currentModalType}
        originRect={originRect}
        data={summaryQuery.data}
        filters={requestParams}
      />
    </div>
  );
}
