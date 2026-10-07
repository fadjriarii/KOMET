/**
 * graduateUtils.js
 *
 * Helper utilitas untuk domain lulusan (Graduates).
 */

// Label hidup di @komet/shared agar client yang memwarnai badge memakai string
// yang sama persis — bukan salinan yang bisa bergeser diam-diam.
const {
  PREDIKAT,
  CUM_LAUDE_FULL_LABEL,
  UNCLASSIFIED_PREDIKAT,
} = require('@komet/shared/constants');

/**
 * Menghitung predikat kelulusan berdasarkan nilai IPK.
 * IPK kosong/bukan angka tidak diklasifikasikan (bukan 'Memuaskan').
 *
 * @param {number|string|null} ipk
 * @param {boolean} fullLabel - Apakah menggunakan label lengkap ("Dengan Pujian (Cum Laude)")
 * @returns {string|null} Predikat kelulusan, atau null bila IPK tidak tersedia
 */
function calculatePredikat(ipk, fullLabel = false) {
  const value = Number(ipk);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 3.51) return fullLabel ? CUM_LAUDE_FULL_LABEL : PREDIKAT.CUM_LAUDE;
  if (value >= 3.01) return PREDIKAT.SANGAT_MEMUASKAN;
  return PREDIKAT.MEMUASKAN;
}

/** Kunci yang selalu tersedia untuk agregasi predikat (termasuk label tanpa IPK). */
const PREDIKAT_LABELS = [...Object.values(PREDIKAT), UNCLASSIFIED_PREDIKAT];

/** Menghitung jumlah lulusan per predikat dengan kunci dari `PREDIKAT_LABELS`. */
function countByPredikat(rows, getIpk = (row) => row.ipk) {
  const counts = Object.fromEntries(PREDIKAT_LABELS.map((label) => [label, 0]));
  rows.forEach((row) => {
    const label = calculatePredikat(getIpk(row)) ?? UNCLASSIFIED_PREDIKAT;
    counts[label] = (counts[label] || 0) + 1;
  });
  return counts;
}

module.exports = {
  PREDIKAT,
  PREDIKAT_LABELS,
  CUM_LAUDE_FULL_LABEL,
  UNCLASSIFIED_PREDIKAT,
  calculatePredikat,
  countByPredikat,
};
