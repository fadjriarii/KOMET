import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { calculateAverageChange } = require('../../../src/services/students/declineTrend');

describe('decline trend calculation', () => {
  it('returns a negative average when the latest intake declines', () => {
    expect(calculateAverageChange([11, 19, 22, 24, 20])).toBe(-11.02);
  });

  it('returns null when no valid year-over-year comparison is available', () => {
    expect(calculateAverageChange([0, 0, 0, 0, 0])).toBeNull();
  });
});
