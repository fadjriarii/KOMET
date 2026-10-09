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
const { getScopeJenjangs } = require('./filterBuilder');
const { rate, roundedRate } = require('../../utils/percentageUtils');

/**
 * Batas masa studi agar sebuah kelulusan dihitung "tepat waktu", dalam tahun.
 * `Prof` = pendidikan profesi 1 tahun pasca-S1 (Apoteker). Beda makna dengan
 * `COHORT_EVALUATION_LAG` pada keberhasilanStudi.js (tahun mundur kohort yang
 * hasil akhirnya sudah diketahui), jadi keduanya sengaja memakai nama dan
 * nilai yang berbeda.
 */
const BATAS_STUDI_TEPAT_WAKTU = { S1: 4, S2: 2, PROF: 1 };

const lamaStudi = (student, tahunLulusLabel) => {
  const tahunMasuk = getStudyStartYear(student);
  const tahunLulusStart = getAcademicYearStart(String(tahunLulusLabel ?? '').trim());
  return tahunMasuk === null || tahunLulusStart === null ? null : tahunLulusStart - tahunMasuk;
};

const batasFor = (jenjang) =>
  BATAS_STUDI_TEPAT_WAKTU[jenjang] ?? BATAS_STUDI_TEPAT_WAKTU[jenjang?.toUpperCase()] ?? null;

async function getTepatWaktu(whereFilter) {
  // Kartu memakai tahun terbaru dari scope (pilihan user atau default jendela);
  // durasi tiap baris dihitung dari label ajarannya sendiri.
  const { scope, isDefault } = await resolveTahunScope(whereFilter);
  const jenjangs = await getScopeJenjangs(whereFilter);
  const students = await prisma.student.findMany({
    where: withTahunScope(whereFilter, scope),
    select: {
      jenjang: true,
      periodeMasuk: true,
      angkatan: true,
      graduate: { select: { tahunLulus: true } },
    },
  });

  const refLabel =
    students
      .map((s) => s.graduate?.tahunLulus)
      .filter(Boolean)
      .sort()
      .pop() ?? null;

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

  const result = {
    referenceLabel: refLabel,
    tahunScope: describeTahunScope(scope, isDefault),
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
  const { scope } = await resolveTahunScope(whereFilter);
  const jenjangs = await getScopeJenjangs(whereFilter);
  const students = await prisma.student.findMany({
    where: withTahunScope(whereFilter, scope),
    select: {
      jenjang: true,
      periodeMasuk: true,
      angkatan: true,
      graduate: { select: { tahunLulus: true } },
    },
  });

  const buildCohortData = (jenjang) => {
    const batas = batasFor(jenjang);
    if (batas === null) return [];
    const labels = [...new Set(students.map((s) => s.graduate?.tahunLulus).filter(Boolean))].sort();

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
        else if (duration < batas) fastCount++;
        else if (duration === batas) onTimeCount++;
        else lateCount++;
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

  const result = {
    batasS1: BATAS_STUDI_TEPAT_WAKTU.S1,
    batasS2: BATAS_STUDI_TEPAT_WAKTU.S2,
    batasProf: BATAS_STUDI_TEPAT_WAKTU.PROF,
  };
  for (const jenjang of jenjangs) result[jenjang.toLowerCase()] = buildCohortData(jenjang);
  result.s1 = result.s1 ?? [];
  result.s2 = result.s2 ?? [];
  return result;
}

module.exports = { getTepatWaktu, getTepatWaktuByYear, BATAS_STUDI_TEPAT_WAKTU };
