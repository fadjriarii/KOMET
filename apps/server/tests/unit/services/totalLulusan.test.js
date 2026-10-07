import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getYearRange } = require('../../../src/utils/academicUtils');
const { getTotalLulusan } = require('../../../src/services/graduates/totalLulusan');
const { buildGraduateFilter } = require('../../../src/services/graduates/filterBuilder');

const originalGroupBy = prisma.graduate.groupBy;
const LEVELS = [
  { jenjang: 'S1', _count: 757 },
  { jenjang: 'S2', _count: 36 },
];

let calls = [];

beforeEach(() => {
  calls = [];
  prisma.graduate.groupBy = vi.fn(async (args) => {
    calls.push(args);
    return LEVELS;
  });
});

afterEach(() => {
  prisma.graduate.groupBy = originalGroupBy;
});

describe('getTotalLulusan', () => {
  it('satu groupBy untuk kedua jenjang', async () => {
    expect(await getTotalLulusan({})).toEqual({ s1: 757, s2: 36 });
    expect(calls).toHaveLength(1);
    expect(calls[0].by).toEqual(['jenjang']);
  });

  it('filter jenjang tidak membuat satu level dihitung dua kali', async () => {
    // Regresi: `whereFilter.jenjang === 'S1'` tidak pernah cocok dengan bentuk
    // `{ in: [...] }`, sehingga `?jenjang=S1` melaporkan 757 untuk S1 DAN S2
    // (totalGraduates 1514 atas data yang sebenarnya 793).
    expect(await getTotalLulusan(buildGraduateFilter({ jenjang: 'S1' }))).toEqual({
      s1: 757,
      s2: null,
    });
  });

  it('jenjang dikeluarkan dari where karena menjadi kunci grouping', async () => {
    await getTotalLulusan({
      ...buildGraduateFilter({ jenjang: 'S2', tahunLulus: '2020' }),
      student: { fakultas: { in: ['FT'] } },
    });

    expect(calls[0].where.jenjang).toBeUndefined();
    expect(calls[0].where.student).toEqual({ fakultas: { in: ['FT'] } });
    // Kartu ini didefinisikan atas jendela 5 tahun; jendela adalah definisi
    // metriknya, bukan filter yang bisa mempersempitnya dari client.
    expect(calls[0].where.tahunLulus).toEqual({ in: getYearRange() });
  });
});
