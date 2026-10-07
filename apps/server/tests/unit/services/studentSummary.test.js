import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { contractFor, contractProblems } = require('@komet/shared/contracts');
const { matchesStudentCondition } = require('../../../src/services/students/filterBuilder');
const { getStudentSummary } = require('../../../src/services/students/studentSummary');

const original = {
  count: prisma.student.count,
  aggregate: prisma.student.aggregate,
  groupBy: prisma.student.groupBy,
};

/**
 * Dataset: lima tahun akademik penuh (20 mahasiswa per tahun, terakhir terbagi
 * 12 Ganjil + 8 Genap), tiga mahasiswa asing di kohort Ganjil 2025/2026, dan
 * satu mahasiswa yang sudah lulus sebelum jendela tren dimulai (2018/2019).
 *
 * Query diturunkan dari dataset dengan `matchesStudentCondition` — evaluator
 * yang sama dengan yang dipakai proyeksi status — supaya angka uji berasal dari
 * aturan filter produksi, bukan dari stub yang dikarang sendiri.
 */
const COHORTS = [
  ['20211', 20],
  ['20221', 20],
  ['20231', 20],
  ['20241', 20],
  ['20251', 12],
  ['20252', 8],
];

function buildStudents() {
  const rows = COHORTS.flatMap(([periodeMasuk, count]) =>
    Array.from({ length: count }, () => ({
      nim: '',
      nama: 'Mahasiswa',
      periodeMasuk,
      periodeTerakhir: '',
      statusKeaktifan: 'Aktif',
      angkatan: periodeMasuk.slice(0, 4),
      jenjang: 'S1',
      fakultas: 'FKM',
      programStudi: 'K3',
      semester: 3,
      kewarganegaraan: 'Indonesia',
    })),
  );
  rows.forEach((row, index) => {
    row.nim = String(index + 1).padStart(4, '0');
  });
  // Baris 80–82 adalah tiga mahasiswa pertama kohort Ganjil 2025/2026.
  rows[80].kewarganegaraan = 'Malaysia';
  rows[81].kewarganegaraan = 'Malaysia';
  rows[82].kewarganegaraan = 'Thailand';
  // Lulus sebelum jendela: status terminal terakhir, keluar pada Genap 2018/2019.
  rows.push({
    nim: '9001',
    nama: 'Lulusan lama',
    periodeMasuk: '20181',
    periodeTerakhir: '20182',
    statusKeaktifan: 'Lulus',
    angkatan: '2018',
    jenjang: 'S1',
    fakultas: 'FKM',
    programStudi: 'K3',
    semester: 4,
    kewarganegaraan: 'Indonesia',
  });
  return rows;
}

const STUDENTS = buildStudents();

function installStub(rows) {
  const queries = [];
  const matching = (where = {}) => rows.filter((row) => matchesStudentCondition(row, where));

  prisma.student.count = vi.fn(async ({ where }) => {
    queries.push({ op: 'count', where });
    return matching(where).length;
  });
  prisma.student.aggregate = vi.fn(async ({ where }) => {
    queries.push({ op: 'aggregate', where });
    const latest = matching(where).reduce(
      (max, row) => (row.periodeMasuk > max ? row.periodeMasuk : max),
      '',
    );
    return { _max: { periodeMasuk: latest || null } };
  });
  prisma.student.groupBy = vi.fn(async ({ by, where }) => {
    queries.push({ op: 'groupBy', by, where });
    const field = by[0];
    const groups = new Map();
    matching(where).forEach((row) => {
      groups.set(row[field], (groups.get(row[field]) || 0) + 1);
    });
    return [...groups.entries()].map(([value, count]) => ({
      [field]: value,
      _count: { [field]: count },
    }));
  });

  return queries;
}

