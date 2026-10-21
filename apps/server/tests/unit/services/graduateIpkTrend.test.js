import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getIpkByYear } = require('../../../src/services/graduates/ipkTrend');

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

function stubFindMany(years = YEARS) {
  const rows = [];
  for (const tahunLulus of years) {
    rows.push({ jenjang: 'S1', graduate: { tahunLulus, ipk: 3.1 } });
    if (tahunLulus === years.at(-1)) {
      rows.push({ jenjang: 'Profesi', graduate: { tahunLulus, ipk: 3.8 } });
    }
  }
  prisma.student.findMany = vi.fn(async () => rows);
}

describe('tren IPK 5 tahun', () => {
  it('tanpa pilihan tahun = 5 label terbaru', async () => {
    stubFindMany();
    const byYear = await getIpkByYear({});

    expect(byYear.map((row) => row.tahun)).toEqual(YEARS.slice(-5));
    expect(byYear.every((row) => row.s1AvgIpk === 3.1)).toBe(true);
    expect(byYear.at(-1).profesiAvgIpk).toBe(3.8);
  });

  it('jangkar tahun ajaran menggeser jendela 5 tahun ke belakang', async () => {
    stubFindMany();
    const byYear = await getIpkByYear({ tahunAjaran: '2023/2024' });

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
    const byYear = await getIpkByYear({ graduate: { tahunLulus: { in: picked } } });

    expect(byYear.map((row) => row.tahun)).toEqual(picked);
  });

  it('tahun lulusan baru menggeser jendela dan membuang tahun terlama', async () => {
    stubFindMany();
    const first = await getIpkByYear({});
    expect(first.map((row) => row.tahun)).toEqual(YEARS.slice(-5));

    const withNewYear = [...YEARS, '2026/2027'];
    stubFindMany(withNewYear);
    const shifted = await getIpkByYear({});

    expect(shifted.map((row) => row.tahun)).toEqual(withNewYear.slice(-5));
    expect(shifted[0].tahun).toBe('2022/2023');
  });
});
