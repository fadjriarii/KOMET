import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { contractFor, contractProblems } = require('@komet/shared/contracts');

const filterOptions = require('../../../src/services/graduates/filterOptions');
const totalLulusan = require('../../../src/services/graduates/totalLulusan');
const ipkTrend = require('../../../src/services/graduates/ipkTrend');
const tepatWaktu = require('../../../src/services/graduates/tepatWaktu');
const keberhasilanStudi = require('../../../src/services/graduates/keberhasilanStudi');

const original = [
  [filterOptions, 'getGraduateFilterOptions'],
  [totalLulusan, 'getTotalLulusan'],
  [ipkTrend, 'getAvgIpk'],
  [tepatWaktu, 'getTepatWaktu'],
  [keberhasilanStudi, 'getKeberhasilanStudi'],
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

// Harus di-require SETELAH patched: service-nya mengambil fungsi saat dimuat.
const { getGraduateSummary } = require('../../../src/services/graduates/graduateSummary');

const WITH_S2 = {
  total: {
    s1: 100,
    s2: 20,
    prof: 5,
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
    prof: { average: 3.8 },
  },
  tepatWaktu: { s1: 80, s2: 70, prof: 100 },
  keberhasilan: { s1: 90, s2: null },
};

afterAll(() => {
  for (const [target, key, value] of original) target[key] = value;
});

describe('getGraduateSummary', () => {
  it('menyusun KPI dari empat agregasi tanpa menghitung ulang di client', async () => {
    AGG = WITH_S2;

    const result = await getGraduateSummary({});

    expect(result.kpis).toEqual({
      // Total = seluruh jenjang populasi (incl Prof), bukan S1+S2 saja.
      totalGraduates: 125,
      totalGraduatesS1: 100,
      totalGraduatesS2: 20,
      totalGraduatesByJenjang: { s1: 100, s2: 20, prof: 5 },
      totalScopeLabel: '2023/2024',
      totalScopePhrase: 'pada tahun ajaran 2023/2024',
      onTimeGraduationRateS1: 80,
      onTimeGraduationRateS2: 70,
      onTimeByJenjang: { s1: 80, s2: 70, prof: 100 },
      studySuccessRateS1: 90,
      averageGpaS1: 3.4,
      averageGpaS2: 3.6,
      averageGpaByJenjang: { s1: 3.4, s2: 3.6, prof: 3.8 },
    });
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

    expect(result.kpis.totalGraduates).toBeNull();
    expect(result.kpis.averageGpaS1).toBeNull();
  });

  it('mengumumkan scope untuk setiap kartu yang ada', async () => {
    AGG = WITH_S2;

    const { kpiFilterScope } = await getGraduateSummary({});

    // Badge "Terfilter" di client membaca kunci ini; kunci yang tidak diumumkan
    // membuat kartu tampak tidak terfilter padahal angkanya berubah.
    expect(Object.keys(kpiFilterScope).sort()).toEqual(['gpa', 'onTime', 'studySuccess', 'total']);
    expect(kpiFilterScope.studySuccess).not.toContain('tahunLulus');
  });

  it('bentuknya memenuhi kontrak yang dibaca client', async () => {
    AGG = WITH_S2;

    const result = await getGraduateSummary({});

    expect(
      contractProblems(contractFor('/graduates/summary'), { success: true, ...result }),
    ).toEqual([]);
  });
});
