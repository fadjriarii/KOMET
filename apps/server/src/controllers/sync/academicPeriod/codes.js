const { ACADEMIC_YEAR_ROLLOVER_MONTH } = require('@komet/shared/constants');
const { getCurrentAcademicYearStart } = require('../../../utils/academicUtils');

function normalizeAcademicPeriod(value, defaultTerm = '1') {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const compact = raw.replace(/[/\-\s]+/g, '');
  if (/^\d{5}$/.test(compact) && ['1', '2'].includes(compact[4])) return compact;
  if (/^\d{4}$/.test(compact)) return `${compact}${defaultTerm}`;
  const match = raw.match(/^(\d{4}).*?([12])$/);
  return match ? `${match[1]}${match[2]}` : raw;
}

/**
 * Ekstrak field "Periode" dari kode periode Sevima.
 * Digit ke-5: 1 → "Ganjil", 2 → "Genap".
 * @param {string} idPeriode contoh "20251" atau "20252"
 * @returns {"Ganjil"|"Genap"|""}
 */
function extractPeriode(idPeriode) {
  if (!idPeriode || idPeriode.length < 5) return '';
  const digitTerm = idPeriode.substring(4, 5);
  if (digitTerm === '1') return 'Ganjil';
  if (digitTerm === '2') return 'Genap';
  return '';
}

/**
 * Mengembalikan kode periode akademik berjalan saat ini.
 * Tahun awal diambil dari `@komet/shared/academicYear` (satu-satunya tempat bulan
 * rollover disebut); semester adalah 6 bulan pertama tahun akademik = Ganjil,
 * sisanya Genap. Contoh 2026-10 → "20261", 2027-01 → "20261", 2027-03 → "20262".
 * @returns {string} kode periode 5 digit (contoh "20261" atau "20262")
 */
function getCurrentAcademicPeriode(date = new Date()) {
  const bulanSejakRollover =
    (new Date(date).getMonth() + 1 - ACADEMIC_YEAR_ROLLOVER_MONTH + 12) % 12;
  return `${getCurrentAcademicYearStart(date)}${bulanSejakRollover < 6 ? '1' : '2'}`;
}

module.exports = { normalizeAcademicPeriod, extractPeriode, getCurrentAcademicPeriode };
