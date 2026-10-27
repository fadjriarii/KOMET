import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { contractFor, contractProblems } = require('@komet/shared/contracts');
const { resolvePeriods } = require('../../../src/services/mbkm/filterBuilder');
const {
  getEligibleStudentsAtPeriode,
  semesterAtPeriode,
  isActiveAtPeriode,
} = require('../../../src/services/mbkm/mbkmEligibility');
const { loadMbkmPopulation, periodeLabel } = require('../../../src/services/mbkm/population');
const { buildMbkmCards } = require('../../../src/services/mbkm/mbkmCards');
const {
  rateBreakdowns,
  participantBreakdowns,
  mitraBreakdowns,
} = require('../../../src/services/mbkm/mbkmBreakdowns');
const { getMbkmSummary } = require('../../../src/services/mbkm/mbkmSummary');
const { getMbkmList } = require('../../../src/services/mbkm/mbkmList');

const calls = [];
const original = [
  [prisma.mbkmActivity, 'groupBy', prisma.mbkmActivity.groupBy],
  [prisma.mbkmActivity, 'findFirst', prisma.mbkmActivity.findFirst],
  [prisma.mbkmActivity, 'findMany', prisma.mbkmActivity.findMany],
  [prisma.student, 'findMany', prisma.student.findMany],
  [prisma.student, 'groupBy', prisma.student.groupBy],
];

const studentRow = (nim, start, exit = '', fakultas = 'FST', statusKeaktifan = 'Aktif') => ({
  nim,
  nama: `Mahasiswa ${nim}`,
  angkatan: '2022/2023',
  jenjang: 'S1',
  periodeMasuk: start,
  periodeMasukAwal: '',
  periodeTerakhir: exit,
  statusKeaktifan,
  programStudi: fakultas === 'FST' ? 'Bio Teknologi' : 'Bisnis',
  fakultas,
});

const activity = (nim, statusAktivitas, overrides = {}) => ({
  id: calls.length + Math.random(),
  idAktivitas: 1,
  nim,
  periode: '20251',
  jenisAktivitas: 'Magang',
  judulAktivitas: 'Judul',
  mitra: 'PT Mitra',
  statusAktivitas,
  idStatusAktivitas: '',
  sksKonversi: null,
  programStudi: 'Bio Teknologi',
  fakultas: 'FST',
  student: { nama: `Mahasiswa ${nim}`, angkatan: '2022/2023', programStudi: 'Bio Teknologi' },
  ...overrides,
});

/** Stub Prisma: mahasiswa dan aktivitas dari fixture; `where` dicatat untuk asersi. */
function stubDb({ students = [], activities = [], latestPeriode = '20251', groups = {} } = {}) {
  prisma.student.findMany = vi.fn(async (args) => {
    calls.push({ model: 'student', ...args });
    return students;
  });
  prisma.mbkmActivity.findMany = vi.fn(async (args) => {
    calls.push({ model: 'mbkmActivity', ...args });
    return activities;
  });
  prisma.mbkmActivity.findFirst = vi.fn(async () => ({ periode: latestPeriode }));
  prisma.mbkmActivity.groupBy = vi.fn(async (args) => groups[args.by[0]] ?? []);
  prisma.student.groupBy = vi.fn(async () => []);
}

