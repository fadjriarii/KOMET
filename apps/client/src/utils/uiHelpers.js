/**
 * Helper presentasi murni (label, tinggi chart, paginasi). Angka dan tahun
 * akademik TIDAK dihitung di sini — itu milik `@komet/shared`, supaya server
 * dan client tidak bisa berbeda hasil.
 */
import { STUDENT_STATUS } from '@komet/shared/constants';
import { formatNumber } from '@komet/shared/formatters';

export function reverseTrendData(items = []) {
  return Array.isArray(items) ? [...items].reverse() : [];
}
export function getTooltipPayloadItem(payload = []) {
  return payload?.[0]?.payload || null;
}
export function getDistributionChartHeight(count = 0) {
  return Math.max(240, Number(count || 0) * 38);
}
export function getStudentIntakeDescription(period, count) {
  return `Menampilkan total penerimaan mahasiswa baru (intake) sebanyak ${count} mahasiswa yang terdaftar aktif pada semester 1 untuk tahun akademik ${period || 'aktif'}.`;
}
export function formatKpiDisplay(value) {
  return value === '-' || value === null || value === undefined || value === '' ? null : value;
}
export function getStudentKpiSubtitles(
  { foreignStudentsCount, intakePeriod, declinePeriod } = {},
  activeStatusLabel = STUDENT_STATUS.AKTIF,
) {
  return {
    activeSubtitle: `Total Student Body status ${activeStatusLabel.toLowerCase()}`,
    foreignSubtitle:
      foreignStudentsCount !== undefined && foreignStudentsCount !== null
        ? `${formatNumber(foreignStudentsCount)} Mahasiswa Non-WNI`
        : 'Non-WNI status aktif',
    intakeSubtitle: intakePeriod ? `Semester 1 (Periode ${intakePeriod})` : 'Semester 1',
    declineSubtitle: declinePeriod ? `Rata-rata 5 Tahun (${declinePeriod})` : 'Rata-rata 5 Tahun',
  };
}
/**
 * Label kartu/modal dari seleksi status. Yang boleh ada di sini hanya tata bahasa:
 * fakta domain (`isAll`, daftar status, `isCumulative`) dikirim server lewat
 * `kpis.activeStudentStatus`, karena aturan "Aktif = snapshot, status terminal =
 * kumulatif" adalah aturan proyeksi data, bukan pilihan tampilan.
 */
export function getStudentStatusPresentation(selection = {}) {
  const { isAll = false, statuses = [], isCumulative = false } = selection;
  const isMultiple = !isAll && statuses.length > 1;
  // Snapshot sebelum server menjawab belum punya status: pakai populasi default
  // dashboard, bukan label kosong.
  const single = statuses[0] || STUDENT_STATUS.AKTIF;
  const title = isAll ? 'Semua Status' : isMultiple ? 'Status Terpilih' : single;
  // Label yang dibaca di kalimat deskripsi: daftar statusnya sendiri bila yang
  // dipilih lebih dari satu.
  const statusLabel = isAll ? 'semua status' : isMultiple ? statuses.join(', ') : single;

  return {
    cardTitle: `Mahasiswa ${title}`,
    cardBadge: isAll ? 'Semua Status' : `Status ${title}`,
    modalTitle: `Rincian Mahasiswa ${title}`,
    modalSubtitle: isAll
      ? 'Informasi total student body untuk seluruh status keaktifan'
      : isMultiple
        ? 'Informasi total student body dengan status yang dipilih'
        : `Informasi total student body dengan status ${title.toLowerCase()}`,
    summaryLabel: `Total ${title}`,
    statusLabel,
    isCumulative,
  };
}
export function getStudentActiveDescription(
  year,
  count,
  statusLabel = STUDENT_STATUS.AKTIF,
  isCumulative = false,
) {
  const periodLabel = isCumulative
    ? `sampai tahun akademik ${year}`
    : `pada tahun akademik ${year}`;
  return `Menampilkan seluruh student body dengan status ${statusLabel} ${periodLabel} dengan total ${count} mahasiswa yang terdistribusi ke dalam fakultas, program studi, dan jenjang pendidikan.`;
}
export function getActiveTabContent(activeTab, content) {
  return content[activeTab] || null;
}
export function getStatusBadgeVariant(status) {
  if (status === STUDENT_STATUS.AKTIF) return 'success';
  if (status === STUDENT_STATUS.LULUS) return 'info';
  if (status === STUDENT_STATUS.DROP_OUT) return 'danger';
  return 'default';
}
export function getModalOriginRectFromEvent(event) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  return rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null;
}
export function getPaginationMeta({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  currentCount = 0,
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min((currentPage - 1) * pageSize + currentCount, totalItems);
  return {
    currentPage,
    totalPages,
    isFirstPage: currentPage <= 1,
    isLastPage: currentPage >= totalPages,
    rangeLabel: `${start}-${end}`,
    totalLabel: formatNumber(totalItems),
  };
}
export function getPaginationItems(currentPage = 1, totalPages = 1, siblingCount = 1) {
  if (totalPages <= 1) return [1];
  const pages = new Set([1, totalPages]);
  for (
    let page = Math.max(1, currentPage - siblingCount);
    page <= Math.min(totalPages, currentPage + siblingCount);
    page += 1
  )
    pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push(`ellipsis-${page}`);
    result.push(page);
  });
  return result;
}
