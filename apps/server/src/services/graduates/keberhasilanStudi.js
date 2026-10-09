/**
 * keberhasilanStudi.js
 *
 * Menghitung persentase & data komposit cohort keberhasilan studi (StudySuccessModal.jsx).
 */

const prisma = require('../../config/prisma');
const { getAcademicYearStart, getReferenceLabelStart } = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { roundedRate } = require('../../utils/percentageUtils');
const { getRequestedJenjang } = require('./filterBuilder');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Kohort yang dievaluasi = label angkatan `lag` tahun ajaran di belakang label
 * referensi terbaru di DB, karena hanya kohort itu yang hasil akhirnya sudah
 * pasti pada tahun tersebut. Ini BUKAN batas masa studi "tepat waktu"
 * (`BATAS_STUDI_TEPAT_WAKTU` pada tepatWaktu.js); keduanya sengaja bernilai
 * dan bernama berbeda.
 *
 * `Prof` = pendidikan profesi 1 tahun: lag evaluasi 2 (masuk → lulus 1 tahun,
 * +1 tahun tenggang hasil akhir).
 */
const COHORT_EVALUATION_LAG = { S1: 7, S2: 4, PROF: 2 };
const EVALUATION_WINDOW_YEARS = 5;

/** Referensi = MAX(tahunLulus) DB; fallback kalender bila tabel kosong. */
async function getGraduateReferenceStart() {
  const latest = await prisma.graduate.aggregate({ _max: { tahunLulus: true } });
  const maxLabel = latest._max?.tahunLulus;
  return getReferenceLabelStart(maxLabel ? [maxLabel] : []);
}

function getAngkatanEvaluasiStart(jenjang, refStart) {
  const lag = COHORT_EVALUATION_LAG[jenjang] ?? COHORT_EVALUATION_LAG[jenjang?.toUpperCase()];
  return lag === undefined ? null : refStart - lag;
}

/** Angkatan yang dievaluasi + 4 tahun sebelumnya, sebagai label ajaran urut naik. */
function getEvaluationWindow(jenjang, refStart) {
  const last = getAngkatanEvaluasiStart(jenjang, refStart);
  if (last === null) return [];
  return Array.from({ length: EVALUATION_WINDOW_YEARS }, (_, index) =>
    formatAcademicYearLabel(last - (EVALUATION_WINDOW_YEARS - 1 - index)),
  );
}

/**
 * Satu agregat menutupi seluruh angkatan yang diminta; sebelumnya 2 query per
 * angkatan per jenjang (20 query untuk satu endpoint).
 */
