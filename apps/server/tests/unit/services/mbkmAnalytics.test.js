import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { contractFor, contractProblems } = require('@komet/shared/contracts');
const { buildActivityWhere } = require('../../../src/services/mbkm/filterBuilder');
const {
  distributionBy,
  getStatusDistribution,
} = require('../../../src/services/mbkm/mbkmActivities');
const { getMbkmRate } = require('../../../src/services/mbkm/mbkmRate');
const { getMbkmSummary } = require('../../../src/services/mbkm/mbkmSummary');
const { getEligibleStudents } = require('../../../src/services/mbkm/mbkmEligible');
const {
  getEligibleStudentsAtPeriode,
  semesterAtPeriode,
  isActiveAtPeriode,
} = require('../../../src/services/mbkm/mbkmEligibility');
const { getMitraDistribution } = require('../../../src/services/mbkm/mbkmMitra');

const calls = [];
const original = [
  [prisma.mbkmActivity, 'groupBy', prisma.mbkmActivity.groupBy],
  [prisma.mbkmActivity, 'findFirst', prisma.mbkmActivity.findFirst],
  [prisma.mbkmActivity, 'findMany', prisma.mbkmActivity.findMany],
  [prisma.student, 'findMany', prisma.student.findMany],
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
  prisma.mbkmActivity.findMany = vi.fn(async (args) => {
    calls.push({ model: 'mbkmActivity', kind: 'findMany', ...args });
    return fixtures.activities ?? [];
  });
  prisma.student.findMany = vi.fn(async (args) => {
    calls.push({ model: 'student', kind: 'findMany', ...args });
    return fixtures.students ?? [];
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

const studentRow = (nim, start, exit = '', fakultas = 'FST', statusKeaktifan = 'Aktif') => ({
  nim,
  periodeMasuk: start,
  periodeMasukAwal: '',
  periodeTerakhir: exit,
  statusKeaktifan,
  programStudi: 'Ilmu Komputer',
  fakultas,
});

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

const ELIGIBLE_STUDENTS = Array.from({ length: 200 }, (_, index) =>
  studentRow(`A${index}`, '20221'),
);
const mbkmRow = (nim, statusAktivitas, fakultas = 'FST') => ({
  nim,
  statusAktivitas,
  fakultas,
});
const RATE_ACTIVITIES = [
  ...Array.from({ length: 30 }, (_, index) => mbkmRow(`A${index}`, 'Selesai')),
  ...Array.from({ length: 12 }, (_, index) => mbkmRow(`A${30 + index}`, 'Disetujui', 'FEB')),
  ...Array.from({ length: 5 }, (_, index) => mbkmRow(`A${42 + index}`, 'Diajukan')),
  ...Array.from({ length: 3 }, (_, index) => mbkmRow(`A${47 + index}`, 'Ditolak')),
  // Duplikat NIM dan peserta di luar kohort eligible tidak boleh menambah angka.
  mbkmRow('A0', 'Selesai'),
  mbkmRow('B0', 'Selesai'),
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

  it('tanpa filter status client, partisipan mencakup Evaluasi/Diajukan', () => {
    const where = buildActivityWhere({}, '20251');
    expect(where.statusAktivitas.in).toEqual(['Disetujui', 'Selesai', 'Diajukan']);
  });
});

describe('eligible per periode', () => {
  it('memproyeksikan semester dari awal studi, bukan semester tersimpan', () => {
    expect(semesterAtPeriode('20221', '20251')).toBe(7);
    expect(semesterAtPeriode('20231', '20251')).toBe(5);
    expect(semesterAtPeriode('20222', '20251')).toBe(6);
    expect(semesterAtPeriode('invalid', '20251')).toBeNull();
  });

  it('aktif hanya jika sudah masuk dan belum keluar sebelum periode', () => {
    expect(isActiveAtPeriode(studentRow('A', '20221'), '20251')).toBe(true);
    expect(isActiveAtPeriode(studentRow('B', '20261'), '20251')).toBe(false);
    expect(isActiveAtPeriode(studentRow('C', '20221', '20242'), '20251')).toBe(false);
    expect(isActiveAtPeriode(studentRow('D', '20221', '20252'), '20251')).toBe(true);
  });

  it('cuti baru tidak aktif sejak periode cutinya, tetapi aktif di periode sebelumnya', () => {
    const cuti = studentRow('E', '20221', '20261', 'FST', 'Cuti');
    expect(isActiveAtPeriode(cuti, '20252')).toBe(true);
    expect(isActiveAtPeriode(cuti, '20261')).toBe(false);
    expect(isActiveAtPeriode(studentRow('F', '20221', '', 'FST', 'Cuti'), '20252')).toBe(false);
  });

  it('hanya mengambil semester 7 yang aktif pada periode terpilih', async () => {
    const rows = [
      studentRow('A', '20221'),
      studentRow('B', '20231'),
      studentRow('C', '20221', '20242'),
      studentRow('D', '20221', '20252'),
      studentRow('E', '20222'),
    ];
    const db = { student: { findMany: vi.fn(async () => rows) } };
    const eligible = await getEligibleStudentsAtPeriode({}, '20251', db);
    expect(eligible.map((student) => student.nim)).toEqual(['A', 'D']);
  });

  it('mahasiswa cuti semester 7 tidak masuk eligible pada periode cuti', async () => {
    const rows = [
      studentRow('A', '20231'),
      studentRow('B', '20231', '20261', 'FST', 'Cuti'),
      studentRow('C', '20231', '20252', 'FST', 'Cuti'),
    ];
    const db = { student: { findMany: vi.fn(async () => rows) } };
    const eligible = await getEligibleStudentsAtPeriode({}, '20261', db);
    expect(eligible.map((student) => student.nim)).toEqual(['A']);
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
      students: ELIGIBLE_STUDENTS,
      activities: RATE_ACTIVITIES,
      latestPeriode: { periode: '20251' },
    }),
  );

  it('menghitung mahasiswa unik yang benar-benar eligible pada periode', async () => {
    const data = await getMbkmRate({}, '20251', {});
    expect(data.eligibleCount).toBe(200);
    expect(data.participantStats).toEqual({
      count: 47,
      disetujuiCount: 12,
      selesaiCount: 31,
      evaluasiCount: 5,
    });
    expect(data.eligibleRate).toEqual({ numPercentage: 23.5 });
    expect(data.facultyData.map((item) => [item.name, item.count])).toEqual([
      ['FST', 35],
      ['FEB', 12],
    ]);
  });

  it('membatasi query ke kohort eligible, status partisipan, dan jenis terisi', async () => {
    await getMbkmRate({}, '20251', {});
    const query = calls.find((call) => call.kind === 'findMany' && call.model === 'mbkmActivity');
    expect(query.where.nim.in).toHaveLength(200);
    expect(query.where.statusAktivitas.in).toEqual(['Disetujui', 'Selesai', 'Diajukan']);
    expect(query.where.jenisAktivitas).toEqual({ not: '' });
  });

  it('penyebut nol menghasilkan null, bukan 0%', async () => {
    stubDelegates({ students: [], activities: [] });
    const data = await getMbkmRate({}, '20251', {});
    expect(data.eligibleCount).toBe(0);
    expect(data.eligibleRate.numPercentage).toBeNull();
    expect(data.facultyData).toEqual([]);
    expect(calls.some((call) => call.kind === 'findMany' && call.model === 'mbkmActivity')).toBe(
      false,
    );
  });

  it('eligibleCount identik dengan service daftar eligible', async () => {
    stubDelegates({ students: ELIGIBLE_STUDENTS, activities: RATE_ACTIVITIES });
    const rate = await getMbkmRate({}, '20251', { fakultas: { in: ['FST'] } });
    const eligible = await getEligibleStudents({ fakultas: { in: ['FST'] } }, '20251');
    expect(rate.eligibleCount).toBe(eligible.eligibleCount);
  });
});

describe('getMbkmSummary', () => {
  beforeAll(() =>
    stubDelegates({
      students: ELIGIBLE_STUDENTS,
      activities: RATE_ACTIVITIES,
      '["mitra"]': [
        { _count: { mitra: 10 }, mitra: 'Mitra A' },
        { _count: { mitra: 8 }, mitra: 'Mitra B' },
        { _count: { mitra: 4 }, mitra: 'Mitra C' },
        { _count: { mitra: 3 }, mitra: 'Mitra D' },
      ],
      latestPeriode: { periode: '20251' },
    }),
  );

  it('menyusun payload kartu di service, eligible dihitung sekali', async () => {
    const result = await getMbkmSummary({ periode: '20251', topN: 2 });

    expect(
      calls.filter((call) => call.kind === 'findMany' && call.model === 'student'),
    ).toHaveLength(1);
    // Client sudah mengirim periode → tidak ada `findFirst` untuk default periode.
    expect(calls.some((call) => call.kind === 'findFirst')).toBe(false);
    expect(result.previousPeriode).toBe('20242');
    expect(result.summary.persentaseMbkm).toEqual({
      mbkmCount: 47,
      eligibleCount: 200,
      percentage: 23.5,
    });
    expect(result.kpis).toEqual({
      totalParticipants: 47,
      selesaiCount: 31,
      evaluasiCount: 5,
      berjalanCount: 12,
      participationRate: 23.5,
      eligibleCount: 200,
      totalMitra: 4,
    });
    expect(result.kpiFilterScope.totalParticipants).toContain('search');
    expect(result.kpiFilterScope.rate).toContain('statusAktivitas');
    expect(result.kpiFilterScope.eligible).toContain('fakultas');
    expect(result.kpiFilterScope.eligible).not.toContain('search');
    expect(result.kpiFilterScope.eligible).not.toContain('statusAktivitas');
    expect(result.kpiFilterScope.mitra).toEqual(['periode']);
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
