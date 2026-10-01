import { useMemo, useState } from 'react';
import { AlertCircle, Globe, TrendingDown, TrendingUp, UserPlus, Users } from 'lucide-react';
import StatCard from '../../../components/common/cards/StatCard';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { STUDENT_SEARCH_DEBOUNCE_MS } from '../../../constants/debounce';
import { formatKpiDisplay, getCurrentAcademicYear, getRollingAcademicYears } from '../../../utils/uiHelpers';
import { getStudentKpiFilterScope } from '../utils/studentQuery';
import StudentDataTable from '../components/StudentDataTable';
import StudentDetailModal from '../components/StudentDetailModal';
import StudentAcademicYearFilter from '../components/header/StudentAcademicYearFilter';
import { StudentFilterContainer } from '../components/filters';
import { useStudentFilterControls } from '../hooks/useStudentFilterControls';
import { useStudentFilters } from '../hooks/useStudentFilters';
import { useStudentKpiDisplay } from '../hooks/useStudentKpiDisplay';
import { useStudentList } from '../hooks/useStudentList';
import { useStudentModalOrigin } from '../hooks/useStudentModalOrigin';
import { useStudentSummary } from '../hooks/useStudentSummary';
import { useStudentFilterOptions } from '../hooks/useStudentFilterOptions';

const TABLE_LIMIT = 10;
export default function StudentsPage() {
  const currentAcademicYear = useMemo(() => getCurrentAcademicYear(), []);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(currentAcademicYear);
  const { values: filters, setters, filterParams, activeFilterCount, resetFilters } = useStudentFilters();
  const debouncedSearch = useDebouncedValue(filters.searchQuery, STUDENT_SEARCH_DEBOUNCE_MS);
  
  // Both summary and list now use debounced search consistently
  const summaryParams = useMemo(() => ({ ...filterParams, search: debouncedSearch, tahunAjaran: selectedAcademicYear }), [debouncedSearch, filterParams, selectedAcademicYear]);
  const listParams = useMemo(() => ({ ...filterParams, search: debouncedSearch, tahunAjaran: selectedAcademicYear }), [debouncedSearch, filterParams, selectedAcademicYear]);
  
  const summaryQuery = useStudentSummary(summaryParams);
  const { rows, pagination, page, setPage, isLoading: isListLoading } = useStudentList(listParams, { limit: TABLE_LIMIT });
  const { activeModalType, currentModalType, originRect, openModal, closeModal } = useStudentModalOrigin();
  
  // Fetch filter options from dedicated endpoint (cached 10 min)
  const { filterOptions: filterOptionsQuery, isLoading: filterOptionsLoading } = useStudentFilterOptions();
  const availableFilterOptions = filterOptionsQuery || {};
  
  const academicYearOptions = useMemo(
    () => availableFilterOptions.academicYearOptions || getRollingAcademicYears(5),
    [availableFilterOptions.academicYearOptions]
  );
  const { filterControlValues, filterControlOptions, filterHandlers } = useStudentFilterControls(filters, setters, availableFilterOptions);
  const isSearchDebouncing = filters.searchQuery !== debouncedSearch;
  const isKpiLoading = summaryQuery.isLoading || summaryQuery.isFetching || isSearchDebouncing;
  const { kpis, activeStudentPresentation, displaySubtitles, declineTrendStyle, isReady } = useStudentKpiDisplay(summaryQuery.data, filters, isKpiLoading);
  const kpiScope = useMemo(() => getStudentKpiFilterScope(filterParams), [filterParams]);
  const actionLabel = activeFilterCount ? 'Lihat Data Terfilter' : 'Lihat Rincian';
  const cardProps = { actionLabel, actionDisabled: !isReady, isLoading: isKpiLoading };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">Student Data</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Analitik demografi, mahasiswa asing, intake, dan tren fluktuasi 5 tahun.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StudentAcademicYearFilter value={selectedAcademicYear} onChange={setSelectedAcademicYear} options={academicYearOptions} currentAcademicYear={currentAcademicYear} disabled={summaryQuery.isLoading} />
          {summaryQuery.error && !summaryQuery.data && <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium"><AlertCircle size={14} /><span>Backend belum terhubung.</span></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard {...cardProps} title={activeStudentPresentation.cardTitle} value={formatKpiDisplay(kpis.formattedActiveCount)} subtitle={displaySubtitles.activeSubtitle} icon={Users} badge={activeStudentPresentation.cardBadge} onViewDetails={(event) => openModal('active', event)} isFiltered={kpiScope.active && isReady} />
        <StatCard {...cardProps} title="Persentase Mahasiswa Internasional" value={formatKpiDisplay(kpis.foreignRate)} subtitle={displaySubtitles.foreignSubtitle} icon={Globe} badge="Non-WNI Aktif" onViewDetails={(event) => openModal('foreign', event)} isFiltered={kpiScope.foreign && isReady} />
        <StatCard {...cardProps} title="Intake Mahasiswa Baru" value={formatKpiDisplay(kpis.formattedIntakeCount)} subtitle={displaySubtitles.intakeSubtitle} icon={UserPlus} badge="Mhs Semester 1" onViewDetails={(event) => openModal('intake', event)} isFiltered={kpiScope.intake && isReady} />
        <StatCard {...cardProps} title="Penurunan Mhs Baru (5 Thn)" value={kpis.declineAvg} subtitle={displaySubtitles.declineSubtitle} icon={kpis.hasEnoughDeclineData === false ? AlertCircle : (kpis.isFluctuationPositive ? TrendingUp : TrendingDown)} valueClassName={declineTrendStyle.textClass} badge={kpis.hasEnoughDeclineData === false ? 'Data Belum Cukup' : '5-Year Avg'} onViewDetails={(event) => openModal('decline', event)} isFiltered={kpiScope.decline && isReady} />
      </div>

      {summaryQuery.error && <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium"><AlertCircle size={14} /><span>Gagal memuat data terfilter. Silakan coba lagi.</span></div>}

      <StudentFilterContainer filterValues={filterControlValues} filterOptions={filterControlOptions} filterHandlers={filterHandlers} activeCount={activeFilterCount} onResetAll={resetFilters} isLoading={summaryQuery.isLoading && !summaryQuery.data} />
      <StudentDataTable rows={rows} page={page} limit={TABLE_LIMIT} pagination={pagination} onPageChange={setPage} isLoading={isListLoading} />
      <StudentDetailModal isOpen={Boolean(activeModalType)} onClose={closeModal} activeModalType={currentModalType} originRect={originRect} data={summaryQuery.data} filters={summaryParams} />
    </div>
  );
}