async function countCohorts(jenjang, studentWhere, angkatanList) {
  const firstYear = getAcademicYearStart(angkatanList[0]);
  const lastYear = getAcademicYearStart(angkatanList[angkatanList.length - 1]);
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

  const starts = angkatanList.map((label) => String(getAcademicYearStart(label)));
  const cohorts = new Map(angkatanList.map((angkatan) => [angkatan, { total: 0, lulus: 0 }]));
  for (const row of rows) {
    const count = row._count.periodeMasuk;
    const index = starts.findIndex((year) => String(row.periodeMasuk).startsWith(year));
    if (index === -1) continue;
    const cohort = cohorts.get(angkatanList[index]);
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
 * peristiwa kelulusan (`tahunLulus`, `periodeWisuda`, `predikat`) sengaja
 * tidak berpengaruh: memakainya akan memaksa pembilang metrik mendekati 100%.
 * Builder baru flat (kolom student top-level); nesting `student` lama tetap
 * diterima. `jenjang` dinamis: filter user menang, tanpanya = jenjang yang ada
 * di populasi (distinct DB).
 */
async function getCohortScope(whereFilter = {}) {
  const { student, graduate, tahunLulus, ...rest } = whereFilter;
  void graduate;
  void tahunLulus;
  const studentWhere = { ...(student || {}), ...rest };
  // Penyebut kohort = SELURUH angkatan (semua status): `statusKeaktifan: Lulus`
  // dari builder hanya berlaku untuk populasi kartu/tabel, bukan kohort.
  delete studentWhere.statusKeaktifan;
  delete studentWhere.jenjang;
  let jenjangs = getRequestedJenjang(whereFilter);
  if (!jenjangs) {
    const rows = await prisma.student.groupBy({ by: ['jenjang'], where: studentWhere });
    jenjangs = rows.map((row) => row.jenjang).sort();
  }
  return { studentWhere, jenjangs };
}

/** Metrik yang jenjangnya tidak diminta → null, bukan 0% atau array kosong palsu. */
function forJenjangs(jenjangs, compute) {
  return Promise.all(jenjangs.map((jenjang) => compute(jenjang)));
}

function angkatanLabel(jenjang, refStart) {
  const start = getAngkatanEvaluasiStart(jenjang, refStart);
  return start === null ? null : formatAcademicYearLabel(start);
}

async function getKeberhasilanStudi(whereFilter) {
  const { studentWhere, jenjangs } = await getCohortScope(whereFilter);
  const refStart = await getGraduateReferenceStart();

  const calcPercentage = async (jenjang) => {
    const angkatan = angkatanLabel(jenjang, refStart);
    if (!angkatan) return null;
    const cohorts = await countCohorts(jenjang, studentWhere, [angkatan]);
    return toPercentage(cohorts.get(angkatan));
  };

  const values = await forJenjangs(jenjangs, calcPercentage);

  const result = {};
  jenjangs.forEach((jenjang, index) => {
    result[jenjang.toLowerCase()] = values[index];
  });
  // Kunci lama untuk kompatibilitas kartu S1/S2 yang sudah ada.
  result.s1 = result.s1 ?? null;
  result.s2 = result.s2 ?? null;
  result.angkatanS1 = angkatanLabel('S1', refStart);
  result.angkatanS2 = angkatanLabel('S2', refStart);
  return result;
}

async function getKeberhasilanStudiByAngkatan(whereFilter) {
  const { studentWhere, jenjangs } = await getCohortScope(whereFilter);
  const refStart = await getGraduateReferenceStart();

  const calcSeries = async (jenjang) => {
    const angkatanList = getEvaluationWindow(jenjang, refStart);
    if (!angkatanList.length) return null;
    const cohorts = await countCohorts(jenjang, studentWhere, angkatanList);

    return angkatanList.map((angkatanLabel) => {
      const { total, lulus } = cohorts.get(angkatanLabel);
      const start = getAcademicYearStart(angkatanLabel);
      // Satu nama per metrik: `intake`/`successCount` adalah field kontrak, nilai
      // mentah `total`/`lulus` hanya dipakai internal di atas. `angkatan`
      // tetap angka start untuk kompatibilitas, label verbatim dibaca modal.
      return {
        angkatan: start,
        cohortLabel: `Angkatan ${angkatanLabel}`,
        rate: toPercentage({ total, lulus }),
        successCount: lulus,
        intake: total,
      };
    });
  };

  const values = await forJenjangs(jenjangs, calcSeries);

  const result = {};
  jenjangs.forEach((jenjang, index) => {
    result[jenjang.toLowerCase()] = values[index];
  });
  result.s1 = result.s1 ?? null;
  result.s2 = result.s2 ?? null;
  result.batasStudiS1 = COHORT_EVALUATION_LAG.S1;
  result.batasStudiS2 = COHORT_EVALUATION_LAG.S2;
  result.batasStudiProf = COHORT_EVALUATION_LAG.PROF;
  result.angkatanEvaluasiS1 = angkatanLabel('S1', refStart);
  result.angkatanEvaluasiS2 = angkatanLabel('S2', refStart);
  result.angkatanEvaluasiProf = angkatanLabel('Prof', refStart);
  return result;
}

module.exports = {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
  getEvaluationWindow,
  getAngkatanEvaluasiStart,
  COHORT_EVALUATION_LAG,
};
