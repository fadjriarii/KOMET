const { createFilterOptionsSource } = require('../filterOptionsSource');
const { PREDIKAT, UNCLASSIFIED_PREDIKAT } = require('@komet/shared/constants');
const { getRollingYears, getCustomYearMeta } = require('../students/filterOptions');

// Populasi tab lulusan = mahasiswa Lulus; opsi dibaca dari populasi yang sama
// dengan data (student-base) supaya pilihan UI tak pernah menunjuk populasi
// kosong. Tanpa `where` statis jenjang: Prof ikut sebagai opsi dinamis.
const isLulus = { statusKeaktifan: 'Lulus' };

const graduateQueries = {
  programStudi: { model: 'student', field: 'programStudi', where: isLulus },
  tahunLulus: { model: 'graduate', field: 'tahunLulus', desc: true },
  angkatan: { model: 'student', field: 'angkatan', where: isLulus, desc: true },
  fakultas: { model: 'student', field: 'fakultas', where: isLulus },
  jenjang: { model: 'student', field: 'jenjang', where: isLulus },
};

function deriveGraduateOptions({ tahunLulus, angkatan }) {
  // Tahun Lulus & Angkatan memakai gaya rolling 5 label ajaran + input kustom
  // format penuh yang sama dengan tab Student; builder-nya hidup satu kali di sana.
  const rollingYears = getRollingYears(tahunLulus);
  const rollingAngkatan = getRollingYears(angkatan);
  return {
    rollingYears,
    rollingAngkatan,
    customYearMeta: getCustomYearMeta(rollingYears),
    customAngkatanMeta: getCustomYearMeta(rollingAngkatan),
    periodeOptions: [
      { value: 'Ganjil', label: 'Ganjil' },
      { value: 'Genap', label: 'Genap' },
    ],
    predikatOptions: [...Object.values(PREDIKAT), UNCLASSIFIED_PREDIKAT].map((value) => ({
      value,
      label: value,
    })),
  };
}

const graduateFilterOptions = createFilterOptionsSource({
  queries: graduateQueries,
  derive: deriveGraduateOptions,
});

module.exports = {
  getGraduateFilterOptions: graduateFilterOptions.getFilterOptions,
  clearGraduateFilterCache: graduateFilterOptions.clearFilterCache,
};
