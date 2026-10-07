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
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator; kunci MODAL_MAP adalah nilai `modalType` yang sah.
 */
export default function MbkmDetailModal(props) {
  return (
    <DetailModalOrchestrator
      {...props}
      modalMap={MODAL_MAP}
      fallbackMessage="Gagal memuat rincian MBKM. Silakan tutup lalu coba lagi."
    />
  );
}
