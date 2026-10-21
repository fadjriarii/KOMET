const { getEligibleStudentsAtPeriodes } = require('./mbkmEligibility');
const { rate } = require('../../utils/percentageUtils');

/**
 * Mahasiswa eligible pada periode terpilih dan sebarannya per prodi.
 * Definisi yang sama dengan penyebut `getMbkmRate`.
 */
async function getEligibleStudents(studentFilter = {}, selectedPeriods) {
  const students = await getEligibleStudentsAtPeriodes(studentFilter, selectedPeriods);

  const counts = new Map();
  for (const student of students) {
    const name = student.programStudi || 'Tidak diketahui';
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  const prodiData = [...counts]
    .map(([name, count]) => ({
      name,
      count,
      percentage: rate(count, students.length),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { eligibleCount: students.length, prodiData };
}

module.exports = { getEligibleStudents };
