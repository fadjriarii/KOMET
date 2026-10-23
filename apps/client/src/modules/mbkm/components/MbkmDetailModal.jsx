import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

const MODAL_IMPORTS = {
  rate: () => import('./modals/MbkmRateModal'),
  activities: () => import('./modals/MbkmActivitiesModal'),
  eligible: () => import('./modals/MbkmEligibleModal'),
  partners: () => import('./modals/MbkmPartnersModal'),
};

const MODAL_MAP = Object.fromEntries(
  Object.entries(MODAL_IMPORTS).map(([key, load]) => [key, lazy(load)]),
);

/** Muat semua chunk modal (termasuk chunk grafik bersama) saat halaman idle. */
function prefetchDetailModals() {
  return Promise.all(Object.values(MODAL_IMPORTS).map((load) => load()));
}

/**
 * MbkmDetailModal
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator; kunci MODAL_MAP adalah nilai `modalType` yang sah.
 */
export default function MbkmDetailModal(props) {
  return <DetailModalOrchestrator {...props} modalMap={MODAL_MAP} />;
}

MbkmDetailModal.prefetch = prefetchDetailModals;
