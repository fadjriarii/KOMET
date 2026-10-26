import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getAvgIpk, getIpkOverview } = require('../../../src/services/graduates/ipkTrend');
const { getGraduateDistribution } = require('../../../src/services/graduates/graduateDistribution');

const originalFindMany = prisma.student.findMany;

afterAll(() => {
  prisma.student.findMany = originalFindMany;
});

const ROWS = [
  {
    jenjang: 'S1',
    programStudi: 'Informatika',
    fakultas: 'FST',
    graduate: { tahunLulus: '2021/2022', ipk: 3.0, predikatLulus: 'Memuaskan' },
  },
  {
    jenjang: 'S1',
    programStudi: 'Informatika',
    fakultas: 'FST',
    graduate: { tahunLulus: '2023/2024', ipk: 4.0, predikatLulus: 'Cum Laude' },
  },
  {
    jenjang: 'S1',
    programStudi: 'Informatika',
    fakultas: 'FST',
    graduate: { tahunLulus: '', ipk: 2.5, predikatLulus: '' },
  },
];

const matchesTahun = (row, filter) => {
  if (!filter) return true;
  if (filter.in) return filter.in.includes(row.graduate.tahunLulus);
  if (filter.not === '' && row.graduate.tahunLulus === '') return false;
  if (filter.lte) return row.graduate.tahunLulus <= filter.lte;
  return true;
};

function stubRows() {
  prisma.student.findMany = vi.fn(async ({ where }) =>
    ROWS.filter((row) => matchesTahun(row, where?.graduate?.tahunLulus)),
  );
}

describe('scope tahun ajaran untuk IPK dan distribusi', () => {
  it('IPK kartu memakai jangkar kumulatif dan membuang tahun kosong', async () => {
    stubRows();
    const result = await getAvgIpk({
      tahunAjaran: '2022/2023',
      jenjang: { in: ['S1'] },
    });

    expect(result.s1).toEqual({ average: 3, count: 1 });
    expect(result.tahunScope.phrase).toBe('sampai tahun ajaran 2022/2023');
  });

  it('rincian IPK (prodi/fakultas/band) memakai jangkar yang sama', async () => {
    stubRows();
    const result = await getIpkOverview({ tahunAjaran: '2022/2023' });

    expect(result.prodiGpaData).toEqual([{ name: 'Informatika', gpaValue: 3, count: 1 }]);
    expect(result.facultyGpaData).toEqual([{ name: 'FST', gpaValue: 3, count: 1 }]);
    expect(result.gpaBandsData.find((band) => band.range === '2.75 - 3.00').count).toBe(1);
    expect(result.gpaBandsData.find((band) => band.range === '3.76 - 4.00').count).toBe(0);
  });

  it('distribusi predikat memakai jangkar yang sama', async () => {
    stubRows();
    const result = await getGraduateDistribution({ tahunAjaran: '2022/2023' });

    expect(result.total).toBe(1);
    expect(result.byPredikat).toContainEqual({ name: 'Memuaskan', count: 1, percentage: 100 });
    // Kategori kosong tidak dikirim: jumlah item = kategori berdata.
    expect(result.byPredikat.find((item) => item.name === 'Cum Laude')).toBeUndefined();
    expect(result.byProdi).toEqual([{ name: 'Informatika', count: 1, percentage: 100 }]);
    expect(result.byFaculty).toEqual([{ name: 'FST', count: 1, percentage: 100 }]);
  });
});
