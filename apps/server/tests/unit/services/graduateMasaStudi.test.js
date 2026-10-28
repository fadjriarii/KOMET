import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { studySemesters, studyPeriodRange } = require('../../../src/utils/academicUtils');
const { masaStudiOf, MAX_CUTI_DEDUCTED } = require('../../../src/services/graduates/masaStudi');
const { buildGraduateCards } = require('../../../src/services/graduates/graduateCards');

const graduate = (overrides = {}) => ({
  periodeMasuk: '20201',
  periodeMasukAwal: '',
  periodeTerakhir: '20232',
  angkatan: '2020/2021',
  cutiPeriods: [],
  graduate: { periodeWisuda: '20232', tahunLulus: '2023/2024' },
  ...overrides,
});

describe('studySemesters: akhir studi', () => {
  it('periode wisuda dulu, lalu periode terakhir /mahasiswa, lalu tahun lulus sebagai Genap', () => {
    expect(studySemesters({ periodeMasuk: '20201' }, { periodeWisuda: '20232' })).toBe(8);
    expect(studySemesters({ periodeMasuk: '20201', periodeTerakhir: '20232' }, {})).toBe(8);
    expect(studySemesters({ periodeMasuk: '20201' }, { tahunLulus: '2023/2024' })).toBe(8);
    expect(studySemesters({}, { periodeWisuda: '20232' })).toBeNull();
  });

  it('semester pendek (YYYY3) tidak dihitung: dibaca Genap tahun itu', () => {
    expect(studyPeriodRange({ periodeMasuk: '20171', periodeTerakhir: '20203' }, {})).toEqual({
      start: '20171',
      end: '20202',
      semesters: 8,
    });
  });

  it('pindah prodi di i3L dihitung dari awal rantai (periodeMasukAwal)', () => {
    expect(
      studySemesters(
        { periodeMasuk: '20211', periodeMasukAwal: '20201' },
        { periodeWisuda: '20232' },
      ),
    ).toBe(8);
  });
});

describe('masaStudiOf: pengurangan cuti', () => {
  it('cuti di rentang studi dikurangkan paling banyak 2 semester', () => {
    expect(MAX_CUTI_DEDUCTED).toBe(2);
    expect(masaStudiOf(graduate())).toEqual({ semesters: 8, deducted: 0 });
    expect(masaStudiOf(graduate({ cutiPeriods: [{ periode: '20211' }] }))).toEqual({
      semesters: 7,
      deducted: 1,
    });
    const tigaCuti = [{ periode: '20211' }, { periode: '20212' }, { periode: '20221' }];
    expect(masaStudiOf(graduate({ cutiPeriods: tigaCuti }))).toEqual({ semesters: 6, deducted: 2 });
  });

  it('cuti di luar rentang studi tidak dikurangkan; data tidak lengkap = null', () => {
    expect(masaStudiOf(graduate({ cutiPeriods: [{ periode: '20191' }] }))).toEqual({
      semesters: 8,
      deducted: 0,
    });
    expect(masaStudiOf(graduate({ periodeMasuk: '', angkatan: '' }))).toBeNull();
  });
});

describe('kartu studyLength', () => {
  it('nilai utama = jenjang dengan lulusan terbanyak; tanpa data = kosong', () => {
    const cards = buildGraduateCards({
      masaStudi: {
        s2: { average: 4.17, count: 12, cutiAdjusted: 0 },
        s1: { average: 8.18, count: 125, cutiAdjusted: 1 },
        tahunScope: { label: '2025/2026' },
      },
    });
    expect(cards.studyLength).toMatchObject({
      value: 8.18,
      years: 4.09,
      headlineJenjang: 'S1',
      isEmpty: false,
    });
    expect(cards.studyLength.byJenjang.map((entry) => entry.label)).toEqual(['S1', 'S2']);
    expect(buildGraduateCards({ masaStudi: {} }).studyLength).toMatchObject({
      value: null,
      isEmpty: true,
    });
  });
});
