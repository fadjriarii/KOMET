/**
 * keberhasilanStudi.js
 *
 * Menghitung persentase & data komposit cohort keberhasilan studi (StudySuccessModal.jsx).
 */

const prisma = require('../../config/prisma');
const { getReferenceYear } = require('../../utils/academicUtils');
const { roundedRate } = require('../../utils/percentageUtils');
const { getRequestedJenjang } = require('./filterBuilder');
const { JENJANGS } = require('@komet/shared/constants');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Kohort yang dievaluasi = angkatan `n` tahun di belakang tahun referensi,
 * karena hanya kohort itu yang hasil akhirnya sudah pasti pada tahun tersebut.
 * Ini BUKAN batas masa studi "tepat waktu" (`BATAS_STUDI_TEPAT_WAKTU` pada
 * tepatWaktu.js); keduanya sengaja bernilai dan bernama berbeda.
 */
const COHORT_EVALUATION_LAG = { S1: 7, S2: 4 };
const EVALUATION_WINDOW_YEARS = 5;

function getAngkatanEvaluasi(jenjang) {
  const refYear = getReferenceYear();
  return String(refYear - COHORT_EVALUATION_LAG[jenjang]);
}

/** Angkatan yang dievaluasi + 4 tahun sebelumnya, urut naik. */
function getEvaluationWindow(jenjang) {
  const last = Number(getAngkatanEvaluasi(jenjang));
  return Array.from({ length: EVALUATION_WINDOW_YEARS }, (_, index) =>
    String(last - (EVALUATION_WINDOW_YEARS - 1 - index)),
  );
}

/**
 * Satu agregat menutupi seluruh angkatan yang diminta; sebelumnya 2 query per
 * angkatan per jenjang (20 query untuk satu endpoint).
 */
async function countCohorts(jenjang, studentWhere, angkatanList) {
  const firstYear = Number(angkatanList[0]);
  const lastYear = Number(angkatanList[angkatanList.length - 1]);
  const rows = await prisma.student.groupBy({
    by: ['periodeMasuk', 'statusKeaktifan'],
    where: {
      ...studentWhere,
      jenjang,
      // Batas leksikografis: '2020' <= v < '2021' mengambil seluruh periode tahun 2020.
      periodeMasuk: { gte: String(firstYear), lt: String(lastYear + 1) },
    },
    _count: { periodeMasuk: true },
  });

  const cohorts = new Map(angkatanList.map((angkatan) => [angkatan, { total: 0, lulus: 0 }]));
  for (const row of rows) {
    const count = row._count.periodeMasuk;
    const angkatan = angkatanList.find((year) => String(row.periodeMasuk).startsWith(year));
    if (!angkatan) continue;
    const cohort = cohorts.get(angkatan);
    cohort.total += count;
    if (row.statusKeaktifan === STUDENT_STATUS.LULUS) cohort.lulus += count;
  }
  return cohorts;
}

function toPercentage({ total, lulus }) {
  return roundedRate(lulus, total, null);
}

/**
 * Kontrak filter metrik kohort. Pertanyaannya "dari yang masuk angkatan X,
 * berapa yang akhirnya lulus?" — penyebutnya seluruh kohort, jadi atribut satu
 * peristiwa kelulusan (`tahunLulus`, `periodeWisuda`, `statusKelulusan`) sengaja
 * tidak berpengaruh: memakainya akan memaksa pembilang metrik mendekati 100%.
 * Yang dibaca hanya sisi mahasiswa dan `jenjang`, sama seperti kartu intake di
 * tab Student yang mengabaikan status.
 */
function getCohortScope(whereFilter = {}) {
  return {
    studentWhere: whereFilter.student || {},
    jenjangs: getRequestedJenjang(whereFilter),
  };
}

/** Metrik yang jenjangnya tidak diminta → null, bukan 0% atau array kosong palsu. */
function forJenjangs(jenjangs, compute) {
  return Promise.all(
    JENJANGS.map((jenjang) => (jenjangs.includes(jenjang) ? compute(jenjang) : null)),
  );
}

async function getKeberhasilanStudi(whereFilter) {
  const { studentWhere, jenjangs } = getCohortScope(whereFilter);

  const calcPercentage = async (jenjang) => {
    const angkatan = getAngkatanEvaluasi(jenjang);
    const cohorts = await countCohorts(jenjang, studentWhere, [angkatan]);
    return toPercentage(cohorts.get(angkatan));
  };

  const [s1, s2] = await forJenjangs(jenjangs, calcPercentage);

  return {
    s1,
    s2,
    angkatanS1: getAngkatanEvaluasi('S1'),
    angkatanS2: getAngkatanEvaluasi('S2'),
  };
}

async function getKeberhasilanStudiByAngkatan(whereFilter) {
  const { studentWhere, jenjangs } = getCohortScope(whereFilter);

  const calcSeries = async (jenjang) => {
    const angkatanList = getEvaluationWindow(jenjang);
    const cohorts = await countCohorts(jenjang, studentWhere, angkatanList);

    return angkatanList.map((angkatanStr) => {
      const { total, lulus } = cohorts.get(angkatanStr);
      // Satu nama per metrik: `intake`/`successCount` adalah field kontrak, nilai
      // mentah `total`/`lulus` hanya dipakai internal di atas.
      return {
        angkatan: angkatanStr,
        cohortLabel: `Angkatan ${angkatanStr}`,
        rate: toPercentage({ total, lulus }),
        successCount: lulus,
        intake: total,
      };
    });
  };

  const [s1, s2] = await forJenjangs(jenjangs, calcSeries);

  return {
    s1,
    s2,
    batasStudiS1: COHORT_EVALUATION_LAG.S1,
    batasStudiS2: COHORT_EVALUATION_LAG.S2,
    angkatanEvaluasiS1: getAngkatanEvaluasi('S1'),
    angkatanEvaluasiS2: getAngkatanEvaluasi('S2'),
  };
}

module.exports = {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
  COHORT_EVALUATION_LAG,
};
