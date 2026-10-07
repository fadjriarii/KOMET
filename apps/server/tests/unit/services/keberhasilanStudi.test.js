import { afterAll, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const prisma = require('../../../src/config/prisma');
const { getReferenceYear } = require('../../../src/utils/academicUtils');
const {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
  COHORT_EVALUATION_LAG,
} = require('../../../src/services/graduates/keberhasilanStudi');

const EVALUATION_WINDOW_YEARS = 5;
const JENJANGS = ['S1', 'S2'];

const windowYears = (jenjang) => {
  const last = getReferenceYear() - COHORT_EVALUATION_LAG[jenjang];
  return Array.from({ length: EVALUATION_WINDOW_YEARS }, (_, index) =>
    String(last - (EVALUATION_WINDOW_YEARS - 1 - index)),
  );
};

// Data sintetis dengan komposisi berbeda per tahun dan per jenjang, supaya
// salah pengelompokan tahun langsung terlihat.
function buildDataset() {
  const ref = getReferenceYear();
  const rows = [];
  for (let year = ref - 15; year <= ref + 1; year += 1) {
    for (const jenjang of JENJANGS) {
      const lulus = (year % 4) + (jenjang === 'S2' ? 1 : 0) + 1;
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
function stubGroupBy(dataset) {
  const calls = [];
  prisma.student.groupBy = vi.fn(async (args) => {
    calls.push(args);
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
  const originalGroupBy = prisma.student.groupBy;

  afterAll(() => {
    prisma.student.groupBy = originalGroupBy;
  });

  it('satu agregat per jenjang untuk seluruh jendela evaluasi', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const result = await getKeberhasilanStudiByAngkatan({});

    expect(calls).toHaveLength(2);
    expect(calls[0].by).toEqual(['periodeMasuk', 'statusKeaktifan']);
    expect(result.s1.map((row) => row.angkatan)).toEqual(windowYears('S1'));
    expect(result.s2.map((row) => row.angkatan)).toEqual(windowYears('S2'));
  });

  it('menghasilkan angka yang sama dengan perhitungan per-angkatan lama', async () => {
    const dataset = buildDataset();
    stubGroupBy(dataset);

    const result = await getKeberhasilanStudiByAngkatan({});

    for (const jenjang of JENJANGS) {
      result[jenjang.toLowerCase()].forEach((row) => {
        expect(row).toMatchObject(expectedCohort(dataset, jenjang, row.angkatan));
      });
    }
  });

  it('meneruskan filter student ke agregat dan memaknya', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const result = await getKeberhasilanStudiByAngkatan({ student: { fakultas: 'FT' } });

    expect(calls[0].where.fakultas).toBe('FT');
    result.s1.forEach((row) => {
      expect(row).toMatchObject(expectedCohort(dataset, 'S1', row.angkatan, 'FT'));
    });
  });

  it('KPI kartu memakai tahun evaluasi terakhir dari jendela yang sama', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const cards = await getKeberhasilanStudi({});

    expect(calls).toHaveLength(2);
    expect(cards.s1).toBe(expectedCohort(dataset, 'S1', windowYears('S1').at(-1)).rate);
    expect(cards.s2).toBe(expectedCohort(dataset, 'S2', windowYears('S2').at(-1)).rate);
    expect(cards).toMatchObject({
      angkatanS1: windowYears('S1').at(-1),
      angkatanS2: windowYears('S2').at(-1),
    });
  });

  it('filter jenjang S2 membatalkan perhitungan S1 tanpa mengirim query', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

    const cards = await getKeberhasilanStudi({ jenjang: 'S2' });
    const series = await getKeberhasilanStudiByAngkatan({ jenjang: 'S2' });

    expect(cards.s1).toBeNull();
    expect(cards.s2).not.toBeNull();
    // Kartu S1 + series S1 sama-sama dilewati: 1 query masing-masing.
    expect(calls).toHaveLength(2);
    expect(series.s1).toBeNull();
    expect(series.s2.map((row) => row.angkatan)).toEqual(windowYears('S2'));
  });

  it('filter bentuk Prisma ({ in: [...] }) juga membatalkan jenjang yang tidak diminta', async () => {
    const dataset = buildDataset();
    const calls = stubGroupBy(dataset);

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
      student: { fakultas: 'FT' },
      tahunLulus: { in: ['2025'] },
      periodeWisuda: { in: ['20251'] },
      statusKelulusan: { in: ['Lulus'] },
    });

    // Metrik kohort hanya membaca sisi mahasiswa; tiga filter atas `graduates`
    // sengaja tidak berpengaruh (menyaring peristiwa kelulusan akan memaksa
    // pembilangnya menjadi 100%).
    expect(calls[0].where).toEqual({
      fakultas: 'FT',
      jenjang: 'S1',
      periodeMasuk: expect.any(Object),
    });
  });
});
