export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatCompactNumber(value) {
  const number = Number(value || 0);
  return number >= 1000 ? `${(number / 1000).toFixed(number % 1000 === 0 ? 0 : 1)}k` : number;
}

export function reverseTrendData(items = []) { return Array.isArray(items) ? [...items].reverse() : []; }
export function getTooltipPayloadItem(payload = []) { return payload?.[0]?.payload || null; }
export function getDistributionChartHeight(count = 0) { return Math.max(240, Number(count || 0) * 38); }
export function getCurrentAcademicYear(date = new Date()) {
  const value = new Date(date);
  const year = value.getFullYear();
  return value.getMonth() >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}
export function getStudentIntakeDescription(period, count) {
  return `Menampilkan total penerimaan mahasiswa baru (intake) sebanyak ${count} mahasiswa yang terdaftar aktif pada semester 1 untuk tahun akademik ${period || 'aktif'}.`;
}
export function formatKpiDisplay(value) { return value === '-' || value === null || value === undefined || value === '' ? null : value; }
export function getStudentKpiSubtitles({ foreignCount, intakePeriod, declinePeriod } = {}) {
  return {
    activeSubtitle: 'Total Student Body status aktif',
    foreignSubtitle: foreignCount !== undefined && foreignCount !== null ? `${formatNumber(foreignCount)} Mahasiswa Non-WNI` : 'Non-WNI status aktif',
    intakeSubtitle: intakePeriod ? `Semester 1 (Periode ${intakePeriod})` : 'Semester 1',
    declineSubtitle: declinePeriod ? `Rata-rata 5 Tahun (${declinePeriod})` : 'Rata-rata 5 Tahun',
  };
}
export function toggleAngkatanYear(selected = [], year) { const value = String(year); return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]; }
export function getAngkatanDisplayText(selected = [], placeholder = 'Pilih Tahun') { return selected.length ? selected.join(', ') : placeholder; }
export function getStudentActiveDescription(year, count) {
  return `Menampilkan seluruh student body aktif pada tahun akademik ${year} dengan total ${count} mahasiswa yang terdistribusi ke dalam fakultas, program studi, dan jenjang pendidikan.`;
}
export function getActiveTabContent(activeTab, content) { return content[activeTab] || null; }
export function getStatusBadgeVariant(status) {
  if (status === 'Aktif') return 'success';
  if (status === 'Lulus') return 'info';
  if (status === 'Drop Out / Dikeluarkan') return 'danger';
  return 'default';
}
export function getRowNumber(index, page = 1, limit = 10) { return ((page - 1) * limit) + index + 1; }
export function getModalOriginRectFromEvent(event) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  return rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null;
}
export function getPaginationMeta({ currentPage = 1, totalPages = 1, totalItems = 0, pageSize = 10, currentCount = 0 }) {
  const start = totalItems === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
  const end = Math.min((currentPage - 1) * pageSize + currentCount, totalItems);
  return { currentPage, totalPages, isFirstPage: currentPage <= 1, isLastPage: currentPage >= totalPages, rangeLabel: `${start}-${end}`, totalLabel: formatNumber(totalItems) };
}
export function getPaginationItems(currentPage = 1, totalPages = 1, siblingCount = 1) {
  if (totalPages <= 1) return [1];
  const pages = new Set([1, totalPages]);
  for (let page = Math.max(1, currentPage - siblingCount); page <= Math.min(totalPages, currentPage + siblingCount); page += 1) pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => { if (index && page - sorted[index - 1] > 1) result.push(`ellipsis-${page}`); result.push(page); });
  return result;
}

export default {
  formatNumber,
  formatCompactNumber,
  reverseTrendData,
  getTooltipPayloadItem,
  getDistributionChartHeight,
  getCurrentAcademicYear,
  getStudentIntakeDescription,
  getStudentActiveDescription,
  getStudentKpiSubtitles,
  formatKpiDisplay,
  getActiveTabContent,
  getStatusBadgeVariant,
  getRowNumber,
  getModalOriginRectFromEvent,
  getPaginationMeta,
  getPaginationItems,
  toggleAngkatanYear,
  getAngkatanDisplayText,
};
