/**
 * Ambang IPK predikat — satu-satunya sumber angka 3.51/3.01. Dipakai
 * `calculatePredikat` dan filter predikat (rentang Prisma) supaya tidak
 * ada dua salinan yang bisa bergeser diam-diam.
 */
const IPK_THRESHOLD_CUM_LAUDE = 3.51;
const IPK_THRESHOLD_SANGAT_MEMUASKAN = 3.01;

/**
 * graduateUtils.js
 *
 * Helper utilitas untuk domain lulusan (Graduates).
 */

// Label hidup di @komet/shared agar client yang memwarnai badge memakai string
// yang sama persis — bukan salinan yang bisa bergeser diam-diam.
const { PREDIKAT, UNCLASSIFIED_PREDIKAT } = require('@komet/shared/constants');

/**
 * Menghitung predikat kelulusan berdasarkan nilai IPK. IPK kosong/bukan angka
 * tidak diklasifikasikan (bukan 'Memuaskan'). Ini jalur cadangan: baris yang
 * sudah disinkron ulang membawa label resmi dari SK yudisium.
 *
 * @param {number|string|null} ipk
 * @returns {string|null} Predikat kelulusan, atau null bila IPK tidak tersedia
 */
function calculatePredikat(ipk) {
  const value = Number(ipk);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= IPK_THRESHOLD_CUM_LAUDE) return PREDIKAT.CUM_LAUDE;
  if (value >= IPK_THRESHOLD_SANGAT_MEMUASKAN) return PREDIKAT.SANGAT_MEMUASKAN;
  return PREDIKAT.MEMUASKAN;
}

/** Kunci yang selalu tersedia untuk agregasi predikat (termasuk label tanpa IPK). */
const PREDIKAT_LABELS = [...Object.values(PREDIKAT), UNCLASSIFIED_PREDIKAT];

/** Menghitung jumlah lulusan per predikat dengan kunci dari `PREDIKAT_LABELS`. */
function countByPredikat(rows, getIpk = (row) => row.ipk) {
  const counts = Object.fromEntries(PREDIKAT_LABELS.map((label) => [label, 0]));
  rows.forEach((row) => {
    const label = row.predikatLulus || calculatePredikat(getIpk(row)) || UNCLASSIFIED_PREDIKAT;
    counts[label] = (counts[label] || 0) + 1;
  });
  return counts;
}

module.exports = {
  PREDIKAT,
  PREDIKAT_LABELS,
  UNCLASSIFIED_PREDIKAT,
  IPK_THRESHOLD_CUM_LAUDE,
  IPK_THRESHOLD_SANGAT_MEMUASKAN,
  calculatePredikat,
  countByPredikat,
};