beforeEach(() => calls.splice(0, calls.length));
afterAll(() => {
  for (const [target, key, value] of original) target[key] = value;
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

  it('status keluar tanpa periode akhir tidak dianggap aktif selamanya', () => {
    const dropOut = studentRow('G', '20221', '', 'FST', 'Drop Out / Dikeluarkan');
    expect(isActiveAtPeriode(dropOut, '20251')).toBe(false);
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
});

describe('periode terpilih', () => {
  it('default = kedua periode tahun ajaran terbaru di data, bukan satu periode', async () => {
    stubDb({ latestPeriode: '20261' });
    expect(await resolvePeriods({})).toEqual(['20261', '20262']);
    expect(await resolvePeriods({ tahunAjaran: '2024/2025' })).toEqual(['20241', '20242']);
    expect(await resolvePeriods({ periode: '20252' })).toEqual(['20252']);
  });

  it('label periode dari kode', () => {
    expect(periodeLabel('20251')).toBe('Ganjil 2025/2026');
    expect(periodeLabel('20252')).toBe('Genap 2025/2026');
    expect(periodeLabel('20253')).toBe('20253');
  });
});

const ELIGIBLE = [
  studentRow('A', '20221'),
  studentRow('B', '20221'),
  studentRow('C', '20221', '', 'FEB'),
  studentRow('D', '20221', '', 'FEB'),
];

describe('populasi MBKM', () => {
  it('partisipan per mahasiswa: Diajukan/Ditolak, duplikat, dan non-eligible tidak menambah angka', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai', { sksKonversi: 20 }),
        activity('A', 'Disetujui', { jenisAktivitas: 'Riset', sksKonversi: 4 }),
        activity('B', 'Disetujui', { sksKonversi: 10 }),
        activity('C', 'Diajukan'),
        activity('D', 'Ditolak'),
        activity('Z', 'Selesai'),
      ],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    const cards = buildMbkmCards(population, { jenisAktivitas: 'Magang' });

    expect(cards.rate).toMatchObject({ value: 50, participants: 2, eligible: 4 });
    expect(cards.participants.byStatus).toEqual([
      { key: '5', label: 'Selesai', value: 1 },
      { key: '2', label: 'Disetujui', value: 1 },
    ]);
    expect(cards.participants.pending).toBe(1);
    expect(cards.eligible).toMatchObject({ value: 4, notParticipating: 2 });
    expect(cards.mitra).toMatchObject({
      value: 1,
      withPartner: 2,
      top: { name: 'PT Mitra', count: 2 },
    });
    expect(cards.rate.ignoredFilters).toEqual([]);
    expect(cards.eligible.ignoredFilters).toEqual(['jenisAktivitas']);

    const counted = Object.fromEntries(population.activities.map((a) => [a.nim, a.counted]));
    expect(counted).toMatchObject({ B: true, C: false, D: false, Z: false });
  });

  it('fakultas/prodi difilter lewat kolom Student, untuk pembilang dan penyebut', async () => {
    stubDb({ students: [], activities: [] });
    await loadMbkmPopulation({ fakultas: 'FST', jenisAktivitas: 'Magang' }, ['20251']);
    const activityQuery = calls.find((call) => call.model === 'mbkmActivity');
    const studentQuery = calls.find((call) => call.model === 'student');
    expect(activityQuery.where).toMatchObject({
      periode: { in: ['20251'] },
      student: { fakultas: { in: ['FST'] } },
      jenisAktivitas: { in: ['Magang'] },
    });
    expect(activityQuery.where.fakultas).toBeUndefined();
    expect(studentQuery.where).toEqual({ fakultas: { in: ['FST'] } });
  });

  it('status baru dari SEVIMA tidak dihitung dan berkategori unclassified', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [activity('A', 'Ditunda', { idStatusAktivitas: '9' })],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    expect(population.participants.size).toBe(0);
    expect(population.activities[0]).toMatchObject({
      counted: false,
      rule: { category: 'unclassified' },
    });
  });

  it('mitra hanya dari aktivitas terhitung: Ditolak/Dibatalkan dan non-eligible tidak ikut', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai', { mitra: 'PT Mitra' }),
        activity('B', 'Ditolak', { mitra: 'PT Ditolak' }),
        activity('C', 'Dibatalkan', { mitra: 'PT Batal' }),
        activity('Z', 'Selesai', { mitra: 'PT Luar' }),
      ],
    });
    const cards = buildMbkmCards(await loadMbkmPopulation({}, ['20251']));
    expect(cards.mitra).toMatchObject({ value: 1, withPartner: 1, isEmpty: false });
  });

  it('tanpa eligible: persentase null dan semua kartu kosong', async () => {
    stubDb({ students: [], activities: [] });
    const cards = buildMbkmCards(await loadMbkmPopulation({}, ['20251']));
    expect(cards.rate).toMatchObject({ value: null, isEmpty: true });
    expect(cards.participants.isEmpty).toBe(true);
    expect(cards.mitra).toMatchObject({ value: null, isEmpty: true });
  });
});

