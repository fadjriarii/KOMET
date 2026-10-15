const { getAcademicYear } = require('./filterBuilder');
const {
  isTerminalInAcademicYear,
  parseStatusSelection,
  DEFAULT_STATUS,
} = require('./snapshotConditions');

function getRequestedAcademicYear(query = {}) {
  const tahunAjaran = typeof query.tahunAjaran === 'string' ? query.tahunAjaran : null;
  const selectedPeriode = typeof query.selectedPeriode === 'string' ? query.selectedPeriode : null;
  return getAcademicYear(tahunAjaran || (selectedPeriode?.includes('/') ? selectedPeriode : null));
}

/**
 * A Student row stores the latest SEVIMA status. For historical snapshots the
 * table must instead show the status at the selected year boundary. A future
 * graduation/exit is therefore rendered as Aktif in an earlier snapshot.
 */
function getSnapshotStatus(student, academicYear, statusValues) {
  if (!academicYear) return student.statusKeaktifan;
  const { isAll, statuses } = parseStatusSelection(statusValues);
  const hasExplicitTerminalFilter = !isAll && !statuses.includes(DEFAULT_STATUS);
  if (hasExplicitTerminalFilter) return student.statusKeaktifan;

  const hasReachedFinalStatus =
    isTerminalInAcademicYear(student, academicYear) && student.statusKeaktifan !== DEFAULT_STATUS;
  return hasReachedFinalStatus ? student.statusKeaktifan : DEFAULT_STATUS;
}

function projectSnapshotStudent(student, academicYear, statusValues) {
  if (!academicYear) return student;
  return { ...student, statusKeaktifan: getSnapshotStatus(student, academicYear, statusValues) };
}

module.exports = { getRequestedAcademicYear, getSnapshotStatus, projectSnapshotStudent };
