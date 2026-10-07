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
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator; kunci MODAL_MAP adalah nilai `modalType` yang sah.
 */
export default function StudentDetailModal(props) {
  return (
    <DetailModalOrchestrator
      {...props}
      modalMap={MODAL_MAP}
      fallbackMessage="Gagal memuat rincian. Silakan tutup lalu coba lagi."
    />
  );
}
