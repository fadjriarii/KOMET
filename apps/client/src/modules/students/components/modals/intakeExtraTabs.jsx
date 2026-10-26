import {
  INTAKE_PRODI_TAB,
  INTAKE_STATUS_TAB,
} from '../../../../components/common/modals/modalTabs';
import { DeclineProdiTable, IntakeProdiView, IntakeStatusChart } from './IntakeBreakdownViews';

/**
 * Tab tambahan yang layak tampil. Tab disembunyikan bila isinya hanya satu
 * kategori (satu prodi / satu status), aturan yang sama dengan modal Total
 * Mahasiswa. Saat memuat atau gagal, hanya tab tren dan tabel yang tampil.
 */
export function intakeExtraTabs(breakdown, { withStatus = false } = {}) {
  if (!breakdown) return { tabs: [], content: {} };
  const tabs = [];
  const content = {};
  if (breakdown.byProdi.length > 1) {
    tabs.push(INTAKE_PRODI_TAB);
    content.prodi = withStatus ? (
      <IntakeProdiView breakdown={breakdown} />
    ) : (
      <DeclineProdiTable breakdown={breakdown} />
    );
  }
  if (withStatus && breakdown.statuses.length > 1) {
    tabs.push(INTAKE_STATUS_TAB);
    content.status = <IntakeStatusChart breakdown={breakdown} />;
  }
  return { tabs, content };
}
