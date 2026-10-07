/**
 * @komet/shared — Satu-satunya sumber formatter angka untuk kedua app.
 * Jangan tambah salinan `format*` di `apps/*`.
 *
 * Aturan yang sama di semua fungsi di file ini: `null`/`undefined`/`''`
 * berarti "tidak ada data" dan dikembalikan sebagai `fallback`, BUKAN 0.
 * `Number(null)` justru 0, jadi ketiganya harus dicegah sebelum konversi —
 * inilah alasan card "belum ada data" pernah tampil sebagai "0%".
 */

const NO_DATA = '-';

const isBlank = (value) => value === null || value === undefined || value === '';

/** Angka untuk sumbu/badge: locale Indonesia, pemisah ribuan. */
export function formatNumber(value) {
  if (isBlank(value) || Number.isNaN(Number(value))) return NO_DATA;
  return new Intl.NumberFormat('id-ID').format(value);
}

/** Persentase dengan digit tetap, mis. `98.5%`. */
export function formatPercentage(value, fractionDigits = 1, fallback = NO_DATA) {
  if (isBlank(value)) return fallback;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(fractionDigits)}%` : fallback;
}

/** Persentase perubahan, selalu bertanda: `+12.4%` / `-3.1%`. */
export function formatSignedPercentage(value, fractionDigits = 1, fallback = NO_DATA) {
  if (isBlank(value)) return fallback;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return `${numericValue >= 0 ? '+' : ''}${numericValue.toFixed(fractionDigits)}%`;
}

/** Angka tetap tanpa simbol, mis. IPK `3.61`. */
export function formatDecimal(value, fractionDigits = 2, fallback = NO_DATA) {
  if (isBlank(value)) return fallback;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(fractionDigits) : fallback;
}

/** Angka padat untuk tick grafik: `1200` → `1.2k`. */
export function formatCompactNumber(value, fallback = NO_DATA) {
  if (isBlank(value)) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number >= 1000 ? `${(number / 1000).toFixed(number % 1000 === 0 ? 0 : 1)}k` : number;
}
