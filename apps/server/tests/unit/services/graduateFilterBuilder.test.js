import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildGraduateFilter,
  getRequestedJenjang,
  includesJenjang,
} = require('../../../src/services/graduates/filterBuilder');

describe('graduate filter builder', () => {
  it('turns repeated faculty and jenjang query values into Prisma in filters', () => {
    const where = buildGraduateFilter({
      fakultas: ['FIK', 'FEB'],
      jenjang: ['S1', 'S2'],
      programStudi: ['Informatika', 'Akuntansi'],
    });

    expect(where.jenjang).toEqual({ in: ['S1', 'S2'] });
    expect(where.student).toEqual({
      fakultas: { in: ['FIK', 'FEB'] },
      programStudi: { in: ['Informatika', 'Akuntansi'] },
    });
  });

  it('membaca bentuk `{ in: [...] }`, bukan hanya string', () => {
    // Bentuk asli dari buildGraduateFilter(); perbandingan string terhadapnya
    // selalu false dan membuat kedua jenjang dihitung dari populasi yang sama.
    expect(getRequestedJenjang(buildGraduateFilter({ jenjang: 'S2' }))).toEqual(['S2']);
    expect(getRequestedJenjang(buildGraduateFilter({ jenjang: ['S2', 'S1'] }))).toEqual([
      'S2',
      'S1',
    ]);
    expect(includesJenjang(buildGraduateFilter({ jenjang: 'S2' }), 'S1')).toBe(false);
    expect(includesJenjang(buildGraduateFilter({ jenjang: 'S2' }), 'S2')).toBe(true);
  });

  it('tanpa filter jenjang, kedua level diminta', () => {
    expect(getRequestedJenjang({})).toEqual(['S1', 'S2']);
    expect(getRequestedJenjang(buildGraduateFilter({}))).toEqual(['S1', 'S2']);
    // Nilai tak dikenal tidak boleh meloloskan level apa pun secara diam-diam.
    expect(getRequestedJenjang({ jenjang: 'D3' })).toEqual(['S1', 'S2']);
  });
});