describe('breakdowns', () => {
  it('tingkat partisipasi per fakultas = partisipan ÷ eligible fakultas itu (≤ 100%)', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [activity('A', 'Selesai'), activity('B', 'Selesai'), activity('C', 'Selesai')],
    });
    const [fakultas] = rateBreakdowns(await loadMbkmPopulation({}, ['20251']));
    expect(fakultas.kind).toBe('rate');
    expect(fakultas.items).toEqual([
      { name: 'FEB', count: 1, total: 2, percentage: 50 },
      { name: 'FST', count: 2, total: 2, percentage: 100 },
    ]);
  });

  it('status per mahasiswa menjumlah ke kartu; mitra kembar digabung, sisanya Lainnya', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai', { mitra: 'PT Mitra' }),
        activity('A', 'Disetujui', { mitra: 'PT. MITRA' }),
        activity('B', 'Disetujui', { mitra: 'PT Mitra ' }),
        activity('C', 'Selesai', { mitra: 'CV Lain' }),
      ],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    const byKey = Object.fromEntries(
      participantBreakdowns(population).map((b) => [b.key, b.items]),
    );
    expect(byKey.status.reduce((sum, item) => sum + item.count, 0)).toBe(3);
    expect(byKey.mitra).toBeUndefined();

    const [mitra, jenis] = mitraBreakdowns(population, 1);
    expect(mitra.items).toEqual([
      { name: 'PT Mitra', count: 2, percentage: 66.67 },
      { name: 'Lainnya', count: 1, percentage: 33.33 },
    ]);
    expect(jenis.items).toEqual([{ name: 'Magang', count: 2, percentage: 100 }]);
  });
});

describe('getMbkmList', () => {
  const fixture = {
    students: ELIGIBLE,
    activities: [
      activity('A', 'Selesai', { sksKonversi: 24 }),
      activity('B', 'Selesai', { sksKonversi: 6 }),
      activity('C', 'Diajukan'),
    ],
  };

  it('memakai periode default yang sama dengan kartu dan kategori status dari server', async () => {
    stubDb({ ...fixture, latestPeriode: '20251' });
    const result = await getMbkmList({}, 1, 10);
    expect(result.selectedPeriods).toEqual(['20251', '20252']);
    expect(result.pagination.total).toBe(3);
    expect(result.data.map((row) => [row.nim, row.statusCategory, row.totalSks])).toEqual([
      ['A', 'participating', 24],
      ['B', 'participating', 6],
      ['C', 'pending', null],
    ]);
    expect(contractProblems(contractFor('/mbkm/list'), result)).toEqual([]);
  });
});

describe('getMbkmSummary', () => {
  it('bentuknya memenuhi kontrak yang dibaca client', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [activity('A', 'Selesai')],
      groups: { periode: [{ periode: '20251', _count: { periode: 1 } }] },
    });
    const result = await getMbkmSummary({ tahunAjaran: '2025/2026' });
    expect(result.selectedPeriods).toEqual(['20251', '20252']);
    expect(result.periodLabel).toBe('Tahun Ajaran 2025/2026');
    expect(Object.keys(result.kpis.cards)).toEqual(['rate', 'participants', 'eligible', 'mitra']);
    expect(contractProblems(contractFor('/mbkm/summary'), { success: true, ...result })).toEqual(
      [],
    );
  });
});
