import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getReferenceYear } = require('../../../src/utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
  getEvaluationWindow,
  getAngkatanEvaluasiStart,
} = require('../../../src/services/graduates/keberhasilanStudi');
const { STUDY_LIMITS } = require('../../../src/services/graduates/studyLimits');

// Jenjang dinamis: Profesi ikut populasi (masa studi maksimum 2 tahun).
const JENJANGS = ['S1', 'S2', 'Profesi'];

const originalAggregate = prisma.graduate.aggregate;
const originalGroupBy = prisma.student.groupBy;
const originalFindMany = prisma.student.findMany;

const REF_START = getReferenceYear();

prisma.graduate.aggregate = async () => ({
  _max: { tahunLulus: formatAcademicYearLabel(REF_START) },
});

const windowYears = (jenjang) => getEvaluationWindow(jenjang, REF_START);

/** Periode lulus tepat di semester terakhir masa studi standar jenjangnya. */
const onTimeWisuda = (jenjang, year) => `${year + STUDY_LIMITS[jenjang].onTime - 1}2`;

// Data sintetis dengan komposisi berbeda per tahun dan per jenjang, supaya
// salah pengelompokan tahun langsung terlihat. Tiap tahun juga punya satu
// lulusan S1 yang lewat masa studi maksimum: ia lulus, tapi tidak "berhasil".
function buildDataset() {
  const ref = getReferenceYear();
  const rows = [];
  for (let year = ref - 15; year <= ref + 1; year += 1) {
    for (const jenjang of JENJANGS) {
      const lulus = (year % 4) + (jenjang === 'S2' ? 1 : jenjang === 'Profesi' ? 2 : 0) + 1;
      const aktif = year % 3;
      const angkatan = formatAcademicYearLabel(year);
      for (let index = 0; index < lulus; index += 1) {
        rows.push({
          jenjang,
          fakultas: 'FT',
          angkatan,
          periodeMasuk: `${year}1`,
          graduate: { periodeWisuda: onTimeWisuda(jenjang, year) },
        });
      }
      for (let index = 0; index < aktif; index += 1) {
        rows.push({ jenjang, fakultas: 'FT', angkatan, periodeMasuk: `${year}2`, graduate: null });
      }
    }
    rows.push({
      jenjang: 'S1',
      fakultas: 'FT',
      angkatan: formatAcademicYearLabel(year),
      periodeMasuk: `${year}1`,
      graduate: { periodeWisuda: `${year + 8}1` }, // semester ke-17 > 16
    });
  }
  return rows;
}

const angkatanListOf = (where) => {
  const fromAnd = (where.AND || []).find((clause) => clause.angkatan)?.angkatan?.in;
  return fromAnd ?? null;
};

/** Baris dataset yang cocok dengan where kohort dari service. */
function matchRows(dataset, where) {
  const { jenjang, fakultas, angkatan } = where;
  const list = angkatanListOf(where);
  const userAngkatan =
    angkatan?.in ?? (Array.isArray(angkatan) ? angkatan : angkatan ? [angkatan] : null);
  return dataset.filter(
    (row) =>
      row.jenjang === jenjang &&
      (!fakultas || row.fakultas === fakultas) &&
      (!list || list.includes(row.angkatan)) &&
      (!userAngkatan || userAngkatan.includes(row.angkatan)),
  );
}

/** Penyebut lewat groupBy angkatan, pembilang lewat findMany (durasi per baris). */
function stubGroupBy(dataset, jenjangs = JENJANGS) {
  const calls = [];
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push(args);
    if (args.by.length === 1 && args.by[0] === 'jenjang') {
      return jenjangs.map((jenjang) => ({ jenjang }));
    }
    // Bukti tutup kohort (angkatan × status): dataset sintetis tak punya
    // kolom statusKeaktifan, jadi tak ada yang tutup → lag murni.
    if (args.by.includes('statusKeaktifan')) return [];
    const groups = new Map();
    for (const row of matchRows(dataset, args.where)) {
      const group = groups.get(row.angkatan) || { angkatan: row.angkatan, _count: { angkatan: 0 } };
      group._count.angkatan += 1;
      groups.set(row.angkatan, group);
    }
    return [...groups.values()];
  });
  prisma.student.findMany = vi.fn(async (args) => {
    calls.push({ ...args, findMany: true });
    return matchRows(dataset, args.where).filter((row) => row.graduate);
  });
  return calls;
}

