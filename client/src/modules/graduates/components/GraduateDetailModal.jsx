import { lazy, Suspense } from 'react';
import Skeleton from '../../../components/common/feedback/Skeleton';
import ErrorBoundary from '../../../components/common/feedback/ErrorBoundary';

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
  if (!activeModalType) return null;

  const ModalComponent = MODAL_MAP[activeModalType];
  if (!ModalComponent) return null;

  const commonProps = { isOpen, onClose, originRect, data, filters };

  return (
    <ErrorBoundary
      resetKey={activeModalType}
      fallback={<div className="fixed inset-0 z-50 grid place-items-center text-sm text-gray-600">Gagal memuat rincian kelulusan. Silakan tutup lalu coba lagi.</div>}
    >
      <Suspense fallback={isOpen ? <div className="fixed inset-0 z-50 grid place-items-center"><Skeleton className="h-10 w-64 rounded-xl" /></div> : null}>
        <ModalComponent {...commonProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
