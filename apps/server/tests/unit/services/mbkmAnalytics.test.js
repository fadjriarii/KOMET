import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { contractFor, contractProblems } = require('@komet/shared/contracts');
const {
  buildActivityWhere,
  buildEligibleStudentWhere,
} = require('../../../src/services/mbkm/filterBuilder');
const {
  distributionBy,
  getStatusDistribution,
} = require('../../../src/services/mbkm/mbkmActivities');
const { getMbkmRate } = require('../../../src/services/mbkm/mbkmRate');
const { getMbkmSummary } = require('../../../src/services/mbkm/mbkmSummary');
const { getEligibleStudents } = require('../../../src/services/mbkm/mbkmEligible');
const { getMitraDistribution } = require('../../../src/services/mbkm/mbkmMitra');

const calls = [];
const original = [
  [prisma.mbkmActivity, 'groupBy', prisma.mbkmActivity.groupBy],
  [prisma.mbkmActivity, 'findFirst', prisma.mbkmActivity.findFirst],
  [prisma.student, 'groupBy', prisma.student.groupBy],
  [prisma.student, 'count', prisma.student.count],
];

/** Stub Prisma delegate; hasil per bentuk `by` dikirim dari `fixtures`. */
function stubDelegates(fixtures) {
  prisma.mbkmActivity.groupBy = vi.fn(async (args) => {
    calls.push({ model: 'mbkmActivity', ...args });
    return fixtures[JSON.stringify(args.by)] ?? [];
  });
  prisma.mbkmActivity.findFirst = vi.fn(async () => {
    calls.push({ model: 'mbkmActivity', kind: 'findFirst' });
    return fixtures.latestPeriode ?? null;
  });
  prisma.student.count = vi.fn(async (args) => {
    calls.push({ model: 'student', kind: 'count', ...args });
    return fixtures.eligibleCount ?? 0;
  });
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push({ model: 'student', ...args });
    return fixtures.studentGroups ?? [];
  });
}

beforeEach(() => calls.splice(0, calls.length));
afterAll(() => {
  for (const [target, key, value] of original) target[key] = value;
});

const STATUS_GROUPS = [
  { _count: { statusAktivitas: 30 }, statusAktivitas: 'Selesai' },
  { _count: { statusAktivitas: 12 }, statusAktivitas: 'Disetujui' },
  { _count: { statusAktivitas: 5 }, statusAktivitas: 'Diajukan' },
  { _count: { statusAktivitas: 3 }, statusAktivitas: 'Ditolak' },
];

const FAKULTAS_GROUPS = [
  { _count: { fakultas: 30 }, fakultas: 'Fakultas Teknik' },
  { _count: { fakultas: 12 }, fakultas: 'Fakultas Ekonomi' },
];

describe('scope status agregasi MBKM', () => {
  it('mengiris filter status client dengan scope partisipan, tidak menimpanya', () => {
    const where = buildActivityWhere({ statusAktivitas: { in: ['Selesai', 'Ditolak'] } }, '20251');
    expect(where.statusAktivitas).toEqual({ in: ['Selesai'] });
    expect(where.periode).toBe('20251');
    // Aktivitas tanpa jenis dibuang saat sync, bukan disaring setiap kali dibaca.
    expect(where.jenisAktivitas).toBeUndefined();
  });

  it('status di luar scope menghasilkan populasi kosong', () => {
    const where = buildActivityWhere({ statusAktivitas: { in: ['Ditolak'] } }, '20251');
    expect(where.statusAktivitas).toEqual({ in: [] });
  });

  it('scope null memakai filter client apa adanya (tab status verifikasi)', () => {
    const where = buildActivityWhere({ statusAktivitas: { in: ['Ditolak'] } }, '20251', null);
    expect(where.statusAktivitas).toEqual({ in: ['Ditolak'] });
  });

  it('tanpa filter status client, scope partisipan dipakai', () => {
    const where = buildActivityWhere({}, '20251');
    expect(where.statusAktivitas.in).toEqual(['Disetujui', 'Selesai']);
  });

  it('definisi eligible satu sumber untuk rate dan sebaran prodi', () => {
    const where = buildEligibleStudentWhere({ angkatan: { in: ['2023'] } });
    expect(where).toEqual({ angkatan: { in: ['2023'] }, semester: 7, statusKeaktifan: 'Aktif' });
    // Kriteria eligible tidak bisa ditimpa filter caller.
    expect(buildEligibleStudentWhere({ semester: 3 }).semester).toBe(7);
  });
});

