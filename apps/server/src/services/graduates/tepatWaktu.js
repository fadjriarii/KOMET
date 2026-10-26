/**
 * tepatWaktu.js
 *
 * Menghitung persentase & data komposit lulusan tepat waktu (OnTimeGraduationModal.jsx).
 *
 * ponytail: kedua fungsi menarik baris lulusan dalam scope kartu lalu
 * mengelompokkannya di Node. Alasannya, aturan `lamaStudi` harus tetap satu
 * implementasi — memindahkannya ke `GROUP BY` SQL menyimpan aturan yang sama dua
 * kali. Biayanya O(lulusan dalam scope), satu roundtrip Prisma per tabel.
 * Upgrade path: kolom turunan `lamaStudi` berindeks, atau snapshot per tahun
 * akademik (lihat catatan akurasi tren di docs/ARCHITECTURE.md).
 */

const prisma = require('../../config/prisma');
const {
  TREND_WINDOW_YEARS,
  getStudyStartYear,
  getAcademicYearStart,
  studySemesters,
} = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { resolveTahunAjaranScope } = require('./yearJenjangSeries');
const { getRequestedJenjang, getScopeJenjangs } = require('./filterBuilder');
const { roundedRate } = require('../../utils/percentageUtils');
const { studyLimitsFor } = require('./studyLimits');
const { jenjangTabs } = require('./graduateCards');

// Masa studi dalam semester, dari periode masuk sampai periode lulus (ADR 0004).
// Tepat waktu = ≤ batas `onTime` × 2 semester (S1 ≤ 8, S2 ≤ 4, Profesi ≤ 2).
const lamaStudi = (student) => studySemesters(student, student.graduate);

// Kohort chart = angkatan riil yang difilter user. `getStudyStartYear` dipanggil
// dengan angkatan saja supaya `periodeMasuk` tidak menggeser label; periode
// hanya jadi fallback bila angkatan kosong.
const cohortStartFor = (student) =>
  getStudyStartYear({ angkatan: student.angkatan }) ?? getStudyStartYear(student);

// Batas tepat waktu dalam tahun (dipakai label "≤ 4 Thn"); null = aturan belum ada.
const batasFor = (jenjang) => studyLimitsFor(jenjang)?.onTime ?? null;

async function getTepatWaktu(whereFilter) {
  // Kartu memakai tahun terbaru dari scope (pilihan user atau default jendela);
  // durasi tiap baris dihitung dari label ajarannya sendiri.
  const { where, anchor, tahunScope } = await resolveTahunAjaranScope(whereFilter);
  const jenjangs = await getScopeJenjangs(where);
  const students = await prisma.student.findMany({
    where,
    select: {
      jenjang: true,
      periodeMasuk: true,
      periodeMasukAwal: true,
      angkatan: true,
      graduate: { select: { tahunLulus: true, periodeWisuda: true } },
    },
  });

  const refLabel =
    anchor ??
    students
      .map((s) => s.graduate?.tahunLulus)
      .filter(Boolean)
      .sort()
      .pop() ??
    null;

  const calcPct = (jenjang) => {
    const batas = batasFor(jenjang);
    if (batas === null) return null;
    const durations = students
      .filter((s) => s.jenjang === jenjang)
      .map(lamaStudi)
      .filter((duration) => duration !== null);
    if (durations.length === 0) return null;
    const tepatWaktu = durations.filter((duration) => duration <= batas * 2).length;
    return roundedRate(tepatWaktu, durations.length);
  };

  // Headline gabungan: tiap lulusan dinilai dengan batas jenjangnya
  // sendiri (studyLimits.js), lalu digabung. Bukan rata-rata dari rate
  // per jenjang — jenjang kecil tidak boleh berbobot sama dengan S1.
  // Tanpa nama jenjang yang disebut eksplisit: jenjang baru otomatis ikut
  // selama batasnya dikenal; yang belum ada aturannya dilewati.
  const calcOverall = () => {
    const durations = students
      .map((s) => ({
        batas: batasFor(s.jenjang),
        duration: lamaStudi(s),
      }))
      .filter(({ batas, duration }) => batas !== null && duration !== null);
    if (durations.length === 0) return null;
    const tepatWaktu = durations.filter(({ batas, duration }) => duration <= batas * 2).length;
    return roundedRate(tepatWaktu, durations.length);
  };

  const result = {
    referenceLabel: refLabel,
    tahunScope,
    overall: calcOverall(),
  };
  for (const jenjang of jenjangs) result[jenjang.toLowerCase()] = calcPct(jenjang);
  // Kunci lama untuk kompatibilitas kartu S1/S2 yang sudah ada.
  result.s1 = result.s1 ?? null;
  result.s2 = result.s2 ?? null;
  return result;
}

