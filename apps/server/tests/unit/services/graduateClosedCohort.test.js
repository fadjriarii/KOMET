import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
} = require('../../../src/services/graduates/keberhasilanStudi');

const originalGroupBy = prisma.student.groupBy;
const originalAggregate = prisma.graduate.aggregate;

afterAll(() => {
  prisma.student.groupBy = originalGroupBy;
  prisma.graduate.aggregate = originalAggregate;
});

// Ref 2025/2026 → lag S1 = 2018. Baris kohort memakai periodeMasuk +
// angkatan + status, supaya stub kohort dan stub bukti-tutup sama-sama jalan.
function stubAll({ closureRows, cohortRows, jenjangs = ['S1'] }) {
  prisma.graduate.aggregate = async () => ({ _max: { tahunLulus: '2025/2026' } });
  prisma.student.groupBy = vi.fn(async (args) => {
    if (args.by.length === 1 && args.by[0] === 'jenjang')
      return jenjangs.map((jenjang) => ({ jenjang }));
    if (args.by.includes('statusKeaktifan')) return closureRows;
    const { NOT } = args.where;
    let matched = cohortRows.filter((row) => (NOT ? row.graduate : true));
    if (args.where.periodeMasuk) {
      const { gte, lt } = args.where.periodeMasuk;
      matched = matched.filter((row) => row.periodeMasuk >= gte && row.periodeMasuk < lt);
    }
    const groups = new Map();
    for (const row of matched) {
      const group = groups.get(row.periodeMasuk) || {
        periodeMasuk: row.periodeMasuk,
        _count: { periodeMasuk: 0 },
      };
      group._count.periodeMasuk += 1;
      groups.set(row.periodeMasuk, group);
    }
    return [...groups.values()];
  });
}

const rows2019 = [
  ...Array.from({ length: 7 }, () => ({
    periodeMasuk: '20191',
    angkatan: '2019/2020',
    statusKeaktifan: 'Lulus',
    graduate: true,
  })),
  ...Array.from({ length: 3 }, () => ({
    periodeMasuk: '20192',
    angkatan: '2019/2020',
    statusKeaktifan: 'Drop Out / Dikeluarkan',
    graduate: false,
  })),
];

const closed2019 = [
  { jenjang: 'S1', angkatan: '2019/2020', statusKeaktifan: 'Lulus', _count: { angkatan: 7 } },
  { jenjang: 'S1', angkatan: '2020/2021', statusKeaktifan: 'Aktif', _count: { angkatan: 2 } },
];

describe('evaluasi mengikuti bukti tutup, lag sebagai batas bawah', () => {
  it('angkatan terbaru yang nol enrolled naik jadi evaluasi (2019, bukan lag 2018)', async () => {
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
    expect(card.angkatanS1).toBe('2018/2019');
  });

  it('jangkar tahunAjaran mematikan promosi (tampilan sampai tahun X)', async () => {
    stubAll({ closureRows: closed2019, cohortRows: rows2019 });

    const card = await getKeberhasilanStudi({ tahunAjaran: '2020/2021' });
    expect(card.angkatanS1).toBe('2013/2014');
  });
});
