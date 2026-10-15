const { toArray, addInFilter } = require('@komet/shared/filterUtils');

function addOrCondition(where, condition) {
  where.AND = where.AND || [];
  where.AND.push({ OR: condition });
}

function buildMultiSelectFilters(query, where, { skipCohortFilters = false } = {}) {
  const mappings = [
    ['fakultas', 'fakultas'],
    ['programStudi', 'programStudi'],
    ['jenjang', 'jenjang'],
    ['angkatan', 'angkatan'],
  ];
  mappings.forEach(([queryKey, field]) => addInFilter(where, field, query[queryKey]));

  // Intake/decline (scope COHORT) menghitung semua mahasiswa yang masuk per
  // tahun ajaran — filter angkatan dan semester dari kontrol UI tidak boleh
  // mempersempit populasi itu karena:
  // - angkatanTahun = label ajaran sama dengan tahun intake, sudah di-resolve
  //   lewat periodeMasuk snapshot;
  // - semester = posisi saat ini, bukan saat masuk (intake = selalu semester 1).
  if (!skipCohortFilters) {
    const cohortYears = toArray(query.angkatanTahun);
    if (cohortYears) {
      // Kolom `angkatan` menyimpan label ajaran penuh, jadi filter kohort adalah
      // pencocokan persis — bukan `startsWith` atas tahun mentah.
      addInFilter(where, 'angkatan', cohortYears);
    }

    const semesterValues = toArray(query.semester) || [];
    // Grup "9+" = semester 9 ke atas (molor); selebihnya angka biasa.
    const hasExtendedSemester = semesterValues.includes('9+');
    const semesters = semesterValues
      .map(Number)
      .filter((value) => Number.isInteger(value) && value > 0);
    if (hasExtendedSemester && semesters.length) {
      addOrCondition(where, [{ semester: { in: semesters } }, { semester: { gte: 9 } }]);
    } else if (hasExtendedSemester) {
      where.semester = { gte: 9 };
    } else if (semesters.length) {
      where.semester = { in: semesters };
    }
  }
}

module.exports = { buildMultiSelectFilters };
