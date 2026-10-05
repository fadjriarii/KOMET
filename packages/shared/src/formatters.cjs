/**
 * @komet/shared - Shared formatting utilities (CJS).
 */

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
}

function formatPercentage(value, fractionDigits = 1, fallback = '-') {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(fractionDigits)}%` : fallback;
}

module.exports = { formatNumber, formatPercentage };
