const { createFilterOptionsSource, numericAsc } = require('../filterOptionsSource');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');

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
  const rollingYears = getRollingYears(angkatan);
  return {
    rollingYears,
    customYearMeta: getCustomYearMeta(rollingYears),
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
    semesterOptions: getSemesterOptions(semester),
  };
}

function getSemesterOptions(values) {
  // Daftar tetap 1–8 (masa studi normal); 9+ menampung yang molor tanpa
  // memenuhi dropdown. 9+ hanya muncul bila ada datanya di database.
  const options = Array.from({ length: 8 }, (_, index) => ({
    value: String(index + 1),
    label: `Semester ${index + 1}`,
  }));
  if (values.map(Number).some((value) => Number.isInteger(value) && value > 8)) {
    options.push({ value: '9+', label: 'Semester 9+' });
  }
  return options;
}

function getRollingYears(values) {
  // Kolom sudah menyimpan label ajaran; rolling dibaca verbatim dari data,
  // tanpa mem-parsing tahun mentah di mana pun.
  const labels = [...new Set(values.map(String).filter(Boolean))].sort().reverse().slice(0, 5);
  return labels.length ? labels : [];
}

/**
 * Metadata input tahun ajaran kustom penuh ("2021/2022") untuk satu kolom
 * label: batas bawah statis, batas atas = label tertua rolling − 1, plus teks
 * bantuan siap tampil. Frontend hanya merender metadata ini.
 */
function getCustomYearMeta(rollingLabels, minLabel = '2014/2015') {
  const oldest = [...rollingLabels].sort()[0] || null;
  const maxStart = oldest ? Number(oldest.slice(0, 4)) - 1 : null;
  return {
    minLabel,
    maxLabel: maxStart ? formatAcademicYearLabel(maxStart) : null,
    placeholder: maxStart ? formatAcademicYearLabel(maxStart) : minLabel,
    helperText: maxStart
      ? `Angkatan lama tidak ada di atas? Ketik tahun ajaran ${minLabel}–${formatAcademicYearLabel(maxStart)}.`
      : `Ketik tahun ajaran mulai ${minLabel}.`,
    errorText: maxStart
      ? `Hanya ${minLabel}–${formatAcademicYearLabel(maxStart)}.`
      : `Hanya mulai ${minLabel}.`,
  };
}

const studentFilterOptions = createFilterOptionsSource({
  queries: studentQueries,
  derive: deriveStudentOptions,
});

module.exports = {
  getFilterOptions: studentFilterOptions.getFilterOptions,
  clearFilterCache: studentFilterOptions.clearFilterCache,
  // Dipakai ulang tab Graduate untuk rolling tahun/angkatan — satu implementasi.
  getRollingYears,
  getCustomYearMeta,
};
