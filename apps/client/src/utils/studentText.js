/**
 * studentText.js — kalimat tampilan khusus modul students (subtitle kartu,
 * deskripsi modal, label status). Murni tata bahasa; angka dan fakta domain
 * datang dari server lewat kpis.
 */
import { STUDENT_STATUS } from '@komet/shared/constants';
import { formatNumber } from '@komet/shared/formatters';

export function getStudentIntakeDescription(period, count) {
  return `Menampilkan total penerimaan mahasiswa baru (intake) sebanyak ${count} mahasiswa pada semester 1 untuk tahun akademik ${period || 'aktif'}.`;
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
    intakeSubtitle: intakePeriod ? `Semester 1 Tahun Ajaran ${intakePeriod}` : 'Semester 1',
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

  // Lebih dari satu status = gabungan populasi, jadi judulnya "Total Mahasiswa (…)";
  // nama status disebut langsung selama masih terbaca (≤ 3).
  const combined = isAll
    ? 'Semua Status'
    : isMultiple && statuses.length <= 3
      ? statuses.join(', ')
      : title;
  const cardTitle = isAll || isMultiple ? `Total Mahasiswa (${combined})` : `Mahasiswa ${title}`;

  return {
    cardTitle,
    cardBadge: isAll ? 'Semua Status' : `Status ${title}`,
    modalTitle: `Rincian ${cardTitle}`,
    modalSubtitle: isAll
      ? 'Informasi total student body untuk seluruh status keaktifan'
      : isMultiple
        ? 'Informasi total student body dengan status yang dipilih'
        : `Informasi total student body dengan status ${title.toLowerCase()}`,
    summaryLabel: `Total ${title}`,
    statusTitle: title,
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
  return `Menampilkan seluruh student body dengan status ${statusLabel} ${periodLabel} dengan total ${count} mahasiswa. Rincian hanya menampilkan pengelompokan yang berisi lebih dari satu kategori.`;
}
export function getStatusBadgeVariant(status) {
  if (status === STUDENT_STATUS.AKTIF) return 'success';
  if (status === STUDENT_STATUS.LULUS) return 'info';
  if (status === STUDENT_STATUS.DROP_OUT) return 'danger';
  return 'default';
}

/** "20241" → "Ganjil 2024/2025". */
export function formatCutiPeriod(periode) {
  const match = /^(\d{4})([12])$/.exec(String(periode || '').trim());
  if (!match) return '';
  return `${match[2] === '1' ? 'Ganjil' : 'Genap'} ${match[1]}/${Number(match[1]) + 1}`;
}

/** Ringkasan riwayat cuti: periode Ganjil/Genap + jumlah semester. */
export function formatCutiHistory(periods = [], semesterCount) {
  const labels = (Array.isArray(periods) ? periods : []).map(formatCutiPeriod).filter(Boolean);
  if (!labels.length) return '';
  const count = Number(semesterCount) || labels.length;
  return `${labels.join(', ')} · ${count} semester`;
}
