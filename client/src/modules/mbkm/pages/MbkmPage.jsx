import { useMemo } from 'react';
import { AlertCircle, Award, Briefcase, Building2, UserCheck } from 'lucide-react';
import MetricSummaryGrid from '../../../components/common/cards/MetricSummaryGrid';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { STUDENT_SEARCH_DEBOUNCE_MS } from '../../../constants/debounce';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import { getMbkmKpiFilterScope } from '../utils/mbkmQuery';
import MbkmDataTable from '../components/MbkmDataTable';
import MbkmDetailModal from '../components/MbkmDetailModal';
import { MbkmFilterContainer } from '../components/filters';
import { useMbkmFilterControls } from '../hooks/useMbkmFilterControls';
import { useMbkmFilters } from '../hooks/useMbkmFilters';
import { useMbkmKpiDisplay } from '../hooks/useMbkmKpiDisplay';
import { useMbkmList } from '../hooks/useMbkmList';
import { useMbkmModalOrigin } from '../hooks/useMbkmModalOrigin';
import { useMbkmSummary } from '../hooks/useMbkmSummary';

const TABLE_LIMIT = 10;

export default function MbkmPage() {
  const { values: filters, setters, filterParams, activeFilterCount, resetFilters } = useMbkmFilters();
  const debouncedSearch = useDebouncedValue(filters.searchQuery, STUDENT_SEARCH_DEBOUNCE_MS);

  const summaryParams = useMemo(() => ({ ...filterParams, search: debouncedSearch }), [debouncedSearch, filterParams]);
  const listParams = useMemo(() => ({ ...filterParams, search: debouncedSearch }), [debouncedSearch, filterParams]);

  const summaryQuery = useMbkmSummary(summaryParams);
  const { rows, pagination, page, setPage, isLoading: isListLoading } = useMbkmList(listParams, { limit: TABLE_LIMIT });
  const { activeModalType, currentModalType, originRect, openModal, closeModal } = useMbkmModalOrigin();

  const availableFilterOptions = summaryQuery.data?.filterOptions || {};

  const { filterControlValues, filterControlOptions, filterHandlers } = useMbkmFilterControls(
    filters,
    setters,
    availableFilterOptions
  );

  const isSearchDebouncing = filters.searchQuery !== debouncedSearch;
  // Keep an existing KPI interactive during an unobtrusive background refetch.
  const isKpiLoading = summaryQuery.isLoading || isSearchDebouncing;
  const { kpis, displaySubtitles, isReady } = useMbkmKpiDisplay(summaryQuery.data, isKpiLoading);
  const kpiScope = useMemo(() => getMbkmKpiFilterScope(filterParams), [filterParams]);

  const actionLabel = activeFilterCount ? 'Lihat Data Terfilter' : 'Lihat Rincian';
  const cardProps = { actionLabel, actionDisabled: false, isLoading: isKpiLoading };

  const metricCards = useMemo(() => [
    { key: 'rate', title: 'Tingkat Partisipasi MBKM', value: formatKpiDisplay(kpis.participationRate), subtitle: displaySubtitles.rate, icon: Award, badge: 'Target IKU-2: ≥ 20%', onViewDetails: (event) => openModal('rate', event), isFiltered: kpiScope.rate && isReady },
    { key: 'participants', title: 'Total Partisipan MBKM', value: formatKpiDisplay(kpis.totalParticipants), subtitle: displaySubtitles.participants, icon: Briefcase, badge: 'BKP MBKM', onViewDetails: (event) => openModal('activities', event), isFiltered: kpiScope.participants && isReady },
    { key: 'eligible', title: 'Mahasiswa Eligible', value: formatKpiDisplay(kpis.eligibleCount), subtitle: displaySubtitles.eligible, icon: UserCheck, badge: 'Semester 7 Aktif', onViewDetails: (event) => openModal('eligible', event), isFiltered: kpiScope.eligible && isReady },
    { key: 'mitra', title: 'Mitra MBKM & Industri', value: formatKpiDisplay(kpis.totalMitra), subtitle: displaySubtitles.mitra, icon: Building2, badge: 'Mitra Terverifikasi', onViewDetails: (event) => openModal('partners', event), isFiltered: kpiScope.mitra && isReady },
  ], [displaySubtitles, isReady, kpiScope, kpis, openModal]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">MBKM Data</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Monitoring partisipasi Merdeka Belajar Kampus Merdeka, ketercapaian target IKU-2, dan jejaring mitra industri.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {summaryQuery.error && !summaryQuery.data && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
              <AlertCircle size={14} />
              <span>Backend belum terhubung.</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <MetricSummaryGrid cards={metricCards} cardProps={cardProps} />

      {summaryQuery.error && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium">
          <AlertCircle size={14} />
          <span>Gagal memuat data terfilter. Silakan coba lagi.</span>
        </div>
      )}

      {/* Filter Container */}
      <MbkmFilterContainer
        filterValues={filterControlValues}
        filterOptions={filterControlOptions}
        filterHandlers={filterHandlers}
        activeCount={activeFilterCount}
        onResetAll={resetFilters}
        isLoading={summaryQuery.isLoading && !summaryQuery.data}
      />

      {/* Tabel Data MBKM */}
      <MbkmDataTable
        rows={rows}
        page={page}
        limit={TABLE_LIMIT}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isListLoading}
      />

      {/* Modal Detail Popups */}
      <MbkmDetailModal
        isOpen={Boolean(activeModalType)}
        onClose={closeModal}
        activeModalType={currentModalType}
        originRect={originRect}
        data={summaryQuery.data}
        filters={summaryParams}
      />
    </div>
  );
}
