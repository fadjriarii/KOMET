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
const { getStudyStartYear, getAcademicYearStart } = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { resolveTahunAjaranScope } = require('./yearJenjangSeries');
const { getRequestedJenjang, getScopeJenjangs } = require('./filterBuilder');
const { rate, roundedRate } = require('../../utils/percentageUtils');

/**
 * Batas masa studi agar sebuah kelulusan dihitung "tepat waktu", dalam tahun.
 * `Profesi` = pendidikan profesi 1 tahun pasca-S1 (Apoteker). `S3` disiapkan
 * dulu (aturan umum doktor 3 tahun, konfirmasi BAAK) supaya saat datanya
 * masuk dari sync, rate dan tab-nya langsung terhitung tanpa ubah kode.
 * Beda makna dengan `COHORT_EVALUATION_LAG` pada keberhasilanStudi.js
 * (tahun mundur kohort yang hasil akhirnya sudah diketahui), jadi keduanya
 * sengaja memakai nama dan nilai yang berbeda.
 */
const BATAS_STUDI_TEPAT_WAKTU = { S1: 4, S2: 2, PROFESI: 1, S3: 3 };

const lamaStudi = (student, tahunLulusLabel) => {
  const tahunMasuk = getStudyStartYear(student);
  const tahunLulusStart = getAcademicYearStart(String(tahunLulusLabel ?? '').trim());
  return tahunMasuk === null || tahunLulusStart === null ? null : tahunLulusStart - tahunMasuk;
};

// Kohort chart = angkatan riil yang difilter user. `getStudyStartYear` dipanggil
// dengan angkatan saja supaya `periodeMasuk` tidak menggeser label; periode
// hanya jadi fallback bila angkatan kosong.
const cohortStartFor = (student) =>
  getStudyStartYear({ angkatan: student.angkatan }) ?? getStudyStartYear(student);

const batasFor = (jenjang) => BATAS_STUDI_TEPAT_WAKTU[String(jenjang ?? '').toUpperCase()] ?? null;

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
      angkatan: true,
      graduate: { select: { tahunLulus: true } },
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
      .map((s) => lamaStudi(s, s.graduate?.tahunLulus))
      .filter((duration) => duration !== null);
    if (durations.length === 0) return null;
    const tepatWaktu = durations.filter((duration) => duration <= batas).length;
    return roundedRate(tepatWaktu, durations.length);
  };

  // Headline gabungan: tiap lulusan dinilai dengan batas jenjangnya
  // sendiri (S1 ≤ 4, S2 ≤ 2, Profesi ≤ 1, S3 ≤ 3 — dan jenjang baru yang
  // aturannya ditambahkan nanti), lalu digabung. Bukan rata-rata dari rate
  // per jenjang — jenjang kecil tidak boleh berbobot sama dengan S1.
  // Tanpa nama jenjang yang disebut eksplisit: jenjang baru otomatis ikut
  // selama batasnya dikenal; yang belum ada aturannya dilewati.
  const calcOverall = () => {
    const durations = students
      .map((s) => ({
        batas: batasFor(s.jenjang),
        duration: lamaStudi(s, s.graduate?.tahunLulus),
      }))
      .filter(({ batas, duration }) => batas !== null && duration !== null);
    if (durations.length === 0) return null;
    const tepatWaktu = durations.filter(({ batas, duration }) => duration <= batas).length;
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
 * adalah tahun lulus standar (`cohort + batas`), bukan tahun lulus aktual.
 *
 * `rate` dihitung atas kohort yang lama studinya bisa ditentukan; baris tanpa
 * `periodeMasuk`/`angkatan` dilaporkan sebagai `unknownCount`, tidak dihitung
 * sebagai "tepat waktu" secara diam-diam.
 */
async function getTepatWaktuByYear(whereFilter) {
  const { cleanFilter, where } = await resolveTahunAjaranScope(whereFilter);
  const students = await prisma.student.findMany({
    where,
    select: {
      jenjang: true,
      periodeMasuk: true,
      angkatan: true,
      graduate: { select: { tahunLulus: true } },
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
      const duration = lamaStudi(s, s.graduate?.tahunLulus);
      if (duration === null) group.unknownCount++;
      // Program satu tahun selesai di tahun ajaran yang sama menghasilkan
      // selisih 0; itu tepat waktu, bukan lebih cepat.
      else if (duration > batas) group.lateCount++;
      else if (batas <= 1 || duration === batas) group.onTimeCount++;
      else group.fastCount++;
      groups.set(cohortStart, group);
    });

    // Tanpa filter angkatan/tahun lulus, sembunyikan kohort yang tahun lulus
    // standarnya belum tercapai supaya kohort berjalan tidak tampil parsial.
    // Program satu tahun bisa selesai di tahun angkatannya (selisih 0).
    return [...groups.values()]
      .filter(
        (group) =>
          explicitCohort ||
          latestGraduation === null ||
          (batas <= 1 ? group.cohort : group.cohort + batas) <= latestGraduation,
      )
      .sort((a, b) => a.cohort - b.cohort)
      .map((group) => {
        const total = group.fastCount + group.onTimeCount + group.lateCount;
        return {
          ...group,
          cohortLabel: `Angkatan ${formatAcademicYearLabel(group.cohort)}`,
          tahunLulusTepat: group.cohort + batas,
          rate: rate(group.fastCount + group.onTimeCount, total, null),
          total,
        };
      });
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
  result.s1 = result.s1 ?? [];
  result.s2 = result.s2 ?? [];
  return result;
}

module.exports = { getTepatWaktu, getTepatWaktuByYear, BATAS_STUDI_TEPAT_WAKTU };
