import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

const MODAL_MAP = {
  active: lazy(() => import('./modals/ActiveStudentsModal')),
  foreign: lazy(() => import('./modals/ForeignStudentsModal')),
  intake: lazy(() => import('./modals/IntakeStudentsModal')),
  decline: lazy(() => import('./modals/DeclineStudentsModal')),
};

/**
 * StudentDetailModal
 * Komponen orkestrator / facade yang mendelegasikan rendering rincian popup
 * ke masing-masing modal modular di folder `modals/`.
 */
export default function StudentDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'active' | 'foreign' | 'intake' | 'decline'
  originRect,
  data,
  filters,
}) {
  return <DetailModalOrchestrator modalMap={MODAL_MAP} fallbackMessage="Gagal memuat rincian. Silakan tutup lalu coba lagi." isOpen={isOpen} onClose={onClose} activeModalType={activeModalType} originRect={originRect} data={data} filters={filters} />;
}
