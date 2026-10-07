import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { rate, roundedRate } = require('../../../src/utils/percentageUtils');

describe('rate', () => {
  it('memakai 0 sebagai default ketika penyebut kosong', () => {
    expect(rate(1, 0)).toBe(0);
    expect(rate(0, 0)).toBe(0);
  });

  it('membedakan "tidak ada data" dari 0% hanya bila pemanggil memintanya', () => {
    expect(rate(0, 10, null)).toBe(0);
    expect(rate(3, 0, null)).toBeNull();
  });

  it('tidak membulatkan dan tidak menghasilkan NaN/Infinity', () => {
    expect(rate(1, 3)).toBeCloseTo(33.3333333333, 8);
    expect(rate(1, -1)).toBe(0);
    expect(rate(null, undefined)).toBe(0);
  });
});

describe('roundedRate', () => {
  it('membulatkan ke 2 desimal', () => {
    expect(roundedRate(1, 3)).toBe(33.33);
    expect(roundedRate(1, 6)).toBe(16.67);
    expect(roundedRate(42, 200)).toBe(21);
  });

  it('mewarisi semantik penyebut kosong dari rate', () => {
    expect(roundedRate(5, 0)).toBe(0);
    expect(roundedRate(5, 0, null)).toBeNull();
  });
});
