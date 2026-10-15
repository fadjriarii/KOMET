/**
 * Kode periode akademik Sevima (`YYYYT`, T = 1 Ganjil / 2 Genap): membentuk kode
 * dari tanggal, membacanya kembali, dan menghitung semester.
 *
 * Aturan tahun akademik (bulan rollover) tidak ditulis ulang di sini — tahun
 * awal datang dari `@komet/shared/academicYear`, jadi jendela tren server dan
 * label filter client tidak bisa berbeda bulan.
 *
 * File ini hanya barrel: implementasi di `academicPeriod/` per topik.
 */
const {
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  formatTahunLulus,
} = require('./academicPeriod/labels');
const {
  normalizeAcademicPeriod,
  extractPeriode,
  getCurrentAcademicPeriode,
} = require('./academicPeriod/codes');
const { hitungSemester } = require('./academicPeriod/semester');

module.exports = {
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  formatTahunLulus,
  normalizeAcademicPeriod,
  extractPeriode,
  getCurrentAcademicPeriode,
  hitungSemester,
};
