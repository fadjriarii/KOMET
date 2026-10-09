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

// Jenjang dinamis: Prof ikut populasi (lag 2 — profesi 1 tahun + 1 tenggang).
const JENJANGS = ['S1', 'S2', 'Prof'];

const originalAggregate = prisma.graduate.aggregate;
const originalGroupBy = prisma.student.groupBy;

const REF_START = getReferenceYear();

prisma.graduate.aggregate = async () => ({
  _max: { tahunLulus: formatAcademicYearLabel(REF_START) },
});

const windowYears = (jenjang) => getEvaluationWindow(jenjang, REF_START);

// Data sintetis dengan komposisi berbeda per tahun dan per jenjang, supaya
// salah pengelompokan tahun langsung terlihat.
function buildDataset() {
  const ref = getReferenceYear();
  const rows = [];
  for (let year = ref - 15; year <= ref + 1; year += 1) {
    for (const jenjang of JENJANGS) {
      const lulus = (year % 4) + (jenjang === 'S2' ? 1 : jenjang === 'Prof' ? 2 : 0) + 1;
      const aktif = year % 3;
      for (let index = 0; index < lulus; index += 1) {
        rows.push({ jenjang, fakultas: 'FT', periodeMasuk: `${year}1`, statusKeaktifan: 'Lulus' });
      }
      for (let index = 0; index < aktif; index += 1) {
        rows.push({ jenjang, fakultas: 'FT', periodeMasuk: `${year}2`, statusKeaktifan: 'Aktif' });
      }
    }
  }
  // Periode tanpa suffix Ganjil/Genap: menguji batas range leksikografis.
  rows.push({
    jenjang: 'S1',
    fakultas: 'FT',
    periodeMasuk: String(ref - 7),
    statusKeaktifan: 'Lulus',
  });
  return rows;
}

/** Kelompok (periodeMasuk, statusKeaktifan) sesuai where yang diminta service. */
function stubGroupBy(dataset, jenjangs = JENJANGS) {
  const calls = [];
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push(args);
    // Penyebut kohort = seluruh angkatan: statusKeaktifan tak boleh ikut where.
    if (args.by.length === 1 && args.by[0] === 'jenjang') {
      return jenjangs.map((jenjang) => ({ jenjang }));
    }
    const { jenjang, fakultas, periodeMasuk } = args.where;
    const matched = dataset.filter(
      (row) =>
        row.jenjang === jenjang &&
        (!fakultas || row.fakultas === fakultas) &&
        row.periodeMasuk >= periodeMasuk.gte &&
        row.periodeMasuk < periodeMasuk.lt,
    );
    const groups = new Map();
    for (const row of matched) {
      const key = `${row.periodeMasuk}|${row.statusKeaktifan}`;
      const group = groups.get(key) || {
        periodeMasuk: row.periodeMasuk,
        statusKeaktifan: row.statusKeaktifan,
        _count: { periodeMasuk: 0 },
      };
      group._count.periodeMasuk += 1;
      groups.set(key, group);
    }
    return [...groups.values()];
  });
  return calls;
}

/** Rumus lama: dua `count` per angkatan (startsWith + status 'Lulus'). */
function expectedCohort(dataset, jenjang, angkatan, fakultas) {
  const rows = dataset.filter(
    (row) =>
      row.jenjang === jenjang &&
      row.periodeMasuk.startsWith(angkatan) &&
      (!fakultas || row.fakultas === fakultas),
  );
  const lulus = rows.filter((row) => row.statusKeaktifan === 'Lulus').length;
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

    // 1 query jenjang dinamis + 3 agregat kohort.
    expect(calls).toHaveLength(4);
    expect(calls[0].by).toEqual(['jenjang']);
    expect(result.s1.map((row) => row.cohortLabel)).toEqual(
      windowYears('S1').map((label) => `Angkatan ${label}`),
    );
    expect(result.prof.map((row) => row.cohortLabel)).toEqual(
      windowYears('Prof').map((label) => `Angkatan ${label}`),
    );
  });

  it('menghasilkan angka yang sama dengan perhitungan per-angkatan lama', async () => {
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

    expect(calls).toHaveLength(4);
    expect(cards.s1).toBe(
      expectedCohort(dataset, 'S1', String(getAngkatanEvaluasiStart('S1', REF_START))).rate,
    );
    expect(cards.s2).toBe(
      expectedCohort(dataset, 'S2', String(getAngkatanEvaluasiStart('S2', REF_START))).rate,
    );
    expect(cards.prof).toBe(
      expectedCohort(dataset, 'Prof', String(getAngkatanEvaluasiStart('Prof', REF_START))).rate,
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
    // Kartu S2 + series S2: 1 query masing-masing.
    expect(calls).toHaveLength(2);
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
    expect(calls).toHaveLength(1);
  });

  it('atribut peristiwa kelulusan tidak ikut menyaring penyebut kohort', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    await getKeberhasilanStudiByAngkatan({
      fakultas: 'FT',
      graduate: { tahunLulus: { in: ['2025/2026'] }, periodeWisuda: { endsWith: '1' } },
      statusKeaktifan: 'Lulus',
    });

    // Metrik kohort hanya membaca sisi mahasiswa; filter peristiwa kelulusan +
    // statusKeaktifan kartu sengaja tidak berpengaruh (menyaring penyebut akan
    // memaksa pembilangnya menjadi 100%).
    const cohortCalls = calls.filter(
      (call) => JSON.stringify(call.by) === JSON.stringify(['periodeMasuk', 'statusKeaktifan']),
    );
    expect(cohortCalls.length).toBeGreaterThan(0);
    for (const cohortCall of cohortCalls) {
      expect(cohortCall.where.statusKeaktifan).toBeUndefined();
      expect(cohortCall.where.graduate).toBeUndefined();
      expect(cohortCall.where.fakultas).toBe('FT');
    }
  });

  it('lag evaluasi Prof = 2 (profesi 1 tahun + 1 tenggang)', () => {
    expect(COHORT_EVALUATION_LAG.PROF).toBe(2);
  });
});
