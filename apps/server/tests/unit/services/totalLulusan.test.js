import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getTotalLulusan } = require('../../../src/services/graduates/totalLulusan');
const { buildGraduateFilter } = require('../../../src/services/graduates/filterBuilder');

const ALL_SCOPE = {
  labels: [],
  isDefault: true,
  label: 'Semua Tahun',
  phrase: 'di seluruh tahun akademik tercatat',
};

const originalFindMany = prisma.student.findMany;
const originalGroupBy = prisma.student.groupBy;
// Populasi student-base: S1 + S2 + Prof (37 Prof dulu dikunci-out helper lama).
const LEVELS = [
  { jenjang: 'S1', _count: 1046 },
  { jenjang: 'S2', _count: 49 },
  { jenjang: 'Prof', _count: 37 },
];

let calls = [];

beforeEach(() => {
  calls = [];
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push(args);
    return LEVELS;
  });
  prisma.student.findMany = vi.fn(async () => []);
});

afterEach(() => {
  prisma.student.groupBy = originalGroupBy;
  prisma.student.findMany = originalFindMany;
});

describe('getTotalLulusan', () => {
  it('satu groupBy student Lulus untuk semua jenjang termasuk Prof', async () => {
    expect(await getTotalLulusan({})).toEqual({
      s1: 1046,
      s2: 49,
      prof: 37,
      tahunScope: ALL_SCOPE,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].by).toEqual(['jenjang']);
    expect(calls[0].where.statusKeaktifan).toBe('Lulus');
  });

  it('tanpa filter tahun menghitung seluruh populasi, bukan jendela 5 tahun', async () => {
    const result = await getTotalLulusan(buildGraduateFilter({}));

    expect(calls[0].where.graduate).toBeUndefined();
    expect(result.tahunScope).toEqual(ALL_SCOPE);
  });

  it('filter tahunLulus user mempersempit kartu seperti tabel', async () => {
    const result = await getTotalLulusan(buildGraduateFilter({ tahunLulus: '2023/2024' }));

    expect(calls[0].where.graduate).toEqual({ tahunLulus: { in: ['2023/2024'] } });
    expect(result.tahunScope).toEqual({
      labels: ['2023/2024'],
      isDefault: false,
      label: '2023/2024',
      phrase: 'pada tahun ajaran 2023/2024',
    });
  });

  it('filter jenjang tidak membuat satu level dihitung dua kali', async () => {
    expect(await getTotalLulusan(buildGraduateFilter({ jenjang: 'S1' }))).toEqual({
      s1: 1046,
      s2: null,
      tahunScope: ALL_SCOPE,
    });
  });
});
