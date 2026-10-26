import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contractFor, contractProblems } = require('@komet/shared/contracts');

const filterOptions = require('../../../src/services/graduates/filterOptions');
const totalLulusan = require('../../../src/services/graduates/totalLulusan');
const ipkTrend = require('../../../src/services/graduates/ipkTrend');
const tepatWaktu = require('../../../src/services/graduates/tepatWaktu');
const keberhasilanStudi = require('../../../src/services/graduates/keberhasilanStudi');
const yearJenjangSeries = require('../../../src/services/graduates/yearJenjangSeries');

const original = [
  [filterOptions, 'getGraduateFilterOptions'],
  [totalLulusan, 'getTotalLulusan'],
  [ipkTrend, 'getAvgIpk'],
  [tepatWaktu, 'getTepatWaktu'],
  [keberhasilanStudi, 'getKeberhasilanStudi'],
  [yearJenjangSeries, 'getGraduateLabelWindow'],
].map(([target, key]) => [target, key, target[key]]);

/**
 * Yang diuji di sini adalah RAKITANNYA: nama field yang dibaca client dan aturan
 * "tidak ada data = null". Angka tiap agregasi sudah punya ujinya sendiri, jadi
 * keempat service itu cukup mengembalikan bentuk yang sah lewat `AGG`.
 */
let AGG = {};

filterOptions.getGraduateFilterOptions = async () => ({ fakultas: ['FST'], jenjang: ['S1'] });
totalLulusan.getTotalLulusan = async () => AGG.total;
ipkTrend.getAvgIpk = async () => AGG.ipk;
tepatWaktu.getTepatWaktu = async () => AGG.tepatWaktu;
keberhasilanStudi.getKeberhasilanStudi = async () => AGG.keberhasilan;
yearJenjangSeries.getGraduateLabelWindow = async () => [
  '2020/2021',
  '2021/2022',
  '2022/2023',
  '2023/2024',
  '2024/2025',
];

// Harus di-require SETELAH patched: service-nya mengambil fungsi saat dimuat.
const { getGraduateSummary } = require('../../../src/services/graduates/graduateSummary');

const WITH_S2 = {
  total: {
    s1: 100,
    s2: 20,
    profesi: 5,
    tahunScope: {
      labels: ['2023/2024'],
      isDefault: false,
      label: '2023/2024',
      phrase: 'pada tahun ajaran 2023/2024',
    },
  },
  ipk: {
    s1: { average: 3.4 },
    s2: { average: 3.6 },
    profesi: { average: 3.8 },
  },
  tepatWaktu: { s1: 80, s2: 70, profesi: 100 },
  keberhasilan: { s1: 90, s2: null },
};

afterAll(() => {
  for (const [target, key, value] of original) target[key] = value;
});

describe('getGraduateSummary', () => {
  it('menyusun KPI dari empat agregasi tanpa menghitung ulang di client', async () => {
    AGG = WITH_S2;

    const result = await getGraduateSummary({});

    // `kpis` hanya berisi kartu bentuk server; tidak ada lagi field S1/S2 datar.
    expect(Object.keys(result.kpis)).toEqual(['cards']);
    const { cards } = result.kpis;
    // Total = seluruh jenjang populasi (incl Profesi), bukan S1+S2 saja.
    expect(cards.total).toMatchObject({ value: 125, isEmpty: false });
    expect(cards.total.byJenjang.map((entry) => [entry.label, entry.value])).toEqual([
      ['S1', 100],
      ['S2', 20],
      ['Profesi', 5],
    ]);
    expect(cards.total.scope).toMatchObject({ label: '2023/2024' });
    expect(cards.onTime.byJenjang.map((entry) => entry.value)).toEqual([80, 70, 100]);
    expect(cards.gpa.byJenjang.map((entry) => entry.value)).toEqual([3.4, 3.6, 3.8]);
    expect(cards.studySuccess.ignoredFilters).toEqual([]);
  });

  it('"tidak ada data" tetap null, bukan 0 yang terlihat seperti angka', async () => {
    AGG = {
      total: {
        s1: null,
        s2: null,
        tahunScope: {
          labels: [],
          isDefault: true,
          label: 'Semua Tahun',
          phrase: 'di seluruh tahun akademik tercatat',
        },
      },
      ipk: { s1: { average: null }, s2: { average: null } },
      tepatWaktu: { s1: null, s2: null },
      keberhasilan: { s1: null, s2: null },
    };

    const result = await getGraduateSummary({});

    expect(result.kpis.cards.total).toMatchObject({ value: null, isEmpty: true });
    expect(result.kpis.cards.gpa).toMatchObject({ value: null, isEmpty: true });
    expect(result.kpis.cards.onTime).toMatchObject({ value: null, isEmpty: true });
  });

  it('mengumumkan scope untuk setiap kartu yang ada', async () => {
    AGG = WITH_S2;

    const { kpiFilterScope } = await getGraduateSummary({});

    // Badge "Terfilter" di client membaca kunci ini; kunci yang tidak diumumkan
    // membuat kartu tampak tidak terfilter padahal angkanya berubah.
    expect(Object.keys(kpiFilterScope).sort()).toEqual(['gpa', 'onTime', 'studySuccess', 'total']);
    expect(kpiFilterScope.studySuccess).not.toContain('tahunLulus');
  });

  it('matriks filter tiap kartu: kohort kebal atribut peristiwa lulus', async () => {
    AGG = WITH_S2;

    const { kpiFilterScope } = await getGraduateSummary({});

    const eventParams = ['tahunLulus', 'periodeWisuda', 'predikat'];
    for (const card of ['total', 'gpa', 'onTime']) {
      for (const param of eventParams) expect(kpiFilterScope[card]).toContain(param);
    }
    for (const param of eventParams) expect(kpiFilterScope.studySuccess).not.toContain(param);
    expect([...kpiFilterScope.studySuccess].sort()).toEqual(
      ['angkatanTahun', 'fakultas', 'jenjang', 'programStudi', 'search', 'tahunAjaran'].sort(),
    );
  });

  it('bentuknya memenuhi kontrak yang dibaca client', async () => {
    AGG = WITH_S2;

    const result = await getGraduateSummary({});

    expect(
      contractProblems(contractFor('/graduates/summary'), { success: true, ...result }),
    ).toEqual([]);
  });
});
