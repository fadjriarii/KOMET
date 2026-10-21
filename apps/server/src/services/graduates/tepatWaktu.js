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
 * akademik (lihat catatan akurasi tren di ARCHITECTURE.md).
 */

const prisma = require('../../config/prisma');
const { getStudyStartYear, getAcademicYearStart } = require('../../utils/academicUtils');
const { formatAcademicYearLabel } = require('@komet/shared/academicYear');
const { resolveTahunScope, describeTahunScope, withTahunScope } = require('./yearJenjangSeries');
const { getTahunAjaranLabel } = require('./tahunAjaran');
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

const batasFor = (jenjang) => BATAS_STUDI_TEPAT_WAKTU[String(jenjang ?? '').toUpperCase()] ?? null;

/**
 * Jangkar kohort Opsi A — satu titik override referensi tahun kedua fungsi:
 * meta `tahunAjaran` (ditempel filterBuilder, bukan kolom Prisma) = "lulus
 * sampai tahun ajaran ini" (`tahunLulus lte` label jangkar). Filter
 * `tahunLulus` eksplisit user tetap menang; meta dibuang sebelum query.
 * Tanpa jangkar (absen/invalid) perilaku lama persis.
 */
async function resolveTahunAjaranScope(whereFilter = {}) {
  const { tahunAjaran, ...cleanFilter } = whereFilter;
  const { scope, isDefault } = await resolveTahunScope(cleanFilter);
  const where = withTahunScope(cleanFilter, scope);
  const explicitTahun = cleanFilter.graduate?.tahunLulus ?? cleanFilter.tahunLulus;
  const anchor = explicitTahun ? null : getTahunAjaranLabel(tahunAjaran);
  if (anchor) where.graduate = { ...(where.graduate || {}), tahunLulus: { lte: anchor } };
  return { cleanFilter, where, scope, isDefault, anchor };
}

async function getTepatWaktu(whereFilter) {
  // Kartu memakai tahun terbaru dari scope (pilihan user atau default jendela);
  // durasi tiap baris dihitung dari label ajarannya sendiri.
  const { cleanFilter, where, scope, isDefault, anchor } =
    await resolveTahunAjaranScope(whereFilter);
  const jenjangs = await getScopeJenjangs(cleanFilter);
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
    tahunScope: describeTahunScope(scope, isDefault),
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
 * `tahunLulus` di DB adalah label ajaran, jadi iterasi memakai label; `cohort`
 * dan `tahunLulusTepat` tetap angka tahun mulai (start) untuk kompatibilitas,
 * `cohortLabel` verbatim `Angkatan YYYY/YYYY` seperti dibaca modal.
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

  const buildCohortData = (jenjang) => {
    const batas = batasFor(jenjang);
    if (batas === null) return [];
    // Label cohort dibaca per jenjang: Profesi tidak mewarisi tahun S1/S2
    // yang belum punya lulusan Profesi (dulu menjadi baris nol).
    const labels = [
      ...new Set(
        students
          .filter((s) => s.jenjang === jenjang)
          .map((s) => s.graduate?.tahunLulus)
          .filter(Boolean),
      ),
    ].sort();

    return labels.map((label) => {
      const tahunLulusStart = getAcademicYearStart(label);
      const filtered = students.filter(
        (s) => s.jenjang === jenjang && s.graduate?.tahunLulus === label,
      );

      let fastCount = 0;
      let onTimeCount = 0;
      let lateCount = 0;
      let unknownCount = 0;

      filtered.forEach((s) => {
        const duration = lamaStudi(s, label);
        if (duration === null) unknownCount++;
        // Program satu tahun selesai di tahun ajaran yang sama menghasilkan
        // selisih 0; itu tepat waktu, bukan lebih cepat.
        else if (duration > batas) lateCount++;
        else if (batas <= 1 || duration === batas) onTimeCount++;
        else fastCount++;
      });

      const total = fastCount + onTimeCount + lateCount;
      const cohortRate = rate(fastCount + onTimeCount, total, null);
      const cohortStart = tahunLulusStart - batas;

      return {
        cohort: cohortStart,
        cohortLabel: `Angkatan ${formatAcademicYearLabel(cohortStart)}`,
        tahunLulusTepat: tahunLulusStart,
        rate: cohortRate,
        fastCount,
        onTimeCount,
        lateCount,
        unknownCount,
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
