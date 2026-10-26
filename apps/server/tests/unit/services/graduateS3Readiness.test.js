import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const {
  getTepatWaktu,
  getTepatWaktuByYear,
} = require('../../../src/services/graduates/tepatWaktu');
const {
  getKeberhasilanStudiByAngkatan,
} = require('../../../src/services/graduates/keberhasilanStudi');
const { STUDY_LIMITS } = require('../../../src/services/graduates/studyLimits');

const originalFindMany = prisma.student.findMany;
const originalGroupBy = prisma.student.groupBy;
const originalAggregate = prisma.graduate.aggregate;

afterAll(() => {
  prisma.student.findMany = originalFindMany;
  prisma.student.groupBy = originalGroupBy;
  prisma.graduate.aggregate = originalAggregate;
});

// S3 sintetis (tanpa periode lulus = dianggap Genap): masuk 20211 lulus
// 2023/2024 = 6 semester (tepat, batas 3 tahun); masuk 20201 = 8 semester (lewat).
const S3_ROWS = [
  {
    jenjang: 'S3',
    periodeMasuk: '20211',
    angkatan: '2021/2022',
    graduate: { tahunLulus: '2023/2024' },
  },
  {
    jenjang: 'S3',
    periodeMasuk: '20201',
    angkatan: '2020/2021',
    graduate: { tahunLulus: '2023/2024' },
  },
];

const S1_ROWS = [
  {
    jenjang: 'S1',
    periodeMasuk: '20191',
    angkatan: '2019/2020',
    graduate: { tahunLulus: '2023/2024' },
  },
];

function stubDataset(rows, jenjangs) {
  prisma.student.findMany = async () => rows;
  prisma.student.groupBy = async () => jenjangs.map((jenjang) => ({ jenjang }));
  prisma.graduate.aggregate = async () => ({ _max: { tahunLulus: '2025/2026' } });
}

describe('kesiapan S3', () => {
  it('aturan S3 terdaftar: batas 3 tahun, lag evaluasi 6 tahun', () => {
    expect(STUDY_LIMITS.S3).toEqual({ onTime: 3, max: 6 });
  });

  it('tepat waktu S3 terhitung saat datanya ada', async () => {
    stubDataset([...S1_ROWS, ...S3_ROWS], ['S1', 'S3']);
    const card = await getTepatWaktu({ jenjang: { in: ['S3'] } });
    expect(card.s3).toBe(50);
    const detail = await getTepatWaktuByYear({ jenjang: { in: ['S3'] } });
    expect(detail.batasS3).toBe(3);
    expect(detail.s3).toHaveLength(2);
    expect(detail.s3.find((row) => row.cohortLabel === 'Angkatan 2021/2022')).toMatchObject({
      onTimeCount: 1,
      lateCount: 0,
      rate: 100,
    });
    expect(detail.s3.find((row) => row.cohortLabel === 'Angkatan 2020/2021')).toMatchObject({
      onTimeCount: 0,
      lateCount: 1,
      rate: 0,
    });
  });

  it('keberhasilan studi S3 memakai lag 6 (evaluasi angkatan 2019/2020)', async () => {
    // countCohorts: penyebut lewat groupBy angkatan, pembilang lewat findMany.
    // Kohort evaluasi S3 = 2025 − 6 = 2019: intake 10, lulus dalam batas 7 dari 8.
    let calls = 0;
    prisma.graduate.aggregate = async () => ({ _max: { tahunLulus: '2025/2026' } });
    prisma.student.groupBy = async ({ by }) => {
      if (by[0] === 'jenjang') return [{ jenjang: 'S3' }];
      if (by.includes('statusKeaktifan')) return [];
      calls += 1;
      return [{ angkatan: '2019/2020', _count: { angkatan: 10 } }];
    };
    const graduate = (periodeWisuda) => ({
      angkatan: '2019/2020',
      periodeMasuk: '20191',
      graduate: { periodeWisuda },
    });
    prisma.student.findMany = async () => {
      calls += 1;
      return [...Array.from({ length: 7 }, () => graduate('20242')), graduate('20251')];
    };
    const detail = await getKeberhasilanStudiByAngkatan({ jenjang: { in: ['S3'] } });
    expect(calls).toBe(2);
    expect(detail.batasStudiS3).toBe(6);
    expect(detail.angkatanEvaluasiS3).toBe('2019/2020');
    const evaluated = detail.s3.find((row) => row.cohortLabel === 'Angkatan 2019/2020');
    expect(evaluated).toMatchObject({ intake: 10, successCount: 7, rate: 70 });
  });

  it('tanpa satu pun baris S3, tidak ada kunci s3 yang bocor ke payload', async () => {
    stubDataset(S1_ROWS, ['S1', 'S2']);
    const tepatWaktu = await getTepatWaktuByYear({});
    const studi = await getKeberhasilanStudiByAngkatan({});
    for (const payload of [tepatWaktu, studi]) {
      for (const key of Object.keys(payload)) {
        expect(key.toLowerCase()).not.toContain('s3');
      }
    }
  });

  it('keseluruhan menggabung semua jenjang termasuk S3 (bukan rata-rata rate)', async () => {
    // S1: 1 dari 2 tepat waktu (50); S3: 2 dari 2 (100).
    // Gabungan = 3 dari 4 (75); rata-rata rate akan memberi 75 juga —
    // bedakan dengan S1 1/2 dan S3 1/1: gabungan 2/3 (66.67), bukan 75.
    stubDataset(
      [
        {
          jenjang: 'S1',
          periodeMasuk: '20201',
          angkatan: '2020/2021',
          graduate: { tahunLulus: '2023/2024' },
        },
        {
          jenjang: 'S1',
          periodeMasuk: '20201',
          angkatan: '2020/2021',
          graduate: { tahunLulus: '2024/2025' },
        },
        {
          jenjang: 'S3',
          periodeMasuk: '20211',
          angkatan: '2021/2022',
          graduate: { tahunLulus: '2023/2024' },
        },
      ],
      ['S1', 'S3'],
    );
    const card = await getTepatWaktu({});
    expect(card.s1).toBe(50);
    expect(card.s3).toBe(100);
    expect(card.overall).toBe(66.67);
  });
});
