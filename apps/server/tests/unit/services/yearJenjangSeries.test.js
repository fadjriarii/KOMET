import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getLabelYearRange, getReferenceYear } = require('../../../src/utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { valuesByYearAndJenjang } = require('../../../src/services/graduates/yearJenjangSeries');
const { getTotalLulusanByYear } = require('../../../src/services/graduates/totalLulusan');

const originalFindMany = prisma.student.findMany;
const originalGraduateAggregate = prisma.graduate.aggregate;
const REF_LABEL = formatAcademicYearLabel(getReferenceYear());
const YEARS = getLabelYearRange(REF_LABEL);

let calls = [];
let students = [];

const toRows = () =>
  students.map((s) => ({ jenjang: s.jenjang, graduate: { tahunLulus: s.tahunLulus, ipk: s.ipk } }));

beforeEach(() => {
  calls = [];
  // Satu tahun punya data S2/Prof; S1 punya satu baris per tahun supaya deret
  // data-driven mencakup seluruh YEARS (seperti populasi nyata).
  students = [
    ...YEARS.map((tahunLulus, index) => ({
      jenjang: 'S1',
      tahunLulus,
      ipk: index === 1 ? 3.4567 : null,
    })),
    { jenjang: 'S2', tahunLulus: YEARS[1], ipk: null },
    { jenjang: 'Prof', tahunLulus: YEARS[1], ipk: 3.8 },
  ];
  prisma.graduate.aggregate = vi.fn(async () => ({ _max: { tahunLulus: REF_LABEL } }));
  prisma.student.findMany = vi.fn(async (args) => {
    calls.push(args);
    // Mock menghormati scope tahun seperti query nyata (where.graduate).
    const scope = args.where?.graduate?.tahunLulus?.in;
    const rows = toRows();
    return scope ? rows.filter((row) => scope.includes(row.graduate?.tahunLulus)) : rows;
  });
});

afterEach(() => {
  prisma.student.findMany = originalFindMany;
  prisma.graduate.aggregate = originalGraduateAggregate;
});

describe('valuesByYearAndJenjang', () => {
  it('tanpa filter tahun deret memuat seluruh tahun populasi', async () => {
    const series = await valuesByYearAndJenjang(
      { statusKeaktifan: 'Lulus', jenjang: { in: ['S1'] } },
      {
        valueOf: ({ items }) => items.length,
        missing: 0,
      },
    );

    expect(calls[0].where.statusKeaktifan).toBe('Lulus');
    expect(calls[0].where.graduate).toBeUndefined();
    expect(series.map((entry) => entry.tahun)).toEqual(YEARS);
  });

  it('mengisi tiap tahun, memakai valueOf dan missing', async () => {
    const series = await valuesByYearAndJenjang(
      {},
      {
        valueOf: ({ items }) => {
          const avg = items[0]?.graduate?.ipk;
          return avg === null || avg === undefined ? null : parseFloat(avg.toFixed(2));
        },
        missing: null,
      },
    );

    expect(series.map((entry) => entry.tahun)).toEqual(YEARS);
    expect(series[1]).toEqual({ tahun: YEARS[1], s1: 3.46, s2: null, prof: 3.8 });
    expect(series[0]).toEqual({ tahun: YEARS[0], s1: null, s2: null, prof: null });
  });

  it('filter tahunLulus user menang: deret hanya memuat tahun pilihan', async () => {
    const series = await valuesByYearAndJenjang(
      { statusKeaktifan: 'Lulus', graduate: { tahunLulus: { in: ['2023/2024'] } } },
      {
        valueOf: ({ items }) => items.length,
        missing: 0,
      },
    );

    expect(calls[0].where.graduate).toEqual({ tahunLulus: { in: ['2023/2024'] } });
    // Deret hanya memuat tahun pilihan; jenjang dinamis dari data dalam scope.
    expect(series).toHaveLength(1);
    expect(series[0].tahun).toBe('2023/2024');
    expect(Object.values(series[0]).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0)).toBe(
      YEARS.includes('2023/2024') ? 1 : 0,
    );
  });
});

describe('getTotalLulusanByYear', () => {
  it('satu deret per tahun dengan total yang sudah dihitung', async () => {
    const { byYear } = await getTotalLulusanByYear({});

    expect(byYear).toHaveLength(YEARS.length);
    expect(byYear[1]).toEqual({
      tahun: YEARS[1],
      s1Count: 1,
      s2Count: 1,
      profCount: 1,
      total: 3,
    });
    // S1 punya satu baris tiap tahun; S2/Prof hanya di YEARS[1].
    expect(byYear[0]).toEqual({
      tahun: YEARS[0],
      s1Count: 1,
      s2Count: 0,
      profCount: 0,
      total: 1,
    });
  });
});