/**
 * Format data komposit untuk view kelulusan tepat waktu:
 * [{ cohort, cohortLabel, tahunLulusTepat, fastCount, onTimeCount, lateCount,
 *    unknownCount, rate, total }]
 *
 * Baris dikelompokkan menurut `angkatan` riil, bukan `tahunLulus`: filter
 * angkatan harus menghasilkan satu bar, sedangkan filter tahun lulus boleh
 * menghasilkan beberapa angkatan yang lulus pada tahun itu. `tahunLulusTepat`
 * adalah tahun lulus standar (`cohort + batas − 1`), bukan tahun lulus aktual.
 *
 * `rate` dihitung atas kohort yang lama studinya bisa ditentukan; baris dengan
 * angkatan tetapi tanpa durasi (periode/tahun lulus tak terbaca) dilaporkan
 * sebagai `unknownCount`, tidak dihitung "tepat waktu" secara diam-diam.
 */
async function getTepatWaktuByYear(whereFilter) {
  const { cleanFilter, where } = await resolveTahunAjaranScope(whereFilter);
  const students = await prisma.student.findMany({
    where,
    select: {
      jenjang: true,
      periodeMasuk: true,
      periodeMasukAwal: true,
      angkatan: true,
      graduate: { select: { tahunLulus: true, periodeWisuda: true } },
    },
  });
  // Tanpa pilihan jenjang, tab hanya untuk jenjang yang punya baris dalam
  // scope (termasuk jangkar tahun ajaran) — bukan seluruh distinct DB.
  const requestedJenjang = getRequestedJenjang(cleanFilter);
  const jenjangs = requestedJenjang ?? [...new Set(students.map((s) => s.jenjang))].sort();
  const explicitCohort = Boolean(
    cleanFilter.angkatan ?? cleanFilter.graduate?.tahunLulus ?? cleanFilter.tahunLulus,
  );

  const buildCohortData = (jenjang) => {
    const batas = batasFor(jenjang);
    if (batas === null) return [];
    const rows = students.filter((s) => s.jenjang === jenjang);
    const latestGraduation = rows.reduce((latest, s) => {
      const start = getAcademicYearStart(String(s.graduate?.tahunLulus ?? '').trim());
      return start === null ? latest : Math.max(latest, start);
    }, null);

    const groups = new Map();
    rows.forEach((s) => {
      const cohortStart = cohortStartFor(s);
      if (cohortStart === null) return;
      const group = groups.get(cohortStart) ?? {
        cohort: cohortStart,
        fastCount: 0,
        onTimeCount: 0,
        lateCount: 0,
        unknownCount: 0,
      };
      // Semester ke-(batas×2) = tepat; sebelumnya lebih cepat; sesudahnya lewat.
      const duration = lamaStudi(s);
      if (duration === null) group.unknownCount++;
      else if (duration > batas * 2) group.lateCount++;
      else if (duration === batas * 2) group.onTimeCount++;
      else group.fastCount++;
      groups.set(cohortStart, group);
    });

    // Tahun ajaran lulus standar: angkatan 2020 S1 (4 thn) lulus tepat di
    // 2023/2024, jadi start = angkatan + batas − 1.
    const standardGraduationStart = (cohort) => cohort + batas - 1;
    // Tanpa filter angkatan/tahun lulus, sembunyikan kohort yang tahun lulus
    // standarnya belum tercapai supaya kohort berjalan tidak tampil parsial.
    return (
      [...groups.values()]
        .filter(
          (group) =>
            explicitCohort ||
            latestGraduation === null ||
            standardGraduationStart(group.cohort) <= latestGraduation,
        )
        .sort((a, b) => a.cohort - b.cohort)
        // Jendela chart: 5 angkatan terbaru; pilihan angkatan/tahun eksplisit utuh.
        .slice(explicitCohort ? 0 : -TREND_WINDOW_YEARS)
        .map((group) => {
          const total = group.fastCount + group.onTimeCount + group.lateCount;
          return {
            ...group,
            cohortLabel: `Angkatan ${formatAcademicYearLabel(group.cohort)}`,
            tahunLulusTepat: standardGraduationStart(group.cohort),
            rate: roundedRate(group.fastCount + group.onTimeCount, total, null),
            total,
          };
        })
    );
  };

  // Kunci batas hanya untuk jenjang dalam scope yang aturannya dikenal —
  // tanpa baris S3 di DB, tidak ada kunci s3/batasS3 yang keluar dari sini,
  // jadi teks S3 tidak bisa bocor ke UI.
  const result = {};
  for (const jenjang of jenjangs) {
    result[jenjang.toLowerCase()] = buildCohortData(jenjang);
    const batas = batasFor(jenjang);
    // Kapitalisasi sekali supaya filter URL huruf kecil (`?jenjang=s1`)
    // tetap menghasilkan kunci kanonis `batasS1` seperti sebelumnya.
    if (batas !== null)
      result[`batas${jenjang.charAt(0).toUpperCase()}${jenjang.slice(1)}`] = batas;
  }
  // Daftar tab dari server: hanya jenjang yang punya kohort, berurutan.
  result.jenjangs = jenjangTabs(
    Object.fromEntries(
      jenjangs.map((jenjang) => [jenjang.toLowerCase(), result[jenjang.toLowerCase()]]),
    ),
    (jenjang) => ({ batas: batasFor(jenjang) }),
  );
  result.s1 = result.s1 ?? [];
  result.s2 = result.s2 ?? [];
  return result;
}

module.exports = { getTepatWaktu, getTepatWaktuByYear };
