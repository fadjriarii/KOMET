const { createFilterOptionsSource, numericAsc } = require('../filterOptionsSource');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');

const studentQueries = {
  fakultas: { model: 'student', field: 'fakultas' },
  programStudi: { model: 'student', field: 'programStudi' },
  angkatan: { model: 'student', field: 'angkatan', desc: true },
  semester: { model: 'student', field: 'semester', comparator: numericAsc },
  periodeMasuk: { model: 'student', field: 'periodeMasuk', desc: true },
  kewarganegaraan: { model: 'student', field: 'kewarganegaraan' },
  statusKeaktifan: { model: 'student', field: 'statusKeaktifan' },
  jenjang: { model: 'student', field: 'jenjang' },
};

function deriveStudentOptions({ angkatan, semester, periodeMasuk }) {
  return {
    rollingYears: getRollingYears(angkatan),
    academicYears: [...new Set(periodeMasuk.map((value) => toAcademicYear(value)).filter(Boolean))]
      .sort()
      .reverse(),
    nationalityOptions: [
      { value: 'WNI', label: 'WNI' },
      { value: 'WNA', label: 'WNA' },
    ],
    periodeOptions: [
      { value: 'Ganjil', label: 'Ganjil' },
      { value: 'Genap', label: 'Genap' },
    ],
    // Dropdown Tahun Ajaran mengikuti tahun akademik terbaru yang benar-benar
    // tersedia di database, sehingga otomatis bergeser setelah sync Sevima.
    academicYearOptions: get5YearRollingAcademicYears(
      periodeMasuk.map((value) => toAcademicYear(value)).filter(Boolean),
    ).reverse(),
    semesterOptions: semester.map((value) => ({
      value: String(value),
      label: `Semester ${value}`,
    })),
  };
}

function getRollingYears(values) {
  const years = values
    .map((value) => String(value).match(/\b(20\d{2})\b/)?.[1])
    .filter(Boolean)
    .map(Number);
  const latest = years.length ? Math.max(...years) : new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => String(latest - index));
}

const studentFilterOptions = createFilterOptionsSource({
  queries: studentQueries,
  derive: deriveStudentOptions,
});

module.exports = {
  getFilterOptions: studentFilterOptions.getFilterOptions,
  clearFilterCache: studentFilterOptions.clearFilterCache,
};
