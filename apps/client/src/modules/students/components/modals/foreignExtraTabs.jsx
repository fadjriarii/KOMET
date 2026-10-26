import { COUNTRY_TAB, PRODI_TAB } from '../../../../components/common/modals/modalTabs';
import { ForeignCountryChart, ForeignProdiChart } from './ForeignBreakdownViews';

/**
 * Tab tambahan modal Internasional. Sama dengan modal lain: tab yang isinya
 * hanya satu kategori (satu negara / satu prodi) disembunyikan.
 */
export function foreignExtraTabs(detail) {
  const tabs = [];
  const content = {};
  if ((detail?.byCountry?.length ?? 0) > 1) {
    tabs.push(COUNTRY_TAB);
    content.negara = <ForeignCountryChart byCountry={detail.byCountry} />;
  }
  if ((detail?.byProdi?.length ?? 0) > 1) {
    tabs.push(PRODI_TAB);
    content.prodi = <ForeignProdiChart byProdi={detail.byProdi} />;
  }
  return { tabs, content };
}
