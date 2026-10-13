const { createFilterOptionsSource } = require('../filterOptionsSource');
const { PREDIKAT, UNCLASSIFIED_PREDIKAT } = require('@komet/shared/constants');
const { getRollingYears, getCustomYearMeta } = require('../students/filterOptions');
const { get5YearRollingAcademicYears } = require('../../utils/academicUtils');
const { getTahunAjaranLabel, tahunAjaranStart } = require('./tahunAjaran');

// Populasi tab lulusan = baris graduate (asal `/kelulusan`); opsi dibaca dari
// populasi yang sama dengan data supaya pilihan UI tak pernah menunjuk populasi
// kosong. Tanpa `where` statis jenjang: Profesi ikut sebagai opsi dinamis.
const hasGraduate = { NOT: { graduate: null } };

const graduateQueries = {
  programStudi: { model: 'student', field: 'programStudi', where: hasGraduate },
  tahunLulus: { model: 'graduate', field: 'tahunLulus', desc: true },
  angkatan: { model: 'student', field: 'angkatan', where: hasGraduate, desc: true },
  fakultas: { model: 'student', field: 'fakultas', where: hasGraduate },
  jenjang: { model: 'student', field: 'jenjang', where: hasGraduate },
};

function deriveGraduateOptions({ tahunLulus, angkatan }) {
  // Tahun Lulus & Angkatan memakai gaya rolling 5 label ajaran + input kustom
  // format penuh yang sama dengan tab Student; builder-nya hidup satu kali di sana.
  const rollingYears = getRollingYears(tahunLulus);
  const rollingAngkatan = getRollingYears(angkatan);
  return {
    rollingYears,
    rollingAngkatan,
    // Opsi Tahun Ajaran header: jendela 5 tahun dari tahun lulus
    // terbaru yang ada di data — pola dropdown Tahun Ajaran tab
    // Student. Tahun yang belum punya lulusannya (mis. 2026/2027)
    // tidak muncul; pilihan mengikuti SEVIMA, bukan kalender.
    academicYearOptions: get5YearRollingAcademicYears(tahunLulus).reverse(),
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

function withAcademicYearWindow(base, anchorLabel) {
  // Jangkar "lulus sampai tahun ajaran ini": label ajaran valid mulai
  // sebelum/sama dengan tahun ajaran terpilih; 5 tahun terbarunya menjadi
  // opsi Tahun Lulus & Angkatan. Dropdown Tahun Ajaran tidak di-window
  // (user harus tetap bisa kembali ke tahun ajaran terbaru).
  const anchor = getTahunAjaranLabel(anchorLabel);
  if (!anchor) return base;
  const anchorStart = tahunAjaranStart(anchor);
  const withinAnchor = (label) => {
    const start = tahunAjaranStart(label);
    return Number.isFinite(start) && start <= anchorStart;
  };
  const rollingYears = getRollingYears(base.tahunLulus.filter(withinAnchor));
  const rollingAngkatan = getRollingYears(base.angkatan.filter(withinAnchor));
  return {
    ...base,
    rollingYears,
    rollingAngkatan,
    customYearMeta: getCustomYearMeta(rollingYears),
    customAngkatanMeta: getCustomYearMeta(rollingAngkatan),
  };
}

async function getGraduateFilterOptions(anchorLabel = null) {
  const base = await graduateFilterOptions.getFilterOptions();
  return withAcademicYearWindow(base, anchorLabel);
}

module.exports = {
  getGraduateFilterOptions,
  withAcademicYearWindow,
  clearGraduateFilterCache: graduateFilterOptions.clearFilterCache,
};
