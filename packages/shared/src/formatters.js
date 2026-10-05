/**
 * @komet/shared - Shared formatting utilities.
 *
 * formatNumber exists in both frontend (uiHelpers.js) and backend (formatUtils.js).
 * This is the single source of truth.
 */

/**
 * Format a numeric value for presentation in Indonesian locale.
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format a value as percentage string.
 * @param {number|string|null|undefined} value
 * @param {number} fractionDigits
 * @param {string} fallback
 * @returns {string}
 */
export function formatPercentage(value, fractionDigits = 1, fallback = '-') {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(fractionDigits)}%` : fallback;
}
