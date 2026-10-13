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
  COHORT_EVALUATION_LAG,
} = require('../../../src/services/graduates/keberhasilanStudi');

// Jenjang dinamis: Profesi ikut populasi (lag 2 — profesi 1 tahun + 1 tenggang).
const JENJANGS = ['S1', 'S2', 'Profesi'];

const originalAggregate = prisma.graduate.aggregate;
const originalGroupBy = prisma.student.groupBy;

const REF_START = getReferenceYear();

prisma.graduate.aggregate = async () => ({
  _max: { tahunLulus: formatAcademicYearLabel(REF_START) },
});

const windowYears = (jenjang) => getEvaluationWindow(jenjang, REF_START);

// Data sintetis dengan komposisi berbeda per tahun dan per jenjang, supaya
// salah pengelompokan tahun langsung terlihat. Pembilang kohort kini dibaca
// dari relasi `graduate` (baris `/kelulusan`), bukan status mahasiswa.
function buildDataset() {
  const ref = getReferenceYear();
  const rows = [];
  for (let year = ref - 15; year <= ref + 1; year += 1) {
    for (const jenjang of JENJANGS) {
      const lulus = (year % 4) + (jenjang === 'S2' ? 1 : jenjang === 'Profesi' ? 2 : 0) + 1;
      const aktif = year % 3;
      for (let index = 0; index < lulus; index += 1) {
        rows.push({ jenjang, fakultas: 'FT', periodeMasuk: `${year}1`, graduate: true });
      }
      for (let index = 0; index < aktif; index += 1) {
        rows.push({ jenjang, fakultas: 'FT', periodeMasuk: `${year}2`, graduate: false });
      }
    }
  }
  // Periode tanpa suffix Ganjil/Genap: menguji batas range leksikografis.
  rows.push({
    jenjang: 'S1',
    fakultas: 'FT',
    periodeMasuk: String(ref - 7),
    graduate: true,
  });
  return rows;
}

/** Kelompok periodeMasuk sesuai where yang diminta service (dua query/jenjang). */
function stubGroupBy(dataset, jenjangs = JENJANGS) {
  const calls = [];
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push(args);
    if (args.by.length === 1 && args.by[0] === 'jenjang') {
      return jenjangs.map((jenjang) => ({ jenjang }));
    }
    const { jenjang, fakultas, periodeMasuk, NOT } = args.where;
    let matched = dataset.filter(
      (row) =>
        row.jenjang === jenjang &&
        (!fakultas || row.fakultas === fakultas) &&
        row.periodeMasuk >= periodeMasuk.gte &&
        row.periodeMasuk < periodeMasuk.lt,
    );
    // Query dengan `NOT: { graduate: null }` = pembilang (punya baris
    // kelulusan); tanpa itu = penyebut seluruh angkatan.
    if (NOT) matched = matched.filter((row) => row.graduate);
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
  return calls;
}

/** Rumus independen: dua hitung per angkatan (periodeMasuk + punya graduate). */
function expectedCohort(dataset, jenjang, angkatan, fakultas) {
  const rows = dataset.filter(
    (row) =>
      row.jenjang === jenjang &&
      row.periodeMasuk.startsWith(angkatan) &&
      (!fakultas || row.fakultas === fakultas),
  );
  const lulus = rows.filter((row) => row.graduate).length;
  return {
    intake: rows.length,
    successCount: lulus,
    rate: rows.length ? parseFloat(((lulus / rows.length) * 100).toFixed(2)) : null,
  };
}

describe('keberhasilan studi agregasi cohort', () => {
  afterAll(() => {
    prisma.student.groupBy = originalGroupBy;
    prisma.graduate.aggregate = originalAggregate;
  });

  it('satu agregat per jenjang untuk seluruh jendela evaluasi', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const result = await getKeberhasilanStudiByAngkatan({});

    // 1 query jenjang dinamis + 6 agregat kohort (3 jenjang × penyebut+pembilang).
    expect(calls).toHaveLength(7);
    expect(calls[0].by).toEqual(['jenjang']);
    expect(result.s1.map((row) => row.cohortLabel)).toEqual(
      windowYears('S1').map((label) => `Angkatan ${label}`),
    );
    expect(result.profesi.map((row) => row.cohortLabel)).toEqual(
      windowYears('Profesi').map((label) => `Angkatan ${label}`),
    );
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

    // 1 query jenjang dinamis + 6 agregat kohort (3 jenjang × penyebut+pembilang).
    expect(calls).toHaveLength(7);
    expect(cards.s1).toBe(
      expectedCohort(dataset, 'S1', String(getAngkatanEvaluasiStart('S1', REF_START))).rate,
    );
    expect(cards.s2).toBe(
      expectedCohort(dataset, 'S2', String(getAngkatanEvaluasiStart('S2', REF_START))).rate,
    );
    expect(cards.profesi).toBe(
      expectedCohort(dataset, 'Profesi', String(getAngkatanEvaluasiStart('Profesi', REF_START)))
        .rate,
    );
    expect(cards).toMatchObject({
      angkatanS1: windowYears('S1').at(-1),
      angkatanS2: windowYears('S2').at(-1),
    });
  });

  it('filter jenjang S2 membatalkan perhitungan lain tanpa mengirim query', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset, ['S2']);

    const cards = await getKeberhasilanStudi({ jenjang: 'S2' });
    const series = await getKeberhasilanStudiByAngkatan({ jenjang: 'S2' });

    // Jenjang yang tidak diminta → null (bukan undefined/0%).
    expect(cards.s1).toBeNull();
    expect(cards.s2).not.toBeNull();
    // Kartu S2 + series S2: 2 agregat kohort (penyebut + pembilang) masing-masing —
    // tanpa query jenjang, karena `jenjang` diminta eksplisit.
    expect(calls).toHaveLength(4);
    expect(series.s1).toBeNull();
    expect(series.s2.map((row) => row.cohortLabel)).toEqual(
      windowYears('S2').map((label) => `Angkatan ${label}`),
    );
  });

  it('filter bentuk Prisma ({ in: [...] }) juga membatalkan jenjang yang tidak diminta', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset, ['S2']);

    // `buildGraduateFilter()` menghasilkan `{ in: [...] }`, bukan string.
    const cards = await getKeberhasilanStudi({ jenjang: { in: ['S2'] } });

    expect(cards.s1).toBeNull();
    expect(cards.s2).not.toBeNull();
    // 2 agregat kohort (penyebut + pembilang) untuk S2, tanpa query jenjang.
    expect(calls).toHaveLength(2);
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
      (call) => call.by.length === 1 && call.by[0] === 'periodeMasuk',
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

  it('lag evaluasi Profesi = 2 (profesi 1 tahun + 1 tenggang)', () => {
    expect(COHORT_EVALUATION_LAG.PROFESI).toBe(2);
  });
});
