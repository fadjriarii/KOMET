/**
 * formatters.js - Kumpulan fungsi formatting visualisasi data
 */

/** Format angka dengan pemisah ribuan (e.g., 12.345) */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

/** Format persentase (e.g., 85.5%) */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${Number(value).toFixed(decimals)}%`;
}

/** Format IPK (e.g., 3.65) */
export function formatGPA(gpa) {
  if (gpa === null || gpa === undefined || isNaN(gpa)) return '-';
  return Number(gpa).toFixed(2);
}

/** Format tanggal standar Indonesia (e.g., 23 September 2026) */
export function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