describe('distribusi MBKM', () => {
  beforeAll(() => stubDelegates({ '["fakultas"]': FAKULTAS_GROUPS }));

  it('mengurutkan di SQL tanpa sort ulang di JavaScript', async () => {
    await distributionBy('fakultas', {}, '20251');
    expect(calls[0].orderBy).toEqual([{ _count: { fakultas: 'desc' } }, { fakultas: 'asc' }]);
  });

  it('persentase dihitung atas total kelompok sendiri', async () => {
    const result = await distributionBy('fakultas', {}, '20251');
    expect(result.total).toBe(42);
    expect(result.population).toBe('active_participants');
    expect(result.items.map((item) => item.percentage)).toEqual([(30 / 42) * 100, (12 / 42) * 100]);
  });

  it('tab status menandai penyebutnya sendiri', async () => {
    stubDelegates({ '["statusAktivitas"]': STATUS_GROUPS });
    const result = await getStatusDistribution({}, '20251');
    expect(result.population).toBe('all_statuses');
    expect(result.total).toBe(50);
    expect(result.items[0]).toEqual({
      name: 'Selesai',
      count: 30,
      percentage: 60,
    });
  });
});

describe('getMbkmRate', () => {
  beforeAll(() =>
    stubDelegates({
      '["statusAktivitas"]': STATUS_GROUPS,
      '["fakultas"]': FAKULTAS_GROUPS,
      eligibleCount: 200,
      latestPeriode: { periode: '20251' },
    }),
  );

  it('satu groupBy status menggantikan tiga count()', async () => {
    const data = await getMbkmRate({}, '20251', {});
    const countCalls = calls.filter(
      (call) => call.kind === 'count' && call.model === 'mbkmActivity',
    );
    expect(countCalls).toHaveLength(0);
    expect(calls.filter((call) => call.model === 'mbkmActivity')).toHaveLength(2);
    expect(data.participantStats).toEqual({
      count: 42,
      disetujuiCount: 12,
      selesaiCount: 30,
      evaluasiCount: 5,
    });
  });

  it('evaluasi dihitung dari data, bukan konstanta 0', async () => {
    const data = await getMbkmRate({}, '20251', {});
    expect(data.participantStats.evaluasiCount).toBe(5);
  });

  it('eligibleCount identik dengan sumber Card 3', async () => {
    const rate = await getMbkmRate({}, '20251', { fakultas: { in: ['Ekonomi'] } });
    const eligible = await getEligibleStudents({ fakultas: { in: ['Ekonomi'] } });
    expect(rate.eligibleCount).toBe(eligible.eligibleCount);
    const where = calls.filter((call) => call.kind === 'count').map((call) => call.where);
    expect(new Set(where.map((item) => JSON.stringify(item))).size).toBe(1);
  });

  it('menurunkan target IKU-2 dari angka nyata', async () => {
    stubDelegates({
      '["statusAktivitas"]': [{ _count: { statusAktivitas: 50 }, statusAktivitas: 'Selesai' }],
      '["fakultas"]': [],
      eligibleCount: 200,
    });
    const data = await getMbkmRate({}, '20251', {});
    expect(data.eligibleRate.numPercentage).toBe(25);
    expect(data.eligibleRate.meetsTarget).toBe(true);
  });

  it('mengirim boolean, bukan label capaian', async () => {
    stubDelegates({
      '["statusAktivitas"]': STATUS_GROUPS,
      '["fakultas"]': [],
      eligibleCount: 200,
    });
    const data = await getMbkmRate({}, '20251', {});
    expect(Object.keys(data.eligibleRate).sort()).toEqual([
      'meetsTarget',
      'numPercentage',
      'targetIku2',
    ]);
  });
});

