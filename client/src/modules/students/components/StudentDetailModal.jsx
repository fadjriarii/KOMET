import { lazy, Suspense } from 'react';
import Skeleton from '../../../components/common/feedback/Skeleton';
import ErrorBoundary from '../../../components/common/feedback/ErrorBoundary';

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
  if (!activeModalType) return null;

  const ModalComponent = MODAL_MAP[activeModalType];
  if (!ModalComponent) return null;

  // `activeModalType` remains the last type during the close animation so Modal
  // can finish its 700 ms exit transition without mounting the other modals.
  const commonProps = { isOpen, onClose, originRect, data, filters };

  return (
    <ErrorBoundary
      resetKey={activeModalType}
      fallback={<div className="fixed inset-0 z-50 grid place-items-center text-sm text-gray-600">Gagal memuat rincian. Silakan tutup lalu coba lagi.</div>}
    >
      <Suspense fallback={isOpen ? <div className="fixed inset-0 z-50 grid place-items-center"><Skeleton className="h-10 w-64 rounded-xl" /></div> : null}>
        <ModalComponent {...commonProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
