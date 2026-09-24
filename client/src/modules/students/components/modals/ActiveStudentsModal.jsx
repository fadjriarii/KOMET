import { useCallback } from 'react';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import ModalTabNav from '../../../../components/common/modals/ModalTabNav';
import StudentDistributionChart from './StudentDistributionChart';
import { useTabTransition } from '../../../../hooks/useTabTransition';
import {
  extractStudentKpis,
  getCurrentAcademicYear,
  getStudentActiveDescription,
  transformActiveStudentDetail,
  getActiveTabContent,
} from '../../../../utils/logic';
import { studentsService } from '../../services/studentsService';
import { useStudentDetailResource } from '../../hooks/useStudentDetailResource';
import { Building2, BookOpen, Layers } from 'lucide-react';

const STUDENT_TABS = [
  { key: 'fakultas', label: 'Per Fakultas', icon: Building2 },
  { key: 'prodi', label: 'Per Program Studi', icon: BookOpen },
  { key: 'jenjang', label: 'Per Jenjang', icon: Layers },
];

export default function ActiveStudentsModal({
  isOpen,
  onClose,
  originRect,
  data,
}) {
  const { activeTab, handleTabChange, slideClass } = useTabTransition(STUDENT_TABS, 'fakultas');
  const fetchActiveDetail = useCallback(() => studentsService.getActiveStudentsDetail(), []);
  const {
    data: activeDetailData,
    isLoading: isLoadingDetail,
    error: detailError,
  } = useStudentDetailResource(
    isOpen,
    fetchActiveDetail,
    'Gagal memuat rincian mahasiswa aktif'
  );

  const kpis = extractStudentKpis(data);
  const currentAcademicYear = getCurrentAcademicYear();
  const { facultyList, prodiList, jenjangList } = transformActiveStudentDetail(
    activeDetailData,
    kpis.activeCount
  );

  const activeContent = getActiveTabContent(activeTab, {
    fakultas: (
      <div className="pt-1">
        <StudentDistributionChart
          items={facultyList}
          isLoading={isLoadingDetail}
          error={detailError}
          emptyIcon={Building2}
          emptyTitle="Tidak Ada Data Fakultas"
          yAxisWidth={190}
        />
      </div>
    ),
    prodi: (
      <div className="pt-1">
        <StudentDistributionChart
          items={prodiList}
          isLoading={isLoadingDetail}
          error={detailError}
          emptyIcon={BookOpen}
          emptyTitle="Tidak Ada Data Program Studi"
          yAxisWidth={210}
        />
      </div>
    ),
    jenjang: (
      <div className="pt-1">
        <StudentDistributionChart
          items={jenjangList}
          isLoading={isLoadingDetail}
          error={detailError}
          emptyIcon={Layers}
          emptyTitle="Tidak Ada Data Jenjang"
          yAxisWidth={140}
        />
      </div>
    ),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Mahasiswa Aktif"
      subtitle="Informasi total student body dengan status aktif"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton={true}
    >
      <div className="flex flex-col h-full space-y-4">
        {/* TOP: 80/20 Summary Banner */}
        <ModalSummaryBanner
          description={getStudentActiveDescription(currentAcademicYear, kpis.formattedActiveCount)}
          label="Total Aktif"
          value={kpis.formattedActiveCount}
          sublabel="Mahasiswa"
        />

        {/* TABS: Per Fakultas | Per Program Studi | Per Jenjang */}
        <div className="flex-1 flex flex-col min-h-0">
          <ModalTabNav
            tabs={STUDENT_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Tab content area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth pr-1">
            <div className="overflow-x-hidden w-full">
              <div key={activeTab} className={`w-full ${slideClass}`}>
                {activeContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
