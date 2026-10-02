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
 * Komponen orkestrator yang mendelegasikan rendering modal ke masing-masing modal di `modals/`.
 */
export default function GraduateDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'total' | 'gpa' | 'onTime' | 'studySuccess'
  originRect,
  data,
  filters,
}) {
  return <DetailModalOrchestrator modalMap={MODAL_MAP} fallbackMessage="Gagal memuat rincian kelulusan. Silakan tutup lalu coba lagi." isOpen={isOpen} onClose={onClose} activeModalType={activeModalType} originRect={originRect} data={data} filters={filters} />;
}
