/**
 * Memformat angka IPK menjadi string dengan dua angka desimal.
 * Mengembalikan tanda dash jika nilai tidak valid.
 * 
 * @param {number|string|null|undefined} value - Nilai IPK
 * @returns {string} String IPK terformat
 */
export const formatGpa = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) {
    return '—';
  }
  return num.toFixed(2);
};
