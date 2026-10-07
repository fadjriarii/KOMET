/**
 * Satu sumber aritmetika persentase "share dari suatu populasi".
 *
 * `empty` adalah nilai yang dilaporkan ketika penyebutnya nol dan sengaja
 * ditentukan pemanggil: sebagian metrik menyebutnya 0%, sebagian menyebutnya
 * `null` (metrik tidak tersedia). Menerjemahkan "tidak ada data" menjadi 0%
 * adalah kegagalan yang dilaporkan sebagai hasil ukur.
 */

/** Persentase `numerator` atas `denominator`, tanpa pembulatan. */
function rate(numerator, denominator, empty = 0) {
  return denominator > 0 ? (numerator / denominator) * 100 : empty;
}

/** Persentase `numerator` atas `denominator`, dibulatkan 2 desimal. */
function roundedRate(numerator, denominator, empty = 0) {
  const value = rate(numerator, denominator, null);
  return value === null ? empty : Number(value.toFixed(2));
}

module.exports = { rate, roundedRate };
