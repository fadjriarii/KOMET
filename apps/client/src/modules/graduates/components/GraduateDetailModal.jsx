import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

const MODAL_IMPORTS = {
  total: () => import('./modals/TotalGraduatesModal'),
  gpa: () => import('./modals/GpaOverviewModal'),
  studyLength: () => import('./modals/StudyLengthModal'),
  onTime: () => import('./modals/OnTimeGraduationModal'),
  studySuccess: () => import('./modals/StudySuccessModal'),
};

const MODAL_MAP = Object.fromEntries(
  Object.entries(MODAL_IMPORTS).map(([key, load]) => [key, lazy(load)]),
);

/** Muat semua chunk modal (termasuk chunk grafik bersama) saat halaman idle. */
function prefetchDetailModals() {
  return Promise.all(Object.values(MODAL_IMPORTS).map((load) => load()));
}

/**
 * GraduateDetailModal
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator; kunci MODAL_MAP adalah nilai `modalType` yang sah.
 */
export default function GraduateDetailModal(props) {
  return <DetailModalOrchestrator {...props} modalMap={MODAL_MAP} />;
}

GraduateDetailModal.prefetch = prefetchDetailModals;
