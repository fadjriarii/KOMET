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
  participationBreakdowns,
  totalBreakdowns,
  jenisBreakdowns,
  mitraBreakdowns,
} = require('../../../src/services/mbkm/mbkmBreakdowns');
const { getMbkmSummary } = require('../../../src/services/mbkm/mbkmSummary');
const { getMbkmList } = require('../../../src/services/mbkm/mbkmList');
const { clearPartnerIndex } = require('../../../src/services/mbkm/partnerNames');

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
  prisma.mbkmPartnerAlias = { findMany: vi.fn(async () => []) };
  clearPartnerIndex();
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

/** Aktivitas mahasiswa di luar semester 7 (masuk 20231 = semester 5 pada 20251). */
const outsider = (nim, status, overrides = {}) =>
  activity(nim, status, {
    student: {
      nama: `Mahasiswa ${nim}`,
      angkatan: '2023/2024',
      programStudi: 'Bisnis',
      periodeMasuk: '20231',
    },
    ...overrides,
  });

describe('populasi MBKM', () => {
  it('kartu Partisipasi Semester 7: Diajukan/Ditolak dan non-eligible tidak menambah angka', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai'),
        activity('A', 'Disetujui', { jenisAktivitas: 'Riset' }),
        activity('B', 'Disetujui'),
        activity('C', 'Diajukan'),
        activity('D', 'Ditolak'),
        outsider('Z', 'Selesai'),
      ],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    const cards = buildMbkmCards(population);

    expect(cards.participation).toEqual({
      value: 50,
      isEmpty: false,
      participants: 2,
      eligible: 4,
      notParticipating: 2,
      pending: 1,
    });
    const counted = Object.fromEntries(population.activities.map((a) => [a.nim, a.counted]));
    expect(counted).toMatchObject({ B: true, C: false, D: false, Z: false });
  });

  it('Total Mahasiswa MBKM mencakup semua semester, tanpa Ditolak atau Dibatalkan', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai'),
        outsider('Y', 'Disetujui'),
        outsider('Z', 'Selesai', { jenisAktivitas: 'Riset' }),
        outsider('X', 'Ditolak'),
        outsider('W', 'Dibatalkan'),
      ],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    const cards = buildMbkmCards(population);
    expect(cards.total).toEqual({ value: 3, isEmpty: false, semester7: 1 });
    expect(population.allParticipants.get('Z').student.semester).toBe(5);

    const [semester] = totalBreakdowns(population);
    expect(semester.items.map((item) => [item.name, item.count])).toEqual([
      ['Semester 5', 2],
      ['Tidak diketahui', 1],
    ]);
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

  it('pencarian nama mitra ikut mencari semua ejaan mitra yang sama', async () => {
    stubDb({
      students: ELIGIBLE,
      groups: { mitra: [{ mitra: 'I3L' }, { mitra: 'Indonesia International Institute (i3L)' }] },
    });
    await loadMbkmPopulation({ search: 'Indonesia International Institute (i3L)' }, ['20251']);
    const { where } = calls.find((call) => call.model === 'mbkmActivity');
    expect(where.OR).toContainEqual({
      mitra: { in: ['I3L', 'Indonesia International Institute (i3L)'] },
    });
  });

  it('status baru dari SEVIMA tidak dihitung dan berkategori unclassified', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [activity('A', 'Ditunda', { idStatusAktivitas: '9' })],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    expect(population.participants.size).toBe(0);
    expect(population.allParticipants.size).toBe(0);
    expect(population.activities[0]).toMatchObject({
      counted: false,
      rule: { category: 'unclassified' },
    });
  });

  it('mitra dan bentuk kegiatan memakai semua semester; Ditolak/Dibatalkan tidak ikut', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai', { mitra: 'PT Mitra' }),
        activity('B', 'Ditolak', { mitra: 'PT Ditolak' }),
        activity('C', 'Dibatalkan', { mitra: 'PT Batal' }),
        outsider('Z', 'Selesai', { mitra: 'PT Luar', jenisAktivitas: 'Riset' }),
      ],
    });
    const cards = buildMbkmCards(await loadMbkmPopulation({}, ['20251']));
    expect(cards.mitra).toMatchObject({ value: 2, withPartner: 2, isEmpty: false });
    expect(cards.jenis).toEqual({
      value: 2,
      isEmpty: false,
      top: [
        { name: 'Magang', count: 1, percentage: 50 },
        { name: 'Riset', count: 1, percentage: 50 },
      ],
    });
  });

  it('tanpa eligible dan aktivitas: persentase null, angka lain 0 dengan isEmpty', async () => {
    stubDb({ students: [], activities: [] });
    const cards = buildMbkmCards(await loadMbkmPopulation({}, ['20251']));
    expect(cards.participation).toMatchObject({ value: null, isEmpty: true });
    expect(cards.total).toMatchObject({ value: 0, isEmpty: true });
    expect(cards.mitra).toMatchObject({ value: 0, isEmpty: true });
  });
});

