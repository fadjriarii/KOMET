const { DEFAULT_STATUS } = require('./status');

/** Batas periode kode (`YYYY1`/`YYYY2`) untuk satu tahun akademik. */
function getAcademicPeriodBounds(academicYear) {
  const startYear =
    typeof academicYear === 'object' && academicYear ? academicYear.startYear : academicYear;
  return { start: `${startYear}1`, end: `${startYear}2` };
}

function buildTerminalPeriodCondition(academicStart, academicEnd) {
  return {
    OR: [
      { periodeTerakhir: { not: '', lt: academicStart } },
      { periodeTerakhir: academicStart },
      { AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '1' } }] },
    ],
  };
}

function buildActiveSnapshotCondition(academicEnd) {
  return {
    OR: [
      { statusKeaktifan: DEFAULT_STATUS },
      { periodeTerakhir: '' },
      { periodeTerakhir: { gt: academicEnd } },
      { AND: [{ periodeTerakhir: academicEnd }, { periodeMasuk: { endsWith: '2' } }] },
    ],
  };
}

module.exports = {
  getAcademicPeriodBounds,
  buildTerminalPeriodCondition,
  buildActiveSnapshotCondition,
};
