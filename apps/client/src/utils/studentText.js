/**
 * studentText.js — kalimat tampilan khusus modul students (subtitle kartu,
 * deskripsi modal, label status). Murni tata bahasa; angka dan fakta domain
 * datang dari server lewat kpis.
 */
import { STUDENT_STATUS } from '@komet/shared/constants';
import { formatNumber } from '@komet/shared/formatters';

export function getStudentIntakeDescription(period, count) {
  return `Menampilkan total penerimaan mahasiswa baru (intake) sebanyak ${count} mahasiswa yang terdaftar aktif pada semester 1 untuk tahun akademik ${period || 'aktif'}.`;
}
export function getStudentKpiSubtitles(
  { foreignStudentsCount, intakePeriod, declinePeriod } = {},
  activeStatusLabel = STUDENT_STATUS.AKTIF,
) {
  const lowerStatus = activeStatusLabel.toLowerCase();
  return {
    activeSubtitle: `Total Student Body status ${lowerStatus}`,
    foreignSubtitle:
      foreignStudentsCount !== undefined && foreignStudentsCount !== null
        ? `${formatNumber(foreignStudentsCount)} Mahasiswa Non-WNI`
        : `Non-WNI status ${lowerStatus}`,
    intakeSubtitle: intakePeriod
      ? `Semester 1, Periode Ganjil Tahun Ajaran ${intakePeriod}`
      : 'Semester 1',
    declineSubtitle: declinePeriod ? `Rata-rata 5 Tahun (${declinePeriod})` : 'Rata-rata 5 Tahun',
  };
}
/**
 * Konteks demografis aktif untuk subtitle card — daftar label dari pilihan filter
 * yang menyimpang dari default (fakultas/prodi/jenjang). Hasil kosong = tidak
 * ada filter demografis aktif, pemanggil tidak menyisipkan apa pun.
 */
export function getDemographicContextLabel(...values) {
  const parts = values.flat(Infinity).filter((item) => typeof item === 'string' && item !== '');
  return parts.length ? parts.join(', ') : '';
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
export function getStatusBadgeVariant(status) {
  if (status === STUDENT_STATUS.AKTIF) return 'success';
  if (status === STUDENT_STATUS.LULUS) return 'info';
  if (status === STUDENT_STATUS.DROP_OUT) return 'danger';
  return 'default';
}
