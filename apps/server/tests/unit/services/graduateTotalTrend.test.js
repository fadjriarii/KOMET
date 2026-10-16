import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getTotalLulusanByYear } = require('../../../src/services/graduates/totalLulusan');

const originalFindMany = prisma.student.findMany;

afterAll(() => {
  prisma.student.findMany = originalFindMany;
});

const YEARS = [
  '2018/2019',
  '2019/2020',
  '2020/2021',
  '2021/2022',
  '2022/2023',
  '2023/2024',
  '2024/2025',
  '2025/2026',
];

function stubFindMany() {
  const rows = [];
  for (const tahunLulus of YEARS) {
    for (let i = 0; i < 10; i += 1) rows.push({ jenjang: 'S1', graduate: { tahunLulus } });
    for (let i = 0; i < 5; i += 1) rows.push({ jenjang: 'S2', graduate: { tahunLulus } });
    for (let i = 0; i < 3; i += 1) rows.push({ jenjang: 'Profesi', graduate: { tahunLulus } });
  }
  prisma.student.findMany = vi.fn(async () => rows);
}

describe('tren total lulusan 5 tahun', () => {
  it('tanpa pilihan tahun = 5 label terbaru', async () => {
    stubFindMany();
    const { byYear } = await getTotalLulusanByYear({});

    expect(byYear.map((row) => row.tahun)).toEqual(YEARS.slice(-5));
    for (const row of byYear) {
      expect(row).toMatchObject({ s1Count: 10, s2Count: 5, profesiCount: 3, total: 18 });
    }
  });

  it('jangkar tahun ajaran menggeser jendela 5 tahun ke belakang', async () => {
    stubFindMany();
    const { byYear } = await getTotalLulusanByYear({ tahunAjaran: '2023/2024' });

    expect(byYear.map((row) => row.tahun)).toEqual([
      '2019/2020',
      '2020/2021',
      '2021/2022',
      '2022/2023',
      '2023/2024',
    ]);
  });

  it('pilihan tahun eksplisit menang apa adanya (tanpa potong 5)', async () => {
    stubFindMany();
    const picked = YEARS.slice(0, 7);
    const { byYear } = await getTotalLulusanByYear({ graduate: { tahunLulus: { in: picked } } });

    expect(byYear.map((row) => row.tahun)).toEqual(picked);
  });

  it('jangkar invalid = fallback 5 terbaru seperti tanpa jangkar', async () => {
    stubFindMany();
    const { byYear } = await getTotalLulusanByYear({ tahunAjaran: 'bogus' });

    expect(byYear.map((row) => row.tahun)).toEqual(YEARS.slice(-5));
  });
});