/** Rumus independen: intake per angkatan, berhasil = lulus ≤ max × 2 semester. */
function expectedCohort(dataset, jenjang, startYear, fakultas) {
  const angkatan = formatAcademicYearLabel(Number(startYear));
  const rows = dataset.filter(
    (row) =>
      row.jenjang === jenjang &&
      row.angkatan === angkatan &&
      (!fakultas || row.fakultas === fakultas),
  );
  const maxEnd = Number(startYear) + STUDY_LIMITS[jenjang].max - 1;
  const lulus = rows.filter(
    (row) => row.graduate && Number(row.graduate.periodeWisuda.slice(0, 4)) <= maxEnd,
  ).length;
  return {
    intake: rows.length,
    successCount: lulus,
    rate: rows.length ? parseFloat(((lulus / rows.length) * 100).toFixed(2)) : null,
  };
}

describe('keberhasilan studi agregasi cohort', () => {
  afterAll(() => {
    prisma.student.groupBy = originalGroupBy;
    prisma.student.findMany = originalFindMany;
    prisma.graduate.aggregate = originalAggregate;
  });

  it('satu agregat per jenjang untuk seluruh jendela evaluasi', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const result = await getKeberhasilanStudiByAngkatan({});

    // 1 query jenjang dinamis + 1 bukti tutup + 6 agregat kohort (3 jenjang × penyebut+pembilang).
    expect(calls).toHaveLength(8);
    expect(calls[0].by).toEqual(['jenjang']);
    expect(result.s1.map((row) => row.cohortLabel)).toEqual(
      windowYears('S1').map((label) => `Angkatan ${label}`),
    );
    expect(result.profesi.map((row) => row.cohortLabel)).toEqual(
      windowYears('Profesi').map((label) => `Angkatan ${label}`),
    );
  });

  it('jenjang baru hanya menampilkan cohort yang sudah punya data', async () => {
    const target = REF_START - 2;
    const dataset = [
      {
        jenjang: 'Profesi',
        fakultas: 'FT',
        angkatan: formatAcademicYearLabel(target),
        periodeMasuk: `${target}1`,
        graduate: { periodeWisuda: `${target}2` },
      },
      {
        jenjang: 'Profesi',
        fakultas: 'FT',
        angkatan: formatAcademicYearLabel(target),
        periodeMasuk: `${target}1`,
        graduate: null,
      },
    ];
    stubGroupBy(dataset, ['Profesi']);

    const series = await getKeberhasilanStudiByAngkatan({ jenjang: 'Profesi' });

    expect(series.profesi).toHaveLength(1);
    expect(series.profesi[0]).toMatchObject({
      cohortLabel: `Angkatan ${formatAcademicYearLabel(target)}`,
      intake: 2,
      successCount: 1,
      rate: 50,
    });
  });

  it('menghasilkan angka yang sama dengan perhitungan per-tahun-ajaran lama', async () => {
    const dataset = buildDataset();
    stubGroupBy(dataset);

    const result = await getKeberhasilanStudiByAngkatan({});

    for (const jenjang of JENJANGS) {
      result[jenjang.toLowerCase()].forEach((row) => {
        expect(row).toMatchObject(expectedCohort(dataset, jenjang, String(row.angkatan)));
      });
    }
  });

  it('meneruskan filter student ke agregat dan memaknya', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    // Builder baru flat: kolom student di top-level (nesting lama tetap jalan).
    const result = await getKeberhasilanStudiByAngkatan({ fakultas: 'FT' });

    expect(calls[1].where.fakultas).toBe('FT');
    result.s1.forEach((row) => {
      expect(row).toMatchObject(expectedCohort(dataset, 'S1', String(row.angkatan), 'FT'));
    });
  });

  it('KPI kartu memakai tahun evaluasi terakhir dari jendela yang sama', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const cards = await getKeberhasilanStudi({});

    // 1 query jenjang dinamis + 1 bukti tutup + 6 agregat kohort (3 jenjang × penyebut+pembilang).
    expect(calls).toHaveLength(8);
    expect(cards.cohorts.s1?.rate).toBe(
      expectedCohort(dataset, 'S1', String(getAngkatanEvaluasiStart('S1', REF_START))).rate,
    );
    expect(cards.cohorts.s2?.rate).toBe(
      expectedCohort(dataset, 'S2', String(getAngkatanEvaluasiStart('S2', REF_START))).rate,
    );
    expect(cards.cohorts.profesi?.rate).toBe(
      expectedCohort(dataset, 'Profesi', String(getAngkatanEvaluasiStart('Profesi', REF_START)))
        .rate,
    );
    expect(cards.cohorts).toMatchObject({
      s1: { angkatan: windowYears('S1').at(-1) },
      s2: { angkatan: windowYears('S2').at(-1) },
      profesi: { angkatan: windowYears('Profesi').at(-1) },
    });
  });

  it('filter angkatan mengevaluasi angkatan terpilih, bukan kohort global', async () => {
    const dataset = buildDataset();
    stubGroupBy(dataset);
    const selectedStart = REF_START - 10;
    const selected = formatAcademicYearLabel(selectedStart);

    const cards = await getKeberhasilanStudi({ angkatan: { in: [selected] } });
    expect(cards.cohorts.s1?.rate).toBe(expectedCohort(dataset, 'S1', String(selectedStart)).rate);
    expect(cards.cohorts.s1?.angkatan).toBe(selected);

    const series = await getKeberhasilanStudiByAngkatan({ angkatan: { in: [selected] } });
    expect(series.jenjangs.find((entry) => entry.key === 's1')?.angkatanEvaluasi).toBe(selected);
    expect(series.s1.at(-1).cohortLabel).toBe(`Angkatan ${selected}`);
  });

  it('beberapa angkatan = agregat angkatan terpilih yang bisa dinilai; yang berjalan dibuang', async () => {
    const dataset = buildDataset();
    stubGroupBy(dataset);
    const olderStart = REF_START - 10;
    const newerStart = REF_START - 8;
    const runningStart = REF_START - 2; // masa studi maksimum S1 belum habis
    const labels = [olderStart, newerStart, runningStart].map((start) =>
      formatAcademicYearLabel(start),
    );

    const cards = await getKeberhasilanStudi({ angkatan: { in: labels } });
    const older = expectedCohort(dataset, 'S1', String(olderStart));
    const newer = expectedCohort(dataset, 'S1', String(newerStart));
    const pooled = older.successCount + newer.successCount;
    const intake = older.intake + newer.intake;
    expect(cards.cohorts.s1).toMatchObject({
      angkatanList: labels.slice(0, 2),
      intake,
      rate: parseFloat(((pooled / intake) * 100).toFixed(2)),
    });

    const series = await getKeberhasilanStudiByAngkatan({ angkatan: { in: labels } });
    expect(series.s1.map((row) => row.cohortLabel)).toEqual(
      labels.slice(0, 2).map((label) => `Angkatan ${label}`),
    );
    expect(series.jenjangs.find((entry) => entry.key === 's1')?.angkatanEvaluasiList).toEqual(
      labels.slice(0, 2),
    );
  });

  it('filter jenjang S2 membatalkan perhitungan lain tanpa mengirim query', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset, ['S2']);

    const cards = await getKeberhasilanStudi({ jenjang: 'S2' });
    const series = await getKeberhasilanStudiByAngkatan({ jenjang: 'S2' });

    // Jenjang yang tidak diminta → null (bukan undefined/0%).
    expect(cards.cohorts.s1).toBeUndefined();
    expect(cards.cohorts.s2).toBeDefined();
    // Kartu S2 + series S2: 2 agregat kohort (penyebut + pembilang) masing-masing +
    // 1 bukti tutup masing-masing — tanpa query jenjang, karena `jenjang` diminta eksplisit.
    expect(calls).toHaveLength(6);
    expect(series.s1).toBeUndefined();
    expect(series.s2.map((row) => row.cohortLabel)).toEqual(
      windowYears('S2').map((label) => `Angkatan ${label}`),
    );
  });

  it('filter bentuk Prisma ({ in: [...] }) juga membatalkan jenjang yang tidak diminta', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset, ['S2']);

    // `buildGraduateFilter()` menghasilkan `{ in: [...] }`, bukan string.
    const cards = await getKeberhasilanStudi({ jenjang: { in: ['S2'] } });

    expect(cards.cohorts.s1).toBeUndefined();
    expect(cards.cohorts.s2).toBeDefined();
    // 2 agregat kohort (penyebut + pembilang) untuk S2 + 1 bukti tutup, tanpa query jenjang.
    expect(calls).toHaveLength(3);
  });

  it('atribut peristiwa kelulusan tidak ikut menyaring penyebut kohort', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    await getKeberhasilanStudiByAngkatan({
      fakultas: 'FT',
      graduate: { tahunLulus: { in: ['2025/2026'] }, periodeWisuda: { endsWith: '1' } },
      statusKeaktifan: 'Lulus',
      NOT: { graduate: null }, // Input shape: builder produces this (passthrough test)
    });

    const cohortCalls = calls.filter(
      (call) => call.findMany || (call.by.length === 1 && call.by[0] === 'angkatan'),
    );
    // Dua query per jenjang (penyebut tanpa NOT, pembilang dengan NOT).
    expect(cohortCalls).toHaveLength(6);
    for (const c of cohortCalls) {
      // Atribut kelulusan dari kartu tidak bocor ke where (hanya fakultas yang diteruskan).
      expect(c.where.graduate).toBeUndefined();
      expect(c.where.statusKeaktifan).toBeUndefined();
      expect(c.where.fakultas).toBe('FT');
    }
    // Penyebut = seluruh angkatan (tidak ada NOT); pembilang = hanya yang punya baris graduate.
    const denominators = cohortCalls.filter((c) => !c.where.NOT);
    const numerators = cohortCalls.filter((c) => c.where.NOT?.graduate === null);
    expect(denominators).toHaveLength(3);
    expect(numerators).toHaveLength(3);
  });

  it('jenjang baru memakai lima cohort terbaru saat data bertambah', async () => {
    const latest = REF_START + 1;
    const originalAggregateStub = prisma.graduate.aggregate;
    prisma.graduate.aggregate = async () => ({
      _max: { tahunLulus: formatAcademicYearLabel(latest) },
    });

    try {
      const target = latest - 2;
      const dataset = [];
      for (let year = target - 5; year <= target; year += 1) {
        dataset.push({
          jenjang: 'Profesi',
          fakultas: 'FT',
          angkatan: formatAcademicYearLabel(year),
          periodeMasuk: `${year}1`,
          graduate: { periodeWisuda: `${year}2` },
        });
      }
      stubGroupBy(dataset, ['Profesi']);

      const series = await getKeberhasilanStudiByAngkatan({ jenjang: 'Profesi' });

      expect(series.profesi).toHaveLength(5);
      expect(series.profesi[0].cohortLabel).toBe(`Angkatan ${formatAcademicYearLabel(target - 4)}`);
      expect(series.profesi.at(-1).cohortLabel).toBe(`Angkatan ${formatAcademicYearLabel(target)}`);
    } finally {
      prisma.graduate.aggregate = originalAggregateStub;
    }
  });

  it('lag evaluasi = masa studi maksimum (S1 8, S2 4, Profesi 2)', () => {
    expect(getAngkatanEvaluasiStart('S1', 2026)).toBe(2018);
    expect(getAngkatanEvaluasiStart('S2', 2026)).toBe(2022);
    expect(getAngkatanEvaluasiStart('Profesi', 2026)).toBe(2024);
  });

  it('lulusan yang melewati masa studi maksimum tidak dihitung berhasil', async () => {
    const start = REF_START - 8;
    const angkatan = formatAcademicYearLabel(start);
    const dataset = [
      {
        jenjang: 'S1',
        fakultas: 'FT',
        angkatan,
        periodeMasuk: `${start}1`,
        graduate: { periodeWisuda: `${start + 7}2` },
      },
      {
        jenjang: 'S1',
        fakultas: 'FT',
        angkatan,
        periodeMasuk: `${start}1`,
        graduate: { periodeWisuda: `${start + 8}1` },
      },
    ];
    stubGroupBy(dataset, ['S1']);
    const cards = await getKeberhasilanStudi({ jenjang: 'S1' });
    // Semester ke-16 masih berhasil; semester ke-17 lulus tapi lewat batas.
    expect(cards.cohorts.s1?.angkatan).toBe(angkatan);
    expect(cards.cohorts.s1?.rate).toBe(50);
  });
});
