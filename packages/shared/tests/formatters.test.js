import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatDecimal,
  formatNumber,
  formatPercentage,
  formatSignedPercentage,
} from '../src/formatters.js';

describe('formatNumber', () => {
  it('memakai pemisah ribuan locale Indonesia', () => {
    expect(formatNumber(12345)).toBe('12.345');
    expect(formatNumber(2059)).toBe('2.059');
    expect(formatNumber(0)).toBe('0');
  });

  it('membedakan "tidak ada data" dari nol', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
    expect(formatNumber(NaN)).toBe('-');
    expect(formatNumber('')).toBe('-');
    expect(formatNumber('bukan angka')).toBe('-');
    expect(formatNumber('1234')).toBe('1.234');
  });
});

describe('formatPercentage', () => {
  it('membulatkan ke digit yang diminta', () => {
    expect(formatPercentage(98.483)).toBe('98.5%');
    expect(formatPercentage(98.483, 2)).toBe('98.48%');
    expect(formatPercentage(20)).toBe('20.0%');
    expect(formatPercentage('14.25', 1)).toBe('14.3%');
  });

  it('jatuh ke fallback hanya untuk nilai non-finis', () => {
    expect(formatPercentage(null)).toBe('-');
    expect(formatPercentage(undefined, 1, 'n/a')).toBe('n/a');
    expect(formatPercentage(0)).toBe('0.0%');
  });
});

describe('formatSignedPercentage / formatDecimal / formatCompactNumber', () => {
  it('menandai arah perubahan dan membulat sesuai digit', () => {
    expect(formatSignedPercentage(12.44)).toBe('+12.4%');
    expect(formatSignedPercentage(-3.1)).toBe('-3.1%');
    expect(formatSignedPercentage(0)).toBe('+0.0%');
    expect(formatDecimal(3.614)).toBe('3.61');
    expect(formatDecimal(3.614, 1)).toBe('3.6');
    expect(formatCompactNumber(1200)).toBe('1.2k');
    expect(formatCompactNumber(2000)).toBe('2k');
    expect(formatCompactNumber(999)).toBe(999);
  });

  it('"tidak ada data" tidak pernah diratakan menjadi 0', () => {
    for (const format of [
      formatNumber,
      formatPercentage,
      formatSignedPercentage,
      formatDecimal,
      formatCompactNumber,
    ]) {
      expect(format(null)).toBe('-');
      expect(format(undefined)).toBe('-');
      expect(format('')).toBe('-');
    }
  });
});
