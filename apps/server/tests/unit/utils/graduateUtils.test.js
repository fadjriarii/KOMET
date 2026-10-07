import { describe, it, expect } from 'vitest';
const {
  calculatePredikat,
  countByPredikat,
  PREDIKAT_LABELS,
  UNCLASSIFIED_PREDIKAT,
} = require('../../../src/utils/graduateUtils');

describe('graduateUtils', () => {
  it('calculatePredikat harus mengembalikan "Cum Laude" untuk IPK >= 3.51', () => {
    expect(calculatePredikat(3.8)).toBe('Cum Laude');
    expect(calculatePredikat(3.8, true)).toBe('Dengan Pujian (Cum Laude)');
  });

  it('calculatePredikat harus mengembalikan "Sangat Memuaskan" untuk IPK 3.01 - 3.50', () => {
    expect(calculatePredikat(3.2)).toBe('Sangat Memuaskan');
  });

  it('calculatePredikat harus mengembalikan "Memuaskan" untuk IPK < 3.01', () => {
    expect(calculatePredikat(2.9)).toBe('Memuaskan');
  });

  it('IPK kosong tidak terklasifikasi, bukan "Memuaskan"', () => {
    for (const ipk of [null, undefined, '', NaN, 0]) {
      expect(calculatePredikat(ipk)).toBeNull();
    }
  });

  it('setiap label yang bisa dihasilkan calculatePredikat punya kunci agregasi', () => {
    const samples = [null, 0, 1.2, 2.5, 3.0, 3.01, 3.2, 3.5, 3.51, 4, '3.9', undefined];
    const produced = samples.map((ipk) => calculatePredikat(ipk) ?? UNCLASSIFIED_PREDIKAT);
    for (const label of produced) {
      expect(PREDIKAT_LABELS).toContain(label);
    }
  });

  it('setiap kunci ter-seed benar-benar dapat ditulis', () => {
    const counts = countByPredikat([{ ipk: 3.8 }, { ipk: 3.2 }, { ipk: 2.9 }, { ipk: null }]);
    expect(Object.keys(counts).sort()).toEqual([...PREDIKAT_LABELS].sort());
    for (const label of PREDIKAT_LABELS) {
      expect(counts[label]).toBeGreaterThan(0);
    }
  });
});
