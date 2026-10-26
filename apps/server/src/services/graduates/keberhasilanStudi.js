/**
 * keberhasilanStudi.js
 *
 * Menghitung persentase & data komposit cohort keberhasilan studi (StudySuccessModal.jsx).
 */

const prisma = require('../../config/prisma');
const { getAcademicYearStart, studySemesters } = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { toArray } = require('@komet/shared/filterUtils');
const { roundedRate } = require('../../utils/percentageUtils');
const { getRequestedJenjang } = require('./filterBuilder');
const { getTahunAjaranLabel, tahunAjaranStart } = require('./tahunAjaran');
const { studyLimitsFor } = require('./studyLimits');
const { getGraduateReferenceStart } = require('./yearJenjangSeries');
const { jenjangTabs } = require('./graduateCards');

/**
 * Kohort yang dievaluasi = yang terbaru dari dua sumber: (a) lag di bawah,
 * batas bawah yang tidak pernah lebih tua dari aturan; (b) angkatan terbaru
 * yang datanya membuktikan tutup — nol mahasiswa enrolled (Aktif/Cuti).
 * (b) membuat kartu mengikuti sync (2019 naik begitu Aktif terakhirnya
 * beres), (a) menjamin tak pernah prematur atau lebih tua dari aturan.
 * Jangkar `tahunAjaran` mematikan (b): tampilan "sampai tahun X" tak boleh
 * menampilkan kohort yang lebih muda dari jangkar.
 *
 * Lag = masa studi maksimum jenjang (`max` di studyLimits.js, ADR 0004):
 * angkatan TA − max adalah yang paling baru yang batas waktunya sudah habis.
 * Pembilang hanya lulusan yang selesai dalam ≤ max × 2 semester.
 */
const EVALUATION_WINDOW_YEARS = 5;

// Status yang berarti masih kuliah: kohort yang masih punya satu pun ini
// belum boleh dinilai final.
const ENROLLED_STATUS = new Set(['aktif', 'cuti']);

/**
 * refStart jendela kohort: jangkar `tahunAjaran` (Opsi A, meta dari
 * filterBuilder) menang → tahun awal tahun ajaran itu; tanpa jangkar →
 * ref all-time dari DB. Satu-satunya titik override refStart.
 */
async function resolveRefStart(whereFilter = {}) {
  const anchor = getTahunAjaranLabel(whereFilter?.tahunAjaran);
  return anchor ? tahunAjaranStart(anchor) : getGraduateReferenceStart();
}

function getAngkatanEvaluasiStart(jenjang, refStart) {
  const lag = cohortLagFor(jenjang);
  return lag === null ? null : refStart - lag;
}

/** Lag evaluasi (tahun) satu jenjang, null bila aturannya belum ada. */
function cohortLagFor(jenjang) {
  return studyLimitsFor(jenjang)?.max ?? null;
}

/** Angkatan yang dievaluasi + 4 tahun sebelumnya, sebagai label ajaran urut naik. */
function getEvaluationWindow(
  jenjang,
  refStart,
  lastStart = getAngkatanEvaluasiStart(jenjang, refStart),
) {
  if (lastStart === null) return [];
  return Array.from({ length: EVALUATION_WINDOW_YEARS }, (_, index) =>
    formatAcademicYearLabel(lastStart - (EVALUATION_WINDOW_YEARS - 1 - index)),
  );
}

/**
 * Tahun mulai angkatan terbaru per jenjang yang nol enrolled — satu query
 * untuk semua jenjang dalam scope filter (fakultas/prodi/search/angkatan
 * ikut mempersempit, seperti penyebut). Label tak terparse dilewati.
 * Mengembalikan Map kunci jenjang lowercase → tahun mulai.
 */
async function getClosedCohortStarts(studentWhere) {
  const rows = await prisma.student.groupBy({
    by: ['jenjang', 'angkatan', 'statusKeaktifan'],
    where: studentWhere,
    _count: { angkatan: true },
  });
  const enrolledByKey = new Map();
  for (const row of rows) {
    const key = `${row.jenjang}|||${row.angkatan}`;
    if (
      ENROLLED_STATUS.has(
        String(row.statusKeaktifan || '')
          .trim()
          .toLowerCase(),
      )
    ) {
      enrolledByKey.set(key, true);
    } else if (!enrolledByKey.has(key)) {
      enrolledByKey.set(key, false);
    }
  }
  const closedStarts = new Map();
  for (const [key, enrolled] of enrolledByKey) {
    if (enrolled) continue;
    const [jenjang, ...labelParts] = key.split('|||');
    const start = getAcademicYearStart(labelParts.join('|||'));
    if (start === null) continue;
    const lower = jenjang.toLowerCase();
    if (closedStarts.get(lower) === undefined || start > closedStarts.get(lower)) {
      closedStarts.set(lower, start);
    }
  }
  return closedStarts;
}