describe('breakdowns', () => {
  it('tingkat partisipasi per fakultas = partisipan ÷ eligible fakultas itu (≤ 100%)', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [activity('A', 'Selesai'), activity('B', 'Selesai'), activity('C', 'Selesai')],
    });
    const [fakultas, , status, belum] = participationBreakdowns(
      await loadMbkmPopulation({}, ['20251']),
    );
    expect(fakultas.kind).toBe('rate');
    expect(fakultas.items).toEqual([
      { name: 'FEB', count: 1, total: 2, percentage: 50 },
      { name: 'FST', count: 2, total: 2, percentage: 100 },
    ]);
    expect(status.items).toEqual([{ name: 'Selesai', count: 3, percentage: 100 }]);
    expect(belum.items).toEqual([{ name: 'Bisnis', count: 1, percentage: 100 }]);
  });

  it('mitra kembar digabung dan sisanya Lainnya; jenis menghitung mahasiswa per jenis', async () => {
    stubDb({
      students: ELIGIBLE,
      activities: [
        activity('A', 'Selesai', { mitra: 'PT Mitra' }),
        activity('A', 'Disetujui', { mitra: 'PT. MITRA', jenisAktivitas: 'Riset' }),
        activity('B', 'Disetujui', { mitra: 'PT Mitra ' }),
        activity('C', 'Selesai', { mitra: 'CV Lain' }),
      ],
    });
    const population = await loadMbkmPopulation({}, ['20251']);
    const [mitra, mitraPerJenis] = mitraBreakdowns(population, 1);
    expect(mitra.items).toEqual([
      { name: 'PT Mitra', count: 2, percentage: 66.67 },
      { name: 'Lainnya', count: 1, percentage: 33.33 },
    ]);
    expect(mitraPerJenis.items).toEqual([
      { name: 'Magang', count: 2, percentage: 100 },
      { name: 'Riset', count: 1, percentage: 50 },
    ]);
    const [jenis] = jenisBreakdowns(population);
    expect(jenis.items).toEqual([
      { name: 'Magang', count: 3, percentage: 100 },
      { name: 'Riset', count: 1, percentage: 33.33 },
    ]);
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
    expect(Object.keys(result.kpis.cards)).toEqual(['participation', 'total', 'mitra', 'jenis']);
    expect(contractProblems(contractFor('/mbkm/summary'), { success: true, ...result })).toEqual(
      [],
    );
  });

  it('opsi Jenis Aktivitas hanya jenis yang ada di periode terpilih', async () => {
    stubDb({
      students: ELIGIBLE,
      groups: { jenisAktivitas: [{ jenisAktivitas: 'Riset', _count: { jenisAktivitas: 3 } }] },
    });
    const result = await getMbkmSummary({ tahunAjaran: '2025/2026' });
    expect(result.filterOptions.jenisAktivitas).toEqual(['Riset']);
    const jenisQuery = prisma.mbkmActivity.groupBy.mock.calls.find(
      ([args]) => args.by[0] === 'jenisAktivitas' && args.where?.periode,
    );
    expect(jenisQuery[0].where.periode).toEqual({ in: ['20251', '20252'] });
  });
});