describe('student summary service', () => {
  afterAll(() => {
    Object.assign(prisma.student, original);
  });

  it('menyusun kpis dan summary dari satu batch query, tanpa query susulan', async () => {
    const queries = installStub(STUDENTS);

    const result = await getStudentSummary({});

    expect(result.kpis).toEqual({
      activeStudentsCount: 100,
      foreignRate: 3,
      foreignStudentsCount: 3,
      intakeCohortCount: 20,
      declinePercentage: 0,
      isFluctuationPositive: true,
      intakePeriod: '2025/2026',
      declinePeriod: '2025/2026',
      hasEnoughDeclineData: true,
      activeStudentStatus: { isAll: false, statuses: ['Aktif'], isCumulative: false },
    });
    expect(result.summary.intakeTrend.trend.map((row) => row.intakeCount)).toEqual([
      20, 20, 20, 20, 20,
    ]);
    // Tahun pertama jendela tidak punya pembanding di dalam data → null, bukan 0%.
    expect(result.summary.intakeTrend.trend[0].growthPercentage).toBeNull();
    expect(result.summary.intakeTrend.trend[4]).toMatchObject({
      tahun: '2025/2026',
      ganjil: 12,
      genap: 8,
    });
    expect(result.summary.newStudentDecline.history[0]).toMatchObject({
      label: 'A',
      academicYear: '2025/2026',
      changeFromPrev: 0,
    });
    // Tren mahasiswa asing adalah snapshot populasi (kumulatif s.d. akhir TA),
    // bukan intake per tahun. `toEqual` (bukan `toMatchObject`) mengunci bahwa
    // barisnya hanya mengirim nama field yang kanonik — tanpa alias ganda.
    expect(result.summary.internationalStudentsTrend.trendData[0]).toEqual({
      academicYear: '2021/2022',
      totalCount: 20,
      foreignCount: 0,
      percentage: 0,
    });
    expect(result.summary.internationalStudentsTrend.trendData[4]).toEqual({
      academicYear: '2025/2026',
      totalCount: 100,
      foreignCount: 3,
      percentage: 3,
    });
    expect(result.summary.internationalStudentsTrend.byCountry).toEqual([
      { kewarganegaraan: 'Malaysia', count: 2 },
      { kewarganegaraan: 'Thailand', count: 1 },
    ]);

    // 1 count + 1 agregat jendela + 5 tren per tahun + 1 pemetaan negara +
    // 1 groupBy intake. Penurunan murni memori: tidak ada query tambahan.
    expect(queries).toHaveLength(9);
    expect(
      queries.filter((query) => query.op === 'groupBy' && query.by[0] === 'periodeMasuk'),
    ).toHaveLength(1);
  });

  it('kartu intake dan jendela penurunan mengikuti tahun ajaran terpilih tanpa query tambahan', async () => {
    const queries = installStub(STUDENTS);

    const result = await getStudentSummary({ tahunAjaran: '2024/2025' });

    expect(result.kpis.intakePeriod).toBe('2024/2025');
    expect(result.kpis.declinePeriod).toBe('2024/2025');
    expect(result.summary.intakeTrend.latest).toMatchObject({
      tahun: '2024/2025',
      intakeCount: 20,
      growthPercentage: 0,
    });
    // Jendela penurunan menjulur ke 2020/2021 yang tidak ada di data: tahun
    // tanpa pembanding sah tidak dihitung dan tidak memicu query baru.
    expect(result.summary.newStudentDecline.history.map((point) => point.academicYear)).toEqual([
      '2024/2025',
      '2023/2024',
      '2022/2023',
      '2021/2022',
      '2020/2021',
    ]);
    expect(result.summary.newStudentDecline.history[4].intakeCount).toBe(0);
    expect(result.summary.newStudentDecline).toMatchObject({
      comparisonsUsed: 3,
      comparisonsTotal: 4,
    });
    expect(
      queries.filter((query) => query.op === 'groupBy' && query.by[0] === 'periodeMasuk'),
    ).toHaveLength(1);
  });

  it('tanpa data: penurunan null, bukan 0% yang tampak datar', async () => {
    installStub([]);

    const result = await getStudentSummary({});

    expect(result.summary.newStudentDecline).toBeNull();
    expect(result.kpis).toMatchObject({
      activeStudentsCount: 0,
      declinePercentage: null,
      hasEnoughDeclineData: false,
      isFluctuationPositive: false,
      intakeCohortCount: 0,
      foreignRate: 0,
    });
  });

  it('tiap kartu memakai scope filter yang diumumkan, bukan hasil buangan', async () => {
    const queries = installStub(STUDENTS);

    await getStudentSummary({ tahunAjaran: '2020/2021', statusKeaktifan: 'Lulus' });

    const windowProbe = queries.find((query) => query.op === 'aggregate');
    const nationalityQueries = queries.filter(
      (query) => query.op === 'groupBy' && query.by[0] === 'kewarganegaraan',
    );
    const intake = queries.find(
      (query) => query.op === 'groupBy' && query.by[0] === 'periodeMasuk',
    );

    // ALL_YEARS: jendela dan tren per tahun tidak membatasi pada tahun terpilih.
    expect(JSON.stringify(windowProbe.where)).not.toContain('20202');
    nationalityQueries
      .slice(0, -1)
      .forEach((query) => expect(JSON.stringify(query.where)).not.toContain('20202'));
    // POPULATION: kartu WNA tetap memotret tahun ajaran terpilih.
    expect(nationalityQueries.at(-1).where.AND).toContainEqual({ periodeMasuk: { lte: '20202' } });
    // COHORT: intake tidak pernah dibatasi status, dan membaca semua kohort —
    // termasuk yang lulus sebelum jendela tren.
    expect(intake.where.statusKeaktifan).toBeUndefined();
    expect(intake.where.AND).toContainEqual({ periodeMasuk: { lte: '20202' } });
  });

  it('mengumumkan scope filter yang sama dengan yang benar-benar dibaca', async () => {
    installStub(STUDENTS);

    const { kpiFilterScope } = await getStudentSummary({});

    // Klaim ini yang dipakai badge "Terfilter" di client; kalau daftar ini lebih
    // luas dari perilaku buildStudentFilter, kartu ditandai padahal angkanya tidak
    // berubah (atau sebaliknya).
    expect(kpiFilterScope.active).toContain('statusKeaktifan');
    expect(kpiFilterScope.active).toContain('tahunAjaran');
    // COHORT: status tidak membatasi intake/penurunan.
    expect(kpiFilterScope.intake).not.toContain('statusKeaktifan');
    expect(kpiFilterScope.decline).not.toContain('statusKeaktifan');
    // ALL_YEARS: tren WNA membangun jendela tahunnya sendiri.
    expect(kpiFilterScope.foreign).not.toContain('tahunAjaran');
    expect(kpiFilterScope.foreign).toContain('statusKeaktifan');
  });

  it('memotret seleksi status bersama angkanya, bukan dari keadaan URL', async () => {
    installStub(STUDENTS);

    expect((await getStudentSummary({})).kpis.activeStudentStatus).toEqual({
      isAll: false,
      statuses: ['Aktif'],
      isCumulative: false,
    });
    // "Semua status" = sentinel ALL dari client.
    expect((await getStudentSummary({ statusKeaktifan: 'ALL' })).kpis.activeStudentStatus).toEqual({
      isAll: true,
      statuses: [],
      isCumulative: true,
    });
    // Urutan pilihan tidak mengubah arti, dan apa pun selain Aktif itu kumulatif.
    expect(
      (await getStudentSummary({ statusKeaktifan: ['Lulus', 'Aktif'] })).kpis.activeStudentStatus,
    ).toEqual({ isAll: false, statuses: ['Lulus', 'Aktif'], isCumulative: true });
  });

  it('bentuknya memenuhi kontrak yang dibaca client', async () => {
    installStub(STUDENTS);

    const result = await getStudentSummary({});

    // Controller mengirim `{ success: true, ...result }`; kontrak ini yang membuat
    // KPI yang berganti nama terlihat saat ditulis, bukan saat dashboard kosong.
    expect(
      contractProblems(contractFor('/students/summary'), { success: true, ...result }),
    ).toEqual([]);
  });
});
