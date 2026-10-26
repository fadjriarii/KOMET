import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildGraduateCards } = require('../../../src/services/graduates/graduateCards');

const input = {
  totalLulusan: { s1: 120, profesi: 37, s2: null, tahunScope: { label: '2025/2026' } },
  avgIpk: {
    s1: { average: 3.5, count: 100 },
    profesi: { average: 3.8, count: 50 },
    tahunScope: {},
  },
  tepatWaktu: { overall: 0, s1: 0, profesi: null, s2: null, referenceLabel: '2025/2026' },
  keberhasilanStudi: {
    s1: 82.72,
    profesi: 90,
    angkatanS1: '2017/2018',
    cohorts: {
      s1: { rate: 82.72, intake: 191, angkatan: '2017/2018' },
      profesi: { rate: 90, intake: 20, angkatan: '2024/2025' },
    },
  },
};

describe('buildGraduateCards', () => {
  const cards = buildGraduateCards(input);

  it('total = jumlah, rincian hanya jenjang berdata, urutan dan label kanonis', () => {
    expect(cards.total.value).toBe(157);
    expect(cards.total.isEmpty).toBe(false);
    expect(cards.total.byJenjang.map((entry) => entry.label)).toEqual(['S1', 'Profesi']);
  });

  it('IPK = rata-rata tertimbang jumlah lulusan, bukan rata-rata dari rata-rata', () => {
    expect(cards.gpa.value).toBe(3.6);
    expect(cards.gpa.count).toBe(150);
  });

  it('tepat waktu 0% adalah nilai sah, null tidak masuk rincian', () => {
    expect(cards.onTime.value).toBe(0);
    expect(cards.onTime.isEmpty).toBe(false);
    expect(cards.onTime.byJenjang).toEqual([
      { key: 's1', jenjang: 'S1', label: 'S1', value: 0, batas: 4 },
    ]);
  });

  it('keberhasilan studi memakai jenjang dengan intake terbesar sebagai nilai utama', () => {
    expect(cards.studySuccess).toMatchObject({
      value: 82.72,
      headlineJenjang: 'S1',
      isEmpty: false,
    });
    expect(cards.studySuccess.byJenjang[1]).toMatchObject({
      label: 'Profesi',
      angkatan: '2024/2025',
      batas: 2,
    });
  });

  it('scope kosong ditandai isEmpty dengan nilai null', () => {
    const empty = buildGraduateCards({
      totalLulusan: { s1: null },
      avgIpk: {},
      tepatWaktu: { overall: null },
      keberhasilanStudi: { cohorts: {} },
    });
    expect(empty.total).toEqual({ value: null, isEmpty: true, byJenjang: [] });
    expect(empty.gpa.isEmpty).toBe(true);
    expect(empty.onTime.isEmpty).toBe(true);
    expect(empty.studySuccess).toMatchObject({ value: null, isEmpty: true });
  });
});

describe('ignoredStudySuccessFilters', () => {
  const { ignoredStudySuccessFilters } = require('../../../src/services/graduates/graduateSummary');

  it('menyebut filter event aktif, kecuali Tahun Lulus default', () => {
    expect(ignoredStudySuccessFilters({ tahunLulus: '2025/2026' }, '2025/2026')).toEqual([]);
    expect(
      ignoredStudySuccessFilters(
        { tahunLulus: ['2022/2023'], periodeWisuda: 'Ganjil', predikat: ['Memuaskan'] },
        '2025/2026',
      ),
    ).toEqual(['tahunLulus', 'periodeWisuda', 'predikat']);
  });
});

describe('seriesJenjangs', () => {
  const { seriesJenjangs } = require('../../../src/services/graduates/graduateCards');

  it('jenjang deret per tahun yang berisi data, berurutan kanonis', () => {
    const rows = [
      { tahun: '2024/2025', profesiCount: 3, s1Count: 10, s2Count: 0, total: 13 },
      { tahun: '2025/2026', profesiCount: 0, s1Count: 12, s2Count: 0, total: 12 },
    ];
    expect(seriesJenjangs(rows, 'Count')).toEqual([
      { key: 's1', jenjang: 'S1', label: 'S1', dataKey: 's1Count' },
      { key: 'profesi', jenjang: 'Profesi', label: 'Profesi', dataKey: 'profesiCount' },
    ]);
  });
});
