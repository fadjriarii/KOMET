import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
} = require('../../../src/services/graduates/keberhasilanStudi');

const originalGroupBy = prisma.student.groupBy;
const originalFindMany = prisma.student.findMany;
const originalAggregate = prisma.graduate.aggregate;

afterAll(() => {
  prisma.student.groupBy = originalGroupBy;
  prisma.student.findMany = originalFindMany;
  prisma.graduate.aggregate = originalAggregate;
});

// Ref 2025/2026 → lag S1 = 8 → 2017. Penyebut lewat groupBy angkatan,
// pembilang lewat findMany (lulusan dalam ≤ 16 semester); bukti tutup lewat
// groupBy angkatan × status.
function stubAll({ closureRows, cohortRows, jenjangs = ['S1'] }) {
  prisma.graduate.aggregate = async () => ({ _max: { tahunLulus: '2025/2026' } });
  const inList = (where, row) => {
    const list = (where.AND || []).find((clause) => clause.angkatan)?.angkatan?.in;
    return !list || list.includes(row.angkatan);
  };
  prisma.student.groupBy = vi.fn(async (args) => {
    if (args.by.length === 1 && args.by[0] === 'jenjang')
      return jenjangs.map((jenjang) => ({ jenjang }));
    if (args.by.includes('statusKeaktifan')) return closureRows;
    const groups = new Map();
    for (const row of cohortRows.filter((item) => inList(args.where, item))) {
      const group = groups.get(row.angkatan) || { angkatan: row.angkatan, _count: { angkatan: 0 } };
      group._count.angkatan += 1;
      groups.set(row.angkatan, group);
    }
    return [...groups.values()];
  });
  prisma.student.findMany = vi.fn(async ({ where }) =>
    cohortRows.filter((row) => row.graduate && inList(where, row)),
  );
}

const rows2019 = [
  ...Array.from({ length: 7 }, () => ({
    periodeMasuk: '20191',
    angkatan: '2019/2020',
    statusKeaktifan: 'Lulus',
    graduate: { periodeWisuda: '20232' },
  })),
  ...Array.from({ length: 3 }, () => ({
    periodeMasuk: '20192',
    angkatan: '2019/2020',
    statusKeaktifan: 'Drop Out / Dikeluarkan',
    graduate: null,
  })),
];

const closed2019 = [
  { jenjang: 'S1', angkatan: '2019/2020', statusKeaktifan: 'Lulus', _count: { angkatan: 7 } },
  { jenjang: 'S1', angkatan: '2020/2021', statusKeaktifan: 'Aktif', _count: { angkatan: 2 } },
];

describe('evaluasi mengikuti bukti tutup, lag sebagai batas bawah', () => {
  it('angkatan terbaru yang nol enrolled naik jadi evaluasi (2019, bukan lag 2017)', async () => {
    stubAll({ closureRows: closed2019, cohortRows: rows2019 });

    const card = await getKeberhasilanStudi({});
    expect(card.s1).toBe(70);
    expect(card.angkatanS1).toBe('2019/2020');

    const detail = await getKeberhasilanStudiByAngkatan({});
    expect(detail.angkatanEvaluasiS1).toBe('2019/2020');
    expect(detail.s1).toHaveLength(5);
    expect(detail.s1.at(-1)).toMatchObject({
      cohortLabel: 'Angkatan 2019/2020',
      intake: 10,
      successCount: 7,
      rate: 70,
    });
  });

  it('kohort yang masih ada Aktif-nya tidak naik (tahan di lag)', async () => {
    stubAll({
      closureRows: [
        { jenjang: 'S1', angkatan: '2019/2020', statusKeaktifan: 'Aktif', _count: { angkatan: 2 } },
      ],
      cohortRows: rows2019,
    });

    const card = await getKeberhasilanStudi({});
    expect(card.angkatanS1).toBe('2017/2018');
  });

  it('jangkar tahunAjaran mematikan promosi (tampilan sampai tahun X)', async () => {
    stubAll({ closureRows: closed2019, cohortRows: rows2019 });

    const card = await getKeberhasilanStudi({ tahunAjaran: '2020/2021' });
    expect(card.angkatanS1).toBe('2012/2013');
  });
});
