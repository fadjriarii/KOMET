import { lazy } from 'react';
import DetailModalOrchestrator from '../../../components/common/modals/DetailModalOrchestrator';

const loadBreakdownModal = () => import('./modals/MbkmBreakdownModal');
const MbkmBreakdownModal = lazy(loadBreakdownModal);

/** Satu modal generik untuk keempat kartu; kunci = `modalType` yang sah. */
const MODAL_MAP = Object.fromEntries(
  ['participation', 'total', 'mitra', 'jenis'].map((cardKey) => [
    cardKey,
    function MbkmCardModal(props) {
      return <MbkmBreakdownModal {...props} cardKey={cardKey} />;
    },
  ]),
);

/**
 * MbkmDetailModal
 * Facade yang menyerahkan rendering ke modal di `modals/` lewat
 * DetailModalOrchestrator.
 */
export default function MbkmDetailModal(props) {
  return <DetailModalOrchestrator {...props} modalMap={MODAL_MAP} />;
}

/** Muat chunk modal (termasuk chunk grafik bersama) saat halaman idle. */
MbkmDetailModal.prefetch = loadBreakdownModal;
