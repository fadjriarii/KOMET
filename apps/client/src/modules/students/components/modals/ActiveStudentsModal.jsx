import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import ModalTabContent from '../../../../components/common/modals/ModalTabContent';
import DistributionChart from '../../../../components/common/charts/DistributionChart';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import {
  getStudentActiveDescription,
  getStudentStatusPresentation,
} from '../../../../utils/uiHelpers';
import { activeDistributions, statusSeries } from './activeDistributions';
import { formatNumber } from '@komet/shared/formatters';
import { getCurrentAcademicYear } from '@komet/shared/academicYear';
import { useDetail } from '../../studentQueries';

/**
 * Tab rincian. Di-key dengan susunan tab supaya tab awal selalu tab pertama
 * yang layak (Per Status saat populasi memuat lebih dari satu status).
 */
function DistributionTabs({ tabs, series, isLoading, error }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(tabs, tabs[0]?.key);

  const content = Object.fromEntries(
    tabs.map(({ key, items, emptyIcon, emptyTitle, yAxisWidth, caption }) => [
      key,
      <div className="pt-1">
        {caption && <p className="text-xs text-gray-500 mb-1">{caption}</p>}
        <DistributionChart
          items={items}
          countLabel="Jumlah Mahasiswa"
          isLoading={isLoading}
          error={error}
          emptyIcon={emptyIcon}
          emptyTitle={emptyTitle}
          yAxisWidth={yAxisWidth}
          series={series}
        />
      </div>,
    ]),
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ModalTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth pr-1">
        <div className="overflow-x-hidden w-full">
          <div key={activeTab} className={`w-full ${slideClass}`}>
            <ModalTabContent activeTab={activeTab} content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActiveStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const {
    data: activeDetailData,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useDetail({
    isOpen,
    resourceKey: 'active',
    filters,
    method: 'getActiveStudentsDetail',
    errorMessage: 'Gagal memuat rincian mahasiswa aktif',
  });

  const kpis = data?.kpis || {};
  const activeCount = formatNumber(kpis.activeStudentsCount);
  const statusPresentation = getStudentStatusPresentation(kpis.activeStudentStatus);
  const currentAcademicYear = filters?.tahunAjaran || getCurrentAcademicYear();
  const tabs = activeDistributions(isLoadingDetail || detailError ? null : activeDetailData).map(
    (tab) =>
      tab.key === 'angkatan'
        ? { ...tab, caption: `5 tahun ajaran terakhir sampai ${currentAcademicYear}` }
        : tab,
  );
  // Bar bertumpuk hanya bila populasi memuat lebih dari satu status.
  const statuses = activeDetailData?.statuses || [];
  const series = statuses.length > 1 ? statusSeries(statuses) : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={statusPresentation.modalTitle}
      subtitle={statusPresentation.modalSubtitle}
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton={true}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* TOP: 80/20 Summary Banner */}
        <ModalSummaryBanner
          description={getStudentActiveDescription(
            currentAcademicYear,
            activeCount,
            statusPresentation.statusLabel,
            statusPresentation.isCumulative,
          )}
          label={statusPresentation.summaryLabel}
          value={activeCount}
          sublabel="Mahasiswa"
        />

        {tabs.length ? (
          <DistributionTabs
            key={tabs.map((tab) => tab.key).join('|')}
            tabs={tabs}
            series={series}
            isLoading={isLoadingDetail}
            error={detailError}
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Semua mahasiswa pada filter ini berada di satu kategori, jadi tidak ada rincian
            pengelompokan. Lihat tabel Daftar Mahasiswa untuk datanya.
          </p>
        )}
      </div>
    </Modal>
  );
}
