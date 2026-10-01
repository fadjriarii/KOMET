/**
 * Centralized trend calculation utilities.
 * 
 * Eliminates DRY violations by providing single source of truth
 * for percentage change and growth calculations used across
 * intakeTrend and declineTrend services.
 */

/**
 * Calculate percentage change between two numeric values.
 * Returns null if previous value is not positive (avoid division by zero).
 * 
 * @param {number} current - The newer/current count value
 * @param {number} previous - The older/previous count value  
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {object|null} { rawGrowth: number, label: string } or null
 */
function calculatePercentageChange(current, previous, decimals = 2) {
  // No valid comparison if previous is not a positive number
  if (previous === undefined || previous === null || previous <= 0) {
    // Only return growth of +100% if we go from zero to some positive number
    if (previous === 0 && current > 0) {
      return { rawGrowth: 1, label: `+${(100).toFixed(decimals)}%` };
    }
    // Otherwise no valid change calculation
    return null;
  }
  
  const rawGrowth = (current - previous) / previous;
  return {
    rawGrowth,
    label: `${rawGrowth >= 0 ? '+' : ''}${(rawGrowth * 100).toFixed(decimals)}%`,
  };
}

module.exports = { calculatePercentageChange };