/**
 * Tahun mulai kohort yang dievaluasi: terbaru dari lag vs bukti tutup.
 * Lag tak dikenal = bukti tutup saja; keduanya kosong = null (tak dinilai).
 */
function evaluatedStartFor(jenjang, { refStart, closedStart }) {
  const lagStart = getAngkatanEvaluasiStart(jenjang, refStart);
  const candidates = [lagStart, closedStart ?? null].filter((value) => value !== null);
  return candidates.length ? Math.max(...candidates) : null;
}

/** Angkatan yang dipilih user, sudah dinormalisasi menjadi tahun mulai. */
function getSelectedAngkatanStarts(whereFilter = {}) {
  const angkatanFilter = whereFilter.angkatan ?? whereFilter.student?.angkatan;
  const values = toArray(angkatanFilter?.in ?? angkatanFilter) || [];
  return [
    ...new Set(
      values
        .map((value) => getAcademicYearStart(String(value ?? '').trim()))
        .filter((value) => value !== null),
    ),
  ].sort((a, b) => a - b);
}

/**
 * Filter angkatan eksplisit menggeser kohort evaluasi ke angkatan terpilih,
 * bukan tetap memakai kohort global. Kalau beberapa angkatan dipilih, pakai
 * yang terbaru yang sudah evaluable; angkatan muda yang masih berjalan null.
 */
function resolveEvaluatedStart(jenjang, { refStart, closedStart, selectedStarts = [] }) {
  if (!selectedStarts.length) return evaluatedStartFor(jenjang, { refStart, closedStart });
  const lagStart = getAngkatanEvaluasiStart(jenjang, refStart);
  const eligible = selectedStarts.filter(
    (start) => (lagStart !== null && start <= lagStart) || start === closedStart,
  );
  return eligible.length ? eligible[eligible.length - 1] : null;
}

/**
 * Penyebut = seluruh mahasiswa angkatan itu (semua status); pembilang = yang
 * punya baris graduate DAN lulus dalam ≤ max × 2 semester. Keanggotaan kohort
 * dibaca dari kolom `angkatan` — kolom yang sama dengan filter Angkatan dan
 * pengelompokan Tepat Waktu. Filter angkatan user tetap di-AND-kan.
 */
async function countCohorts(jenjang, studentWhere, angkatanList) {
  const base = {
    ...studentWhere,
    jenjang,
    AND: [...(studentWhere.AND || []), { angkatan: { in: angkatanList } }],
  };
  const maxSemesters = (cohortLagFor(jenjang) ?? 0) * 2;
  const [totalRows, graduates] = await Promise.all([
    prisma.student.groupBy({
      by: ['angkatan'],
      where: base,
      _count: { angkatan: true },
    }),
    prisma.student.findMany({
      where: { ...base, NOT: { graduate: null } },
      select: {
        angkatan: true,
        periodeMasuk: true,
        periodeMasukAwal: true,
        graduate: { select: { periodeWisuda: true, tahunLulus: true } },
      },
    }),
  ]);

  const cohorts = new Map(angkatanList.map((angkatan) => [angkatan, { total: 0, lulus: 0 }]));
  for (const row of totalRows) {
    const cohort = cohorts.get(row.angkatan);
    if (cohort) cohort.total += row._count.angkatan;
  }
  for (const student of graduates) {
    const cohort = cohorts.get(student.angkatan);
    const semesters = studySemesters(student, student.graduate);
    if (cohort && semesters !== null && semesters <= maxSemesters) cohort.lulus += 1;
  }
  return cohorts;
}

function toPercentage({ total, lulus }) {
  return roundedRate(lulus, total, null);
}

/**
 * Kontrak filter metrik kohort. Pertanyaannya "dari yang masuk angkatan X,
 * berapa yang lulus dalam masa studi maksimum?" — penyebutnya seluruh kohort, jadi atribut satu
 * peristiwa kelulusan (`tahunLulus`, `periodeWisuda`, `predikat`) sengaja
 * tidak berpengaruh: memakainya akan memaksa pembilang metrik mendekati 100%.
 * Builder baru flat (kolom student top-level); nesting `student` lama tetap
 * diterima. `jenjang` dinamis: filter user menang, tanpanya = jenjang yang ada
 * di populasi (distinct DB).
 */
