import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getTepatWaktuByYear } = require('../../../src/services/graduates/tepatWaktu');

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

function row(jenjang, tahunLulus, duration) {
  const start = Number(tahunLulus.slice(0, 4)) - duration;
  return {
    jenjang,
    periodeMasuk: `${start}1`,
    angkatan: `${start}/${start + 1}`,
    graduate: { tahunLulus },
  };
}

const rows = (jenjang, years, duration) => years.map((year) => row(jenjang, year, duration));

function filterByScope(rowsToFilter, where) {
  const scope = where?.graduate?.tahunLulus;
  if (!scope) return rowsToFilter;
  if (scope.lte) {
    return rowsToFilter.filter((item) => item.graduate.tahunLulus <= scope.lte);
  }
  const labels = scope.in ?? (Array.isArray(scope) ? scope : [scope]);
  return rowsToFilter.filter((item) => labels.includes(item.graduate.tahunLulus));
}

function stub(rowsToStub) {
  prisma.student.findMany = vi.fn(async ({ where }) => filterByScope(rowsToStub, where));
}

function defaultRows() {
  return [
    ...rows('S1', YEARS, 4),
    ...rows('S2', YEARS.slice(-3), 2),
    ...rows('Profesi', YEARS.slice(-1), 1),
  ];
}

describe('cohort tepat waktu per jenjang', () => {
  it('label cohort hanya dari tahun jenjang itu sendiri', async () => {
    stub(defaultRows());
    const detail = await getTepatWaktuByYear({});

    expect(detail.s1).toHaveLength(8);
    expect(detail.s2).toHaveLength(3);
    expect(detail.profesi).toHaveLength(1);
    expect(detail.profesi[0]).toMatchObject({
      cohortLabel: 'Angkatan 2024/2025',
      tahunLulusTepat: 2025,
      onTimeCount: 1,
    });
  });

  it('Profesi bertambah satu cohort tiap tahun lulus baru', async () => {
    stub(defaultRows());
    const first = await getTepatWaktuByYear({});
    expect(first.profesi.map((item) => item.tahunLulusTepat)).toEqual([2025]);

    stub([...defaultRows(), row('Profesi', '2026/2027', 1)]);
    const shifted = await getTepatWaktuByYear({});
    expect(shifted.profesi.map((item) => item.tahunLulusTepat)).toEqual([2025, 2026]);
  });

  it('jangkar tahun ajaran memotong cohort dan jenjang tanpa data', async () => {
    stub(defaultRows());
    const detail = await getTepatWaktuByYear({ tahunAjaran: '2023/2024' });

    expect(detail.s1.map((item) => item.tahunLulusTepat)).toEqual([
      2018, 2019, 2020, 2021, 2022, 2023,
    ]);
    expect(detail.profesi).toBeUndefined();
  });

  it('pilihan tahun eksplisit tidak dipotong', async () => {
    stub(defaultRows());
    const picked = YEARS.slice(0, 7);
    const detail = await getTepatWaktuByYear({ graduate: { tahunLulus: { in: picked } } });

    expect(detail.s1.map((item) => item.tahunLulusTepat)).toEqual([
      2018, 2019, 2020, 2021, 2022, 2023, 2024,
    ]);
  });
});
