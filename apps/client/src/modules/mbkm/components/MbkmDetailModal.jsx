import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

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
  modalType, // 'rate' | 'activities' | 'eligible' | 'partners'
  originRect,
  data,
  filters,
}) {
  return (
    <DetailModalOrchestrator
      modalMap={MODAL_MAP}
      fallbackMessage="Gagal memuat rincian MBKM. Silakan tutup lalu coba lagi."
      isOpen={isOpen}
      onClose={onClose}
      modalType={modalType}
      originRect={originRect}
      data={data}
      filters={filters}
    />
  );
}
