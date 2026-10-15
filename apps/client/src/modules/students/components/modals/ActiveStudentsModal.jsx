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
import { activeDistributions } from './activeDistributions';
import { formatNumber } from '@komet/shared/formatters';
import { getCurrentAcademicYear } from '@komet/shared/academicYear';
import { useDetail } from '../../studentQueries';
import { STUDENT_DISTRIBUTION_TABS } from '../../../../components/common/modals/modalTabs';

export default function ActiveStudentsModal({ isOpen, onClose, originRect, data, filters }) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(
    STUDENT_DISTRIBUTION_TABS,
    'fakultas',
  );
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
  const facultyList = activeDetailData?.byFaculty || [];
  const prodiList = activeDetailData?.byProdi || [];
  const jenjangList = activeDetailData?.byJenjang || [];

  const distributions = activeDistributions({ facultyList, prodiList, jenjangList });

  const content = Object.fromEntries(
    distributions.map(({ key, items, emptyIcon, emptyTitle, yAxisWidth }) => [
      key,
      <div className="pt-1">
        <DistributionChart
          items={items}
          countLabel="Jumlah Mahasiswa"
          isLoading={isLoadingDetail}
          error={detailError}
          emptyIcon={emptyIcon}
          emptyTitle={emptyTitle}
          yAxisWidth={yAxisWidth}
        />
      </div>,
    ]),
  );

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

        {/* TABS: Per Fakultas | Per Program Studi | Per Jenjang */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={STUDENT_DISTRIBUTION_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth pr-1">
            <div className="overflow-x-hidden w-full">
              <div key={activeTab} className={`w-full ${slideClass}`}>
                <ModalTabContent activeTab={activeTab} content={content} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
