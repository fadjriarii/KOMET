import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getTahunAjaranLabel,
  tahunAjaranStart,
  withTahunAjaranAnchor,
} = require('../../../src/services/graduates/tahunAjaran');

describe('jangkar tahun ajaran', () => {
  it('label sah saja; selain itu null', () => {
    expect(getTahunAjaranLabel('2024/2025')).toBe('2024/2025');
    expect(getTahunAjaranLabel(' 2024/2025 ')).toBe('2024/2025');
    expect(getTahunAjaranLabel('2024/2026')).toBeNull();
    expect(getTahunAjaranLabel('2024')).toBeNull();
    expect(getTahunAjaranLabel(null)).toBeNull();
    expect(tahunAjaranStart('2024/2025')).toBe(2024);
  });

  it('jangkar = lulus sampai tahun ajaran itu, meta `tahunAjaran` dibuang', () => {
    const where = withTahunAjaranAnchor({ NOT: { graduate: null }, tahunAjaran: '2024/2025' });
    expect(where.tahunAjaran).toBeUndefined();
    expect(where.NOT).toEqual({ graduate: null });
    expect(where.graduate.tahunLulus).toEqual({ lte: '2024/2025', not: '' });
  });

  it('filter tahunLulus eksplisit menang atas jangkar', () => {
    const where = withTahunAjaranAnchor({
      tahunAjaran: '2024/2025',
      graduate: { tahunLulus: { in: ['2023/2024'] } },
    });
    expect(where.graduate.tahunLulus).toEqual({ in: ['2023/2024'] });
  });

  it('tanpa jangkar sah, where tetap apa adanya', () => {
    expect(withTahunAjaranAnchor({ tahunAjaran: 'bukan-label' })).toEqual({});
    expect(withTahunAjaranAnchor({ NOT: { graduate: null } })).toEqual({
      NOT: { graduate: null },
    });
  });
});
