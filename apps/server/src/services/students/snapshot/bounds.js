const { DEFAULT_STATUS } = require('./status');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/** Batas periode kode (`YYYY1`/`YYYY2`) untuk satu tahun akademik. */
function getAcademicPeriodBounds(academicYear) {
  const startYear =
    typeof academicYear === 'object' && academicYear ? academicYear.startYear : academicYear;
  return { start: `${startYear}1`, end: `${startYear}2` };
}

/**
 * Syarat periode status terminal tercapai pada tahun akademik [start, end].
 * Lulus selalu terminal di tahun wisudanya (termasuk wisuda Genap); status
 * keluar lain (Keluar/DO/Transfer/...) yang berakhir SETELAH Genap baru
 * terminal di tahun ajaran berikutnya. `statuses` = grup status terminal
 * pada filter (tampilan per baris memakai status barisnya sendiri).
 */
function buildTerminalPeriodCondition(academicStart, academicEnd, statuses = []) {
  const branches = [
    { periodeTerakhir: { not: '', lt: academicStart } },
    { periodeTerakhir: academicStart },
  ];
  if (statuses.includes(STUDENT_STATUS.LULUS)) {
    branches.push({ periodeTerakhir: academicEnd });
  }
  // Status lain yang keluar tepat di akhir tahun (Genap) belum terminal di
  // tahun itu — tampil mulai tahun ajaran berikutnya (kasus Eliza: masuk
  // Ganjil, keluar Genap → Aktif di tahun itu).
  return { OR: branches };
}

function buildActiveSnapshotCondition(academicEnd) {
  return {
    OR: [
      { statusKeaktifan: DEFAULT_STATUS },
      { periodeTerakhir: '' },
      { periodeTerakhir: { gt: academicEnd } },
      { AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '2' } }] },
      // Keluar tepat di akhir tahun ajaran setelah studi penuh (masuk Ganjil):
      // tetap terhitung aktif di tahun itu (kasus Eliza). Lulus dikecualikan
      // — wisudawan Genap tetap milik pelaporan kelulusan, angkanya tidak boleh bergeser.
      {
        AND: [
          { periodeTerakhir: academicEnd },
          { statusKeaktifan: { notIn: [STUDENT_STATUS.AKTIF, STUDENT_STATUS.LULUS] } },
        ],
      },
    ],
  };
}

module.exports = {
  getAcademicPeriodBounds,
  buildTerminalPeriodCondition,
  buildActiveSnapshotCondition,
};
