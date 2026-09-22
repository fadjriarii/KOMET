/**
 * Safe calculation of average number from an array.
 * @param {number[]} arr
 * @returns {number}
 */
export function calculateAverage(arr = []) {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
  return sum / arr.length;
}

/**
 * Calculates percentage with safe division by zero.
 * @param {number} part
 * @param {number} total
 * @param {number} [decimals=1]
 * @returns {string} e.g. "12.5%"
 */
export function calculatePercentage(part, total, decimals = 1) {
  if (!total || total === 0) return '0.0%';
  const val = ((part / total) * 100).toFixed(decimals);
  return `${val}%`;
}

/**
 * Format numbers with thousands separators.
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  const n = Number(num);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}