describe('getMbkmSummary', () => {
  beforeAll(() =>
    stubDelegates({
      '["statusAktivitas"]': STATUS_GROUPS,
      '["fakultas"]': FAKULTAS_GROUPS,
      '["mitra"]': [
        { _count: { mitra: 10 }, mitra: 'Mitra A' },
        { _count: { mitra: 8 }, mitra: 'Mitra B' },
        { _count: { mitra: 4 }, mitra: 'Mitra C' },
        { _count: { mitra: 3 }, mitra: 'Mitra D' },
      ],
      eligibleCount: 300,
      latestPeriode: { periode: '20251' },
    }),
  );

  it('menyusun payload kartu di service, eligible dihitung sekali', async () => {
    const result = await getMbkmSummary({ periode: '20251', topN: 2 });

    expect(calls.filter((call) => call.kind === 'count' && call.model === 'student')).toHaveLength(
      1,
    );
    // Client sudah mengirim periode → tidak ada `findFirst` untuk default periode.
    expect(calls.some((call) => call.kind === 'findFirst')).toBe(false);
    expect(result.previousPeriode).toBe('20242');
    expect(result.summary.persentaseMbkm).toEqual({
      mbkmCount: 42,
      eligibleCount: 300,
      percentage: 14,
    });
    expect(result.kpis).toMatchObject({
      totalParticipants: 42,
      berjalanCount: 12,
      selesaiCount: 30,
      evaluasiCount: 5,
      participationRate: 14,
      meetsIkuTarget: false,
      targetIku2: 20,
      eligibleCount: 300,
      totalMitra: 4,
    });
    expect(JSON.stringify(result)).not.toContain('Target IKU-2');
  });

  it('bentuknya memenuhi kontrak yang dibaca client', async () => {
    const result = await getMbkmSummary({ periode: '20251' });

    // Nama KPI adalah satu-satunya pengikat angka server ke kartu client; yang
    // tidak terdaftar di kontrak tertangkap di sini, bukan saat kartunya kosong.
    expect(contractProblems(contractFor('/mbkm/summary'), { success: true, ...result })).toEqual(
      [],
    );
  });
});

describe('getMitraDistribution', () => {
  const MITRA_GROUPS = [
    { _count: { mitra: 10 }, mitra: 'Mitra A' },
    { _count: { mitra: 8 }, mitra: 'Mitra B' },
    { _count: { mitra: 4 }, mitra: 'Mitra C' },
    { _count: { mitra: 3 }, mitra: 'Mitra D' },
  ];

  it('bucket Lainnya membuat persentase menutup 100%', async () => {
    stubDelegates({ '["mitra"]': MITRA_GROUPS });
    const data = await getMitraDistribution('20251', 2);
    expect(data.totalPartners).toBe(4);
    expect(data.mitraData).toHaveLength(3);
    expect(data.mitraData.at(-1)).toEqual({
      name: 'Lainnya',
      count: 7,
      partners: 2,
      percentage: (7 / 25) * 100,
    });
    const sum = data.mitraData.reduce((acc, item) => acc + item.percentage, 0);
    expect(sum).toBeCloseTo(100, 10);
  });

  it('tanpa pemangkasan, tidak ada bucket Lainnya', async () => {
    stubDelegates({ '["mitra"]': MITRA_GROUPS });
    const data = await getMitraDistribution('20251', 10);
    expect(data.mitraData).toHaveLength(4);
    expect(data.mitraData.some((item) => item.name === 'Lainnya')).toBe(false);
  });
});
