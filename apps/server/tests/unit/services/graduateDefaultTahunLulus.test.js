import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { stripDefaultTahunLulus } = require('../../../src/services/graduates/filterOptions');

const where = (tahunLulus) => ({
  NOT: { graduate: null },
  graduate: { tahunLulus: { in: tahunLulus }, periodeWisuda: { endsWith: '1' } },
});

describe('stripDefaultTahunLulus (jendela tren diputuskan server)', () => {
  it('tahun lulus default dibuang dari filter tren, filter graduate lain tetap', () => {
    const result = stripDefaultTahunLulus(where(['2025/2026']), '2025/2026');
    expect(result.graduate).toEqual({ periodeWisuda: { endsWith: '1' } });
    expect(result.NOT).toEqual({ graduate: null });
  });

  it('pilihan eksplisit lain atau beberapa tahun diteruskan apa adanya', () => {
    const other = where(['2022/2023']);
    expect(stripDefaultTahunLulus(other, '2025/2026')).toBe(other);
    const many = where(['2025/2026', '2024/2025']);
    expect(stripDefaultTahunLulus(many, '2025/2026')).toBe(many);
  });

  it('tanpa default yang diketahui tidak mengubah apa pun', () => {
    const value = where(['2025/2026']);
    expect(stripDefaultTahunLulus(value, null)).toBe(value);
  });
});
