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
const { getTahunAjaranLabel, tahunAjaranStart } = require('./tahunAjaran');

/**
 * Kohort yang dievaluasi = yang terbaru dari dua sumber: (a) lag di bawah,
 * batas bawah yang tidak pernah lebih tua dari aturan; (b) angkatan terbaru
 * yang datanya membuktikan tutup — nol mahasiswa enrolled (Aktif/Cuti).
 * (b) membuat kartu mengikuti sync (2019 naik begitu Aktif terakhirnya
 * beres), (a) menjamin tak pernah prematur atau lebih tua dari aturan.
 * Jangkar `tahunAjaran` mematikan (b): tampilan "sampai tahun X" tak boleh
 * menampilkan kohort yang lebih muda dari jangkar.
 *
 * Ini BUKAN batas masa studi "tepat waktu" (`BATAS_STUDI_TEPAT_WAKTU` pada
 * tepatWaktu.js); keduanya sengaja bernilai dan bernama berbeda.
 *
 * `Profesi` = pendidikan profesi 1 tahun: lag evaluasi 2 (masuk → lulus 1 tahun,
 * +1 tahun tenggang hasil akhir). `S3` disiapkan dulu (lag 6 = standar 3 tahun
 * + 3 tenggang mengikuti pola S1, konfirmasi BAAK) supaya saat datanya masuk
 * dari sync, rate dan tab-nya langsung terhitung tanpa ubah kode.
 */
const COHORT_EVALUATION_LAG = { S1: 7, S2: 4, PROFESI: 2, S3: 6 };
const EVALUATION_WINDOW_YEARS = 5;

// Status yang berarti masih kuliah: kohort yang masih punya satu pun ini
// belum boleh dinilai final.
const ENROLLED_STATUS = new Set(['aktif', 'cuti']);

/** Referensi = MAX(tahunLulus) DB; fallback kalender bila tabel kosong. */
async function getGraduateReferenceStart() {
  const latest = await prisma.graduate.aggregate({ _max: { tahunLulus: true } });
  const maxLabel = latest._max?.tahunLulus;
  return getReferenceLabelStart(maxLabel ? [maxLabel] : []);
}

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
  const lag = COHORT_EVALUATION_LAG[jenjang] ?? COHORT_EVALUATION_LAG[jenjang?.toUpperCase()];
  return lag === undefined ? null : refStart - lag;
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

/**
 * Satu agregat menutupi seluruh angkatan yang diminta: dua `groupBy` —
 * penyebut (semua status) dan pembilang (punya baris graduate, asal
 * `/kelulusan`). Sebelumnya satu query `groupBy(['periodeMasuk',
 * 'statusKeaktifan'])` memakai status mahasiswa sebagai pembilang; populasi
 * tab ini kini ditentukan relasi `graduate`, dan `groupBy` tak bisa
 * mengelompokkan kolom relasi.
 */
async function countCohorts(jenjang, studentWhere, angkatanList) {
  const firstYear = getAcademicYearStart(angkatanList[0]);
  const lastYear = getAcademicYearStart(angkatanList[angkatanList.length - 1]);
  // Batas leksikografis: '2020' <= v < '2021' mengambil seluruh periode tahun 2020.
  const periodeMasuk = { gte: String(firstYear), lt: String(lastYear + 1) };
  const base = { ...studentWhere, jenjang, periodeMasuk };
  const [totalRows, lulusRows] = await Promise.all([
    prisma.student.groupBy({
      by: ['periodeMasuk'],
      where: base,
      _count: { periodeMasuk: true },
    }),
    prisma.student.groupBy({
      by: ['periodeMasuk'],
      where: { ...base, NOT: { graduate: null } },
      _count: { periodeMasuk: true },
    }),
  ]);

  const starts = angkatanList.map((label) => String(getAcademicYearStart(label)));
  const indexFor = (value) => starts.findIndex((year) => String(value).startsWith(year));
  const cohorts = new Map(angkatanList.map((angkatan) => [angkatan, { total: 0, lulus: 0 }]));
  for (const [key, rows] of [
    ['total', totalRows],
    ['lulus', lulusRows],
  ]) {
    for (const row of rows) {
      const index = indexFor(row.periodeMasuk);
      if (index === -1) continue;
      cohorts.get(angkatanList[index])[key] += row._count.periodeMasuk;
    }
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
  const evalStart = (jenjang) =>
    evaluatedStartFor(jenjang, {
      refStart,
      closedStart: closedStarts.get(jenjang.toLowerCase()) ?? null,
    });

  const calcPercentage = async (jenjang) => {
    const start = evalStart(jenjang);
    if (start === null) return null;
    const angkatan = formatAcademicYearLabel(start);
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
  result.angkatanS1 = result.angkatanS1 ?? angkatanLabelFromStart(evalStart('S1'));
  result.angkatanS2 = result.angkatanS2 ?? angkatanLabelFromStart(evalStart('S2'));
  // Label angkatan per jenjang dalam scope (S2/Profesi/S3, ...) supaya kartu
  // bisa menceritakan jenjang terpilih, bukan selalu S1.
  for (const jenjang of jenjangs) {
    const canon = `angkatan${jenjang.charAt(0).toUpperCase()}${jenjang.slice(1)}`;
    if (!(canon in result)) result[canon] = angkatanLabelFromStart(evalStart(jenjang));
  }
  return result;
}

async function getKeberhasilanStudiByAngkatan(whereFilter) {
  const { studentWhere, jenjangs } = await getCohortScope(whereFilter);
  const refStart = await resolveRefStart(whereFilter);
  const anchor = getTahunAjaranLabel(whereFilter?.tahunAjaran);
  const closedStarts = anchor ? new Map() : await getClosedCohortStarts(studentWhere);
  const evalStart = (jenjang) =>
    evaluatedStartFor(jenjang, {
      refStart,
      closedStart: closedStarts.get(jenjang.toLowerCase()) ?? null,
    });

  const calcSeries = async (jenjang) => {
    const last = evalStart(jenjang);
    const angkatanList = getEvaluationWindow(jenjang, refStart, last);
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

  // Kunci batas/angkatan hanya untuk jenjang dalam scope yang lag-nya
  // dikenal — tanpa baris S3 di DB, tidak ada kunci s3/batasStudiS3 yang
  // keluar dari sini, jadi teks S3 tidak bisa bocor ke UI.
  const result = {};
  jenjangs.forEach((jenjang, index) => {
    result[jenjang.toLowerCase()] = values[index];
    const lag = COHORT_EVALUATION_LAG[jenjang] ?? COHORT_EVALUATION_LAG[jenjang?.toUpperCase()];
    if (lag === undefined) return;
    const canon = `${jenjang.charAt(0).toUpperCase()}${jenjang.slice(1)}`;
    result[`batasStudi${canon}`] = lag;
    result[`angkatanEvaluasi${canon}`] = angkatanLabelFromStart(evalStart(jenjang));
  });
  result.s1 = result.s1 ?? null;
  result.s2 = result.s2 ?? null;
  return result;
}

module.exports = {
  getKeberhasilanStudi,
  getKeberhasilanStudiByAngkatan,
  getEvaluationWindow,
  getAngkatanEvaluasiStart,
  COHORT_EVALUATION_LAG,
};
