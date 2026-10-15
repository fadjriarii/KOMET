const { getCurrentAcademicYearStart } = require('../../../utils/academicUtils');

function getAcademicYear(targetAcademicYear) {
  if (!targetAcademicYear) return null;
  const value = String(targetAcademicYear);
  const match = value.match(/^(\d{4})\/(\d{4})$/);
  const startYear = match ? match[1] : value.length === 4 ? value : null;
  return startYear
    ? {
        startYear,
        endYear: match ? match[2] : String(Number(startYear) + 1),
        isCurrent: Number(startYear) === getCurrentAcademicYearStart(),
      }
    : null;
}

/**
 * Tahun akademik terpilih dari query — satu aturan untuk snapshot kartu,
 * jendela tren, dan proyeksi status tabel.
 * `selectedPeriode` tetap diterima untuk kompatibilitas link lama.
 */
function getSelectedAcademicYear(query = {}) {
  const candidate = query.tahunAjaran || query.selectedPeriode;
  return typeof candidate === 'string' && /^\d{4}\/\d{4}$/.test(candidate) ? candidate : null;
}

function buildPeriodeFilter(value) {
  if (value === 'Ganjil') return { endsWith: '1' };
  if (value === 'Genap') return { endsWith: '2' };
  return value;
}

module.exports = { getAcademicYear, getSelectedAcademicYear, buildPeriodeFilter };
