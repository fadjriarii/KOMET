import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  getTepatWaktu,
  getTepatWaktuByYear,
} = require('../../../src/services/graduates/tepatWaktu');

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
  let filtered = rowsToFilter;
  const angkatan = where?.angkatan;
  if (angkatan) {
    const labels = angkatan.in ?? (Array.isArray(angkatan) ? angkatan : [angkatan]);
    filtered = filtered.filter((item) => labels.includes(item.angkatan));
  }
  const scope = where?.graduate?.tahunLulus;
  if (!scope) return filtered;
  if (scope.lte) {
    return filtered.filter((item) => item.graduate.tahunLulus <= scope.lte);
  }
  const labels = scope.in ?? (Array.isArray(scope) ? scope : [scope]);
  return filtered.filter((item) => labels.includes(item.graduate.tahunLulus));
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

  it('Profesi yang selesai di tahun ajaran yang sama dihitung tepat waktu', async () => {
    stub([row('Profesi', '2025/2026', 0)]);
    const detail = await getTepatWaktuByYear({});

    expect(detail.profesi[0]).toMatchObject({
      fastCount: 0,
      onTimeCount: 1,
      lateCount: 0,
      rate: 100,
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

  it('kartu menyebut jangkar tahun ajaran sebagai batas kumulatif', async () => {
    stub(defaultRows());
    const card = await getTepatWaktu({
      tahunAjaran: '2023/2024',
      jenjang: { in: ['S1'] },
    });

    expect(card.s1).toBe(100);
    expect(card.tahunScope).toMatchObject({
      label: '2023/2024',
      phrase: 'sampai tahun ajaran 2023/2024',
    });
  });

  it('pilihan tahun eksplisit tetap menang atas jangkar', async () => {
    stub(defaultRows());
    const card = await getTepatWaktu({
      tahunAjaran: '2023/2024',
      jenjang: { in: ['S1'] },
      graduate: { tahunLulus: { in: ['2025/2026'] } },
    });

    expect(card.tahunScope.phrase).toBe('pada tahun ajaran 2025/2026');
  });

  it('pilihan tahun eksplisit tidak dipotong', async () => {
    stub(defaultRows());
    const picked = YEARS.slice(0, 7);
    const detail = await getTepatWaktuByYear({ graduate: { tahunLulus: { in: picked } } });

    expect(detail.s1.map((item) => item.tahunLulusTepat)).toEqual([
      2018, 2019, 2020, 2021, 2022, 2023, 2024,
    ]);
  });

  it('filter angkatan memakai angkatan riil, bukan tahun lulus', async () => {
    stub([row('S1', '2023/2024', 2), row('S1', '2024/2025', 3), row('S1', '2025/2026', 4)]);
    const detail = await getTepatWaktuByYear({ angkatan: { in: ['2021/2022'] } });

    expect(detail.s1).toEqual([
      expect.objectContaining({
        cohort: 2021,
        cohortLabel: 'Angkatan 2021/2022',
        tahunLulusTepat: 2025,
        fastCount: 2,
        onTimeCount: 1,
        lateCount: 0,
        total: 3,
        rate: 100,
      }),
    ]);
  });

  it('filter tahun lulus menampilkan tiap angkatan riil yang lulus', async () => {
    stub([
      row('S1', '2021/2022', 5),
      row('S1', '2021/2022', 4),
      row('S1', '2021/2022', 3),
      row('S1', '2021/2022', 2),
    ]);
    const detail = await getTepatWaktuByYear({
      graduate: { tahunLulus: { in: ['2021/2022'] } },
    });

    expect(
      detail.s1.map(({ cohortLabel, fastCount, onTimeCount, lateCount }) => ({
        cohortLabel,
        fastCount,
        onTimeCount,
        lateCount,
      })),
    ).toEqual([
      { cohortLabel: 'Angkatan 2016/2017', fastCount: 0, onTimeCount: 0, lateCount: 1 },
      { cohortLabel: 'Angkatan 2017/2018', fastCount: 0, onTimeCount: 1, lateCount: 0 },
      { cohortLabel: 'Angkatan 2018/2019', fastCount: 1, onTimeCount: 0, lateCount: 0 },
      { cohortLabel: 'Angkatan 2019/2020', fastCount: 1, onTimeCount: 0, lateCount: 0 },
    ]);
  });

  it('tanpa filter eksplisit, kohort yang belum mencapai tahun lulus standar disembunyikan', async () => {
    stub([row('S1', '2025/2026', 2), row('S1', '2025/2026', 4)]);
    const detail = await getTepatWaktuByYear({});

    expect(detail.s1.map((item) => item.cohortLabel)).toEqual(['Angkatan 2021/2022']);
  });
});