async function getCohortScope(whereFilter = {}) {
  const { student, graduate, NOT, tahunLulus, ...rest } = whereFilter;
  void graduate;
  void NOT;
  void tahunLulus;
  const studentWhere = { ...(student || {}), ...rest };
  // `tahunAjaran` = meta jangkar kohort Opsi A, bukan kolom Prisma — buang
  // seperti `graduate`/`NOT`/`tahunLulus` di atas supaya tak bocor ke query.
  delete studentWhere.tahunAjaran;
  // Penyebut kohort = SELURUH angkatan: status mahasiswa (maupun relasi
  // `graduate` dari kartu) tidak boleh ikut menyaring; pembilang dibaca
  // terpisah lewat relasi `graduate` (lihat `countCohorts`).
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

function angkatanLabelFromStart(start) {
  return start === null ? null : formatAcademicYearLabel(start);
}

async function getKeberhasilanStudi(whereFilter) {
  const { studentWhere, jenjangs } = await getCohortScope(whereFilter);
  const refStart = await resolveRefStart(whereFilter);
  // Tanpa jangkar: bukti tutup dari data boleh memajukan evaluasi.
  // Dengan jangkar tahunAjaran: murni lag (tampilan "sampai tahun X").
  const anchor = getTahunAjaranLabel(whereFilter?.tahunAjaran);
  const closedStarts = anchor ? new Map() : await getClosedCohortStarts(studentWhere);
  const selectedStarts = getSelectedAngkatanStarts(whereFilter);
  const evalStart = (jenjang) =>
    resolveEvaluatedStart(jenjang, {
      refStart,
      closedStart: closedStarts.get(jenjang.toLowerCase()) ?? null,
      selectedStarts,
    });

  const calcCohort = async (jenjang) => {
    const start = evalStart(jenjang);
    if (start === null) return null;
    const angkatan = formatAcademicYearLabel(start);
    const cohorts = await countCohorts(jenjang, studentWhere, [angkatan]);
    const cohort = cohorts.get(angkatan);
    return { rate: toPercentage(cohort), intake: cohort.total, angkatan };
  };

  const values = await forJenjangs(jenjangs, calcCohort);

  // Fakta lengkap per jenjang (rate + intake + angkatan dari satu agregat).
  const result = { cohorts: {} };
  jenjangs.forEach((jenjang, index) => {
    if (values[index]) result.cohorts[jenjang.toLowerCase()] = values[index];
  });
  return result;
}

async function getKeberhasilanStudiByAngkatan(whereFilter) {
  const { studentWhere, jenjangs } = await getCohortScope(whereFilter);
  const refStart = await resolveRefStart(whereFilter);
  const anchor = getTahunAjaranLabel(whereFilter?.tahunAjaran);
  const closedStarts = anchor ? new Map() : await getClosedCohortStarts(studentWhere);
  const selectedStarts = getSelectedAngkatanStarts(whereFilter);
  const evalStart = (jenjang) =>
    resolveEvaluatedStart(jenjang, {
      refStart,
      closedStart: closedStarts.get(jenjang.toLowerCase()) ?? null,
      selectedStarts,
    });

  const calcSeries = async (jenjang) => {
    const last = evalStart(jenjang);
    const angkatanList = getEvaluationWindow(jenjang, refStart, last);
    if (!angkatanList.length) return null;
    const cohorts = await countCohorts(jenjang, studentWhere, angkatanList);

    const rows = angkatanList.map((angkatanLabel) => {
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
    // Sama untuk semua jenjang: hanya angkatan dalam jendela yang punya data.
    return rows.filter((row) => row.intake > 0 || row.successCount > 0);
  };

  const values = await forJenjangs(jenjangs, calcSeries);

  // Deret per jenjang; jenjang non-inti tanpa baris tidak dikirim sama sekali.
  const result = {};
  jenjangs.forEach((jenjang, index) => {
    const series = values[index];
    if (Array.isArray(series) && series.length) result[jenjang.toLowerCase()] = series;
  });
  // Daftar tab dari server: jenjang yang kohortnya punya intake/lulusan.
  result.jenjangs = jenjangTabs(
    Object.fromEntries(
      jenjangs.map((jenjang, index) => [
        jenjang.toLowerCase(),
        (values[index] || []).filter((row) => row.intake > 0 || row.successCount > 0),
      ]),
    ),
    (jenjang) => ({
      batas: cohortLagFor(jenjang),
      angkatanEvaluasi: angkatanLabelFromStart(evalStart(jenjang)),
    }),
  );
  return result;
}

module.exports = {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
  getEvaluationWindow,
  getAngkatanEvaluasiStart,
};
