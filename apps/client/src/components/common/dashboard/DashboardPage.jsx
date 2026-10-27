import { useEffect, useRef, useState } from 'react';
import MetricSummaryGrid from '../cards/MetricSummaryGrid';
import DashboardErrorGuard from './DashboardErrorGuard';
import DashboardFilterForm from '../filters/DashboardFilterForm';
import { DashboardHeader } from './DashboardHeader';
import { useDashboardCards } from './useDashboardCards';
import { useDebouncedSearchParams } from '../../../hooks/useDebouncedSearchParams';
import { useModalOrigin } from '../../../hooks/useModalOrigin';

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
  waitForFilterOptions = false,
  headerExtra: HeaderExtra,
}) {
  // Tab Lulusan: tahun ajaran "default" adalah tahun ajaran terbaru
  // yang ada di data (`academicYearOptions[0]`), bukan tahun kalender
  // berjalan. Memilihnya sama dengan default ("lulus sampai sekarang",
  // jadi tidak boleh menyala sebagai filter aktif. Baru diketahui setelah
  // summary termuat, sehingga disimpan di state dan diteruskan pada
  // render berikutnya; tab lain mengabaikan argumen ini.
  const [defaultAcademicYear, setDefaultAcademicYear] = useState('');
  // Sama dengan defaultAcademicYear: baru diketahui setelah
  // summary termuat, disimpan di state untuk render berikutnya.
  const [latestTahunLulus, setLatestTahunLulus] = useState('');
  // Opsi dari prop adalah sumber default terbaru untuk jangkar tahun ajaran
  // yang sedang dipilih; state hanya cadangan saat opsi sedang dimuat ulang.
  const hasProvidedOptions = Object.keys(filterOptions || {}).length > 0;
  const propAcademicYear = hasProvidedOptions ? (filterOptions.academicYearOptions?.[0] ?? '') : '';
  const propTahunLulus = hasProvidedOptions ? (filterOptions.rollingYears?.[0] ?? '') : '';
  const effectiveAcademicYear = propAcademicYear || defaultAcademicYear;
  const effectiveTahunLulus = propTahunLulus || latestTahunLulus;
  const {
    values: filters,
    setters,
    fields: filterFields,
    filterParams,
    activeFilterParams,
    activeFilterCount,
    resetFilters,
  } = useFilters(effectiveAcademicYear, effectiveTahunLulus);
  const { params: requestParams, isDebouncing } = useDebouncedSearchParams(
    filterParams,
    filters.searchQuery,
  );

  // Tab Lulusan menunggu opsi filter: summary/list pertama langsung memakai
  // Tahun Lulus default, bukan hasil tanpa tahun yang langsung dibuang.
  const optionsReady = !waitForFilterOptions || hasProvidedOptions;
  const summaryQuery = useSummary(requestParams, { enabled: optionsReady });
  const {
    rows,
    pagination,
    setPage,
    isLoading: isListLoading,
    error: listError,
  } = useList(requestParams, { enabled: optionsReady });
  const { activeModalType, currentModalType, originRect, openModal, closeModal } = useModalOrigin();

  const availableFilterOptions = hasProvidedOptions
    ? filterOptions
    : summaryQuery.data?.filterOptions || {};

  // Setelah kartu pertama tampil, muat chunk modal di latar belakang supaya
  // klik kartu tidak menunggu unduhan grafik. requestIdleCallback juga membuat
  // prefetch ini tidak bersaing dengan permintaan awal.
  const detailPrefetchedRef = useRef(false);
  useEffect(() => {
    const prefetch = DetailModal.prefetch;
    if (!summaryQuery.data || detailPrefetchedRef.current || !prefetch) return;
    if (typeof window.requestIdleCallback !== 'function') return;
    const handle = window.requestIdleCallback(
      () => {
        detailPrefetchedRef.current = true;
        prefetch().catch(() => {});
      },
      { timeout: 3000 },
    );
    return () => window.cancelIdleCallback?.(handle);
  }, [DetailModal, summaryQuery.data]);

  // Sinkronkan tahun ajaran default (terbaru dari data) setelah
  // summary termuat; render berikutnya menormalisasi pilihan
  // "tahun ajaran terbaru" kembali ke default tanpa jangkar.
  // (useState di effect disengaja: default baru diketahui setelah
  // summaryQuery — yang bergantung pada filterParams dari useFilters —
  // jadi tidak bisa diturunkan langsung saat render.)
  const latestAcademicYear = availableFilterOptions.academicYearOptions?.[0] ?? '';
  useEffect(() => {
    // Hanya maju, jangan kembali ke '' saat data belum termuat untuk
    // kunci filter baru: mengosongkan default mengubah kunci query
    // kembali ke kunci lama (yang datanya ada di cache), lalu default
    // dipakai lagi — siklus tanpa akhir yang membuat halaman kedip.
    if (!latestAcademicYear) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefaultAcademicYear((prev) => (prev === latestAcademicYear ? prev : latestAcademicYear));
  }, [latestAcademicYear]);

  // Tahun Lulus default = tahun terbaru dalam jangkar (server
  // sudah ter-window per `tahunAjaran`). Tab lain tak punya
  // field ini, jadi nilai ini diabaikan hook mereka.
  const latestTahunLulusFromData = availableFilterOptions.rollingYears?.[0] ?? '';
  useEffect(() => {
    if (!latestTahunLulusFromData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLatestTahunLulus((prev) =>
      prev === latestTahunLulusFromData ? prev : latestTahunLulusFromData,
    );
  }, [latestTahunLulusFromData]);

  // Refetch senyap tidak boleh mengubah kartu yang sudah tampil menjadi skeleton.
  const isKpiLoading = !optionsReady || summaryQuery.isLoading || isDebouncing;
  const display = useKpiDisplay(summaryQuery.data, isKpiLoading, filters);
  const { cards, cardProps } = useDashboardCards({
    buildCards,
    display,
    kpiFilterScope: summaryQuery.data?.kpiFilterScope,
    activeFilterParams,
    openModal,
    filters,
    isKpiLoading,
  });

  return (
    <DashboardErrorGuard
      error={summaryQuery.error}
      status={summaryQuery.status}
      hasData={Boolean(summaryQuery.data)}
      onRetry={() => summaryQuery.refetch()}
    >
      <div className="space-y-6">
        <DashboardHeader
          title={title}
          description={description}
          HeaderExtra={HeaderExtra}
          filters={filters}
          setters={setters}
          summaryQuery={summaryQuery}
          availableFilterOptions={availableFilterOptions}
        />

        <MetricSummaryGrid cards={cards} cardProps={cardProps} />

        <DashboardFilterForm
          {...filterForm}
          fields={filterFields}
          values={filters}
          setters={setters}
          options={availableFilterOptions}
          activeCount={activeFilterCount}
          onResetAll={resetFilters}
          isLoading={!optionsReady || (summaryQuery.isLoading && !summaryQuery.data)}
        />

        <Table
          rows={rows}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={!optionsReady || isListLoading}
          error={listError}
          filterOptions={availableFilterOptions}
        />

        <DetailModal
          isOpen={Boolean(activeModalType)}
          onClose={closeModal}
          modalType={currentModalType}
          originRect={originRect}
          data={summaryQuery.data}
          filters={requestParams}
        />
      </div>
    </DashboardErrorGuard>
  );
}
