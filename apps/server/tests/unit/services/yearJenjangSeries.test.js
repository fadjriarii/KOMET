import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getYearRange } = require('../../../src/utils/academicUtils');
const { valuesByYearAndJenjang } = require('../../../src/services/graduates/yearJenjangSeries');
const { getTotalLulusanByYear } = require('../../../src/services/graduates/totalLulusan');

const originalGroupBy = prisma.graduate.groupBy;
const YEARS = getYearRange();

let calls = [];
let rows = [];

beforeEach(() => {
  calls = [];
  // Hanya satu tahun yang punya baris: tahun lain harus tetap muncul di deret.
  rows = [
    { tahunLulus: YEARS[1], jenjang: 'S1', _count: 10, _avg: { ipk: 3.4567 } },
    { tahunLulus: YEARS[1], jenjang: 'S2', _count: 2, _avg: { ipk: null } },
  ];
  prisma.graduate.groupBy = vi.fn(async (args) => {
    calls.push(args);
    return rows;
  });
});

afterEach(() => {
  prisma.graduate.groupBy = originalGroupBy;
});

describe('valuesByYearAndJenjang', () => {
  it('menyerukan jendela tahun dan agregasi pemanggil dalam satu groupBy', async () => {
    await valuesByYearAndJenjang(
      { jenjang: 'S1' },
      {
        aggregate: { _count: true },
        valueOf: (row) => row._count,
        missing: 0,
      },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].by).toEqual(['tahunLulus', 'jenjang']);
    expect(calls[0].where).toEqual({ jenjang: 'S1', tahunLulus: { in: YEARS } });
    expect(calls[0]._count).toBe(true);
  });

  it('mengisi tiap tahun jendela, memakai valueOf dan missing', async () => {
    const series = await valuesByYearAndJenjang(
      {},
      {
        aggregate: { _avg: { ipk: true } },
        valueOf: (row) => (row._avg.ipk === null ? null : parseFloat(row._avg.ipk.toFixed(2))),
        missing: null,
      },
    );

    expect(series.map((entry) => entry.tahun)).toEqual(YEARS);
    expect(series[1]).toEqual({ tahun: YEARS[1], s1: 3.46, s2: null });
    expect(series[0]).toEqual({ tahun: YEARS[0], s1: null, s2: null });
  });
});

describe('getTotalLulusanByYear', () => {
  it('satu deret per tahun dengan total yang sudah dihitung', async () => {
    const missingRows = rows;
    rows = missingRows.map((row) => (row.jenjang === 'S2' ? { ...row, _count: 3 } : row));
    const { byYear } = await getTotalLulusanByYear({});

    expect(byYear).toHaveLength(YEARS.length);
    expect(byYear[1]).toEqual({ tahun: YEARS[1], s1Count: 10, s2Count: 3, total: 13 });
    expect(byYear[0]).toEqual({ tahun: YEARS[0], s1Count: 0, s2Count: 0, total: 0 });
  });
});
