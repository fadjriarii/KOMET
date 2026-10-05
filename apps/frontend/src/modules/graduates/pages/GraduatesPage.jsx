import { useMemo } from 'react';
import { AlertCircle, Award, BookOpenCheck, Clock, GraduationCap } from 'lucide-react';
import MetricSummaryGrid from '../../../components/common/cards/MetricSummaryGrid';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { STUDENT_SEARCH_DEBOUNCE_MS } from '../../../constants/debounce';
import { formatKpiDisplay } from '../../../utils/uiHelpers';
import { getGraduateKpiFilterScope } from '../utils/graduateQuery';
import GraduateDataTable from '../components/GraduateDataTable';
import GraduateDetailModal from '../components/GraduateDetailModal';
import { GraduateFilterContainer } from '../components/filters';
import { useGraduateFilterControls } from '../hooks/useGraduateFilterControls';
import { useGraduateFilters } from '../hooks/useGraduateFilters';
import { useGraduateKpiDisplay } from '../hooks/useGraduateKpiDisplay';
import { useGraduateList } from '../hooks/useGraduateList';
import { useGraduateModalOrigin } from '../hooks/useGraduateModalOrigin';
import { useGraduateSummary } from '../hooks/useGraduateSummary';

const TABLE_LIMIT = 10;

export default function GraduatesPage() {
  const {
    values: filters,
    setters,
    filterParams,
    activeFilterCount,
    resetFilters,
  } = useGraduateFilters();
  const debouncedSearch = useDebouncedValue(filters.searchQuery, STUDENT_SEARCH_DEBOUNCE_MS);

  const summaryParams = useMemo(
    () => ({ ...filterParams, search: debouncedSearch }),
    [debouncedSearch, filterParams],
  );
  const listParams = useMemo(
    () => ({ ...filterParams, search: debouncedSearch }),
    [debouncedSearch, filterParams],
  );

  const summaryQuery = useGraduateSummary(summaryParams);
  const {
    rows,
    pagination,
    page,
    setPage,
    isLoading: isListLoading,
  } = useGraduateList(listParams, { limit: TABLE_LIMIT });
  const { activeModalType, currentModalType, originRect, openModal, closeModal } =
    useGraduateModalOrigin();

  const availableFilterOptions = summaryQuery.data?.filterOptions || {};

  const { filterControlValues, filterControlOptions, filterHandlers } = useGraduateFilterControls(
    filters,
    setters,
    availableFilterOptions,
  );

  const isSearchDebouncing = filters.searchQuery !== debouncedSearch;
  // Keep an existing KPI interactive during an unobtrusive background refetch.
  const isKpiLoading = summaryQuery.isLoading || isSearchDebouncing;
  const { kpis, displaySubtitles, isReady } = useGraduateKpiDisplay(
    summaryQuery.data,
    isKpiLoading,
  );
  const kpiScope = useMemo(() => getGraduateKpiFilterScope(filterParams), [filterParams]);

  const actionLabel = activeFilterCount ? 'Lihat Data Terfilter' : 'Lihat Rincian';
  const cardProps = { actionLabel, actionDisabled: false, isLoading: isKpiLoading };

  const metricCards = useMemo(
    () => [
      {
        key: 'total',
        title: 'Total Wisudawan',
        value: formatKpiDisplay(kpis.totalGraduates),
        subtitle: displaySubtitles.total,
        icon: GraduationCap,
        badge: '5 Tahun Terakhir',
        onViewDetails: (event) => openModal('total', event),
        isFiltered: kpiScope.total && isReady,
      },
      {
        key: 'gpa',
        title: 'Rata-rata IPK Lulusan',
        value: formatKpiDisplay(kpis.averageGpaS1),
        subtitle: displaySubtitles.gpa,
        icon: Award,
        badge: 'Skala 4.00',
        onViewDetails: (event) => openModal('gpa', event),
        isFiltered: kpiScope.gpa && isReady,
      },
      {
        key: 'onTime',
        title: 'Kelulusan Tepat Waktu',
        value: formatKpiDisplay(kpis.onTimeGraduationRateS1),
        subtitle: displaySubtitles.onTime,
        icon: Clock,
        badge: 'Masa Studi Standar',
        onViewDetails: (event) => openModal('onTime', event),
        isFiltered: kpiScope.onTime && isReady,
      },
      {
        key: 'studySuccess',
        title: 'Keberhasilan Studi',
        value: formatKpiDisplay(kpis.studySuccessRateS1),
        subtitle: displaySubtitles.studySuccess,
        icon: BookOpenCheck,
        badge: 'Evaluasi Akhir Studi',
        onViewDetails: (event) => openModal('studySuccess', event),
        isFiltered: kpiScope.studySuccess && isReady,
      },
    ],
    [displaySubtitles, isReady, kpiScope, kpis, openModal],
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
            Graduate Data
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Statistik kelulusan mahasiswa, distribusi IPK, dan persentase kelulusan tepat waktu.
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
      <GraduateFilterContainer
        filterValues={filterControlValues}
        filterOptions={filterControlOptions}
        filterHandlers={filterHandlers}
        activeCount={activeFilterCount}
        onResetAll={resetFilters}
        isLoading={summaryQuery.isLoading && !summaryQuery.data}
      />

      {/* Tabel Data Kelulusan */}
      <GraduateDataTable
        rows={rows}
        page={page}
        limit={TABLE_LIMIT}
        pagination={pagination}
        onPageChange={setPage}
        isLoading={isListLoading}
      />

      {/* Modal Detail Popups */}
      <GraduateDetailModal
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
