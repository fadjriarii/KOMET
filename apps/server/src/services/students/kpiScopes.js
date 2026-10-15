/**
 * Param query yang dibaca tiap kartu — dasar badge "Terfilter" di client, supaya
 * halaman tidak lagi mengklaim semua kartu ikut mempersempit angka.
 * `tanpa()` menyatakan selisih antar `FILTER_SCOPES` dalam satu tempat.
 */
const POPULATION_PARAMS = [
  'search',
  'fakultas',
  'programStudi',
  'jenjang',
  'angkatan',
  'angkatanTahun',
  'semester',
  'kewarganegaraan',
  'statusKeaktifan',
  'periodeMasuk',
  'tahunAjaran',
];
const tanpa = (...keys) => POPULATION_PARAMS.filter((key) => !keys.includes(key));
/** COHORT: intake menghitung semua yang masuk, status keaktifan tidak membatasi. Semester dan angkatan memfilter intake. */
const INTAKE_SCOPE = tanpa('statusKeaktifan');
/** Tren penurunan kebal terhadap filter semester dan status keaktifan. */
const DECLINE_SCOPE = tanpa('statusKeaktifan', 'semester');
/** kewarganegaraan tidak memfilter WNA; tahunAjaran tetap memfilter populasi card. */
const FOREIGN_SCOPE = tanpa('kewarganegaraan');

module.exports = { POPULATION_PARAMS, INTAKE_SCOPE, DECLINE_SCOPE, FOREIGN_SCOPE };
