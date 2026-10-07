import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

const MODAL_MAP = {
  total: lazy(() => import('./modals/TotalGraduatesModal')),
  gpa: lazy(() => import('./modals/GpaOverviewModal')),
  onTime: lazy(() => import('./modals/OnTimeGraduationModal')),
  studySuccess: lazy(() => import('./modals/StudySuccessModal')),
};

/**
 * GraduateDetailModal
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator; kunci MODAL_MAP adalah nilai `modalType` yang sah.
 */
export default function GraduateDetailModal(props) {
  return (
    <DetailModalOrchestrator
      {...props}
      modalMap={MODAL_MAP}
      fallbackMessage="Gagal memuat rincian kelulusan. Silakan tutup lalu coba lagi."
    />
  );
}
