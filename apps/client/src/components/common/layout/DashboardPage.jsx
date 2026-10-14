import { useEffect, useMemo, useState } from 'react';
import MetricSummaryGrid from '../cards/MetricSummaryGrid';
import QueryErrorBanner from '../feedback/QueryErrorBanner';
import DashboardErrorGuard from './DashboardErrorGuard';
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
  // Tab Lulusan: tahun ajaran "default" adalah tahun ajaran terbaru
  // yang ada di data (`academicYearOptions[0]`), bukan tahun kalender
  // berjalan. Memilihnya sama dengan default "lulus sampai sekarang",
  // jadi tidak boleh menyala sebagai filter aktif. Baru diketahui setelah
  // summary termuat, sehingga disimpan di state dan diteruskan pada
  // render berikutnya; tab lain mengabaikan argumen ini.
  const [defaultAcademicYear, setDefaultAcademicYear] = useState('');
  // Sama dengan defaultAcademicYear: baru diketahui setelah
  // summary termuat, disimpan di state untuk render berikutnya.
  const [latestTahunLulus, setLatestTahunLulus] = useState('');
  const {
    values: filters,
    setters,
    fields: filterFields,
    filterParams,
    activeFilterParams,
    activeFilterCount,
    resetFilters,
  } = useFilters(defaultAcademicYear, latestTahunLulus);
  const { params: requestParams, isDebouncing } = useDebouncedSearchParams(
    filterParams,
    filters.searchQuery,
  );

  const summaryQuery = useSummary(requestParams);
  const { rows, pagination, setPage, isLoading: isListLoading } = useList(requestParams);
  const { activeModalType, currentModalType, originRect, openModal, closeModal } = useModalOrigin();

  const availableFilterOptions = filterOptions || summaryQuery.data?.filterOptions || {};

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
  const isKpiLoading = summaryQuery.isLoading || isDebouncing;
  const display = useKpiDisplay(summaryQuery.data, isKpiLoading, filters);
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
    () => buildCards({ ...display, kpiScope, openModal, filterValues: filters }),
    [buildCards, display, kpiScope, openModal, filters],
  );

  return (
    <DashboardErrorGuard
      error={summaryQuery.error}
      status={summaryQuery.status}
      hasData={Boolean(summaryQuery.data)}
      onRetry={() => summaryQuery.refetch()}
    >
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
            {/* Hanya sampai di sini kalau data lama masih tampil (lihat DashboardErrorGuard). */}
            <QueryErrorBanner error={summaryQuery.error} hasData={Boolean(summaryQuery.data)} />
          </div>
        </div>

        <MetricSummaryGrid cards={cards} cardProps={cardProps} />

        <DashboardFilterForm
          {...filterForm}
          fields={filterFields}
          values={filters}
          setters={setters}
          options={availableFilterOptions}
          activeCount={activeFilterCount}
          onResetAll={resetFilters}
          isLoading={summaryQuery.isLoading && !summaryQuery.data}
        />

        <Table
          rows={rows}
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isListLoading}
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
