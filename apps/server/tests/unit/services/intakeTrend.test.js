import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  getIntakeYearCounts,
  buildIntakeTrend,
  buildIntakeRow,
} = require('../../../src/services/students/intakeTrend');

const originalGroupBy = prisma.student.groupBy;

/** Baris mentah `groupBy periodeMasuk` — kode periode Sevima "YYYYT". */
function intakeRows(entries) {
  return entries.map(([periodeMasuk, count]) => ({
    periodeMasuk,
    _count: { periodeMasuk: count },
  }));
}

function stubGroupBy(rows) {
  const calls = [];
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push(args);
    return rows;
  });
  return calls;
}

describe('intake year counts', () => {
  it('membaca Ganjil/Genap dari parser periode, bukan dari posisi karakter', async () => {
    const calls = stubGroupBy(
      intakeRows([
        ['20251', 12],
        ['20252', 8],
        ['20241', 20],
        // Data kotor: tidak boleh menghasilkan kunci tahun yang tampak valid.
        ['2025', 5],
        ['202X1', 5],
        ['', 5],
        [null, 5],
      ]),
    );

    const counts = await getIntakeYearCounts({});

    expect(Object.fromEntries(counts)).toEqual({
      '2025/2026': { total: 20, ganjil: 12, genap: 8 },
      '2024/2025': { total: 20, ganjil: 20, genap: 0 },
    });
    // COHORT: status tidak pernah ikut membatasi intake.
    expect(calls[0].where.statusKeaktifan).toBeUndefined();
    expect(JSON.stringify(calls[0].where)).not.toContain('periodeTerakhir');
  });

  it('batas tahun akademik terpilih tetap dipakai saat tahun ajaran dipilih', async () => {
    const calls = stubGroupBy(intakeRows([['20251', 1]]));

    await getIntakeYearCounts({ tahunAjaran: '2025/2026', fakultas: ['FKM'] });

    expect(calls[0].where.AND).toContainEqual({ periodeMasuk: { lte: '20252' } });
    expect(calls[0].where.fakultas).toEqual({ in: ['FKM'] });
  });

  it('pertumbuhan hanya dihitung bila tahun sebelumnya ada di data', () => {
    const counts = new Map([
      ['2021/2022', { total: 10, ganjil: 10, genap: 0 }],
      ['2022/2023', { total: 20, ganjil: 20, genap: 0 }],
      ['2024/2025', { total: 15, ganjil: 15, genap: 0 }],
      ['2025/2026', { total: 12, ganjil: 12, genap: 0 }],
    ]);

    const trend = buildIntakeTrend(counts);

    expect(trend.map((row) => row.tahun)).toEqual([
      '2021/2022',
      '2022/2023',
      '2023/2024',
      '2024/2025',
      '2025/2026',
    ]);
    expect(trend[0].growthPercentage).toBeNull();
    expect(trend[0].isPositive).toBe(true);
    expect(trend[1].growthPercentage).toBe(100);
    // 2023/2024 tidak ada di data: titiknya 0, penurunannya penuh dari tahun
    // sebelumnya yang ADA.
    expect(trend[2]).toMatchObject({ intakeCount: 0, growthPercentage: -100 });
    // 2024/2025: pembanding 2023/2024 tidak ada di data → null, bukan -25%.
    expect(trend[3].growthPercentage).toBeNull();
    expect(trend[4].growthPercentage).toBe(-20);
  });

  it('satu aturan untuk tahun di dalam dan di luar jendela tren', () => {
    const counts = new Map([
      ['2020/2021', { total: 30, ganjil: 30, genap: 0 }],
      ['2019/2020', { total: 25, ganjil: 25, genap: 0 }],
    ]);

    expect(buildIntakeRow('2020/2021', counts)).toEqual({
      tahun: '2020/2021',
      intakeCount: 30,
      ganjil: 30,
      genap: 0,
      growthPercentage: 20,
      isPositive: true,
    });
  });
});

afterAll(() => {
  prisma.student.groupBy = originalGroupBy;
});
