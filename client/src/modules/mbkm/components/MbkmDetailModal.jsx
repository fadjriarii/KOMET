import { lazy, Suspense } from 'react';
import Skeleton from '../../../components/common/feedback/Skeleton';
import ErrorBoundary from '../../../components/common/feedback/ErrorBoundary';

const MODAL_MAP = {
  rate: lazy(() => import('./modals/MbkmRateModal')),
  activities: lazy(() => import('./modals/MbkmActivitiesModal')),
  eligible: lazy(() => import('./modals/MbkmEligibleModal')),
  partners: lazy(() => import('./modals/MbkmPartnersModal')),
};

/**
 * MbkmDetailModal
 * Komponen orkestrator yang mendelegasikan rendering modal ke masing-masing modal di `modals/`.
 */
export default function MbkmDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'rate' | 'activities' | 'eligible' | 'partners'
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
      fallback={<div className="fixed inset-0 z-50 grid place-items-center text-sm text-gray-600">Gagal memuat rincian MBKM. Silakan tutup lalu coba lagi.</div>}
    >
      <Suspense fallback={isOpen ? <div className="fixed inset-0 z-50 grid place-items-center"><Skeleton className="h-10 w-64 rounded-xl" /></div> : null}>
        <ModalComponent {...commonProps} />
      </Suspense>
    </ErrorBoundary>
  );
}
