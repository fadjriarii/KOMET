import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

const MODAL_IMPORTS = {
  active: () => import('./modals/ActiveStudentsModal'),
  foreign: () => import('./modals/ForeignStudentsModal'),
  intake: () => import('./modals/IntakeStudentsModal'),
  decline: () => import('./modals/DeclineStudentsModal'),
};

const MODAL_MAP = Object.fromEntries(
  Object.entries(MODAL_IMPORTS).map(([key, load]) => [key, lazy(load)]),
);

/** Muat semua chunk modal (termasuk chunk grafik bersama) saat halaman idle. */
function prefetchDetailModals() {
  return Promise.all(Object.values(MODAL_IMPORTS).map((load) => load()));
}

/**
 * StudentDetailModal
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator; kunci MODAL_MAP adalah nilai `modalType` yang sah.
 */
export default function StudentDetailModal(props) {
  return <DetailModalOrchestrator {...props} modalMap={MODAL_MAP} />;
}

StudentDetailModal.prefetch = prefetchDetailModals;
