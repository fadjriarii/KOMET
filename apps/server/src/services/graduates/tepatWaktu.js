/**
 * tepatWaktu.js
 *
 * Menghitung persentase & data komposit lulusan tepat waktu (OnTimeGraduationModal.jsx).
 *
 * ponytail: kedua fungsi menarik baris lulusan dalam jendela (1 tahun / 5 tahun)
 * lalu mengelompokkannya di Node. Alasannya, aturan `lamaStudi` harus tetap satu
 * implementasi — memindahkannya ke `GROUP BY` SQL menyimpan aturan yang sama dua
 * kali. Biayanya O(lulusan dalam jendela), satu roundtrip Prisma per tabel.
 * Upgrade path: kolom turunan `lamaStudi` berindeks, atau snapshot per tahun
 * akademik (lihat catatan akurasi tren di ARCHITECTURE.md).
 */

const prisma = require('../../config/prisma');
const { getYearRange, getReferenceYear, getStudyStartYear } = require('../../utils/academicUtils');
const { rate, roundedRate } = require('../../utils/percentageUtils');

/**
 * Batas masa studi agar sebuah kelulusan dihitung "tepat waktu", dalam tahun.
 * Beda makna dengan `COHORT_EVALUATION_LAG` pada keberhasilanStudi.js (tahun
 * mundur kohort yang hasil akhirnya sudah diketahui), jadi keduanya sengaja
 * memakai nama dan nilai yang berbeda.
 */
const BATAS_STUDI_TEPAT_WAKTU = { S1: 4, S2: 2 };

const lamaStudi = (graduate, tahunLulus) => {
  const tahunMasuk = getStudyStartYear(graduate.student);
  return tahunMasuk === null ? null : tahunLulus - tahunMasuk;
};

async function getTepatWaktu(whereFilter) {
  const refYear = getReferenceYear();
  const graduates = await prisma.graduate.findMany({
    where: { ...whereFilter, tahunLulus: String(refYear) },
    select: {
      jenjang: true,
      tahunLulus: true,
      student: { select: { periodeMasuk: true, angkatan: true } },
    },
  });

  const calcPct = (jenjang) => {
    const batas = BATAS_STUDI_TEPAT_WAKTU[jenjang];
    const durations = graduates
      .filter((g) => g.jenjang === jenjang)
      .map((g) => lamaStudi(g, refYear))
      .filter((duration) => duration !== null);
    if (durations.length === 0) return null;
    const tepatWaktu = durations.filter((duration) => duration <= batas).length;
    return roundedRate(tepatWaktu, durations.length);
  };

  return {
    // Jenjang yang tidak diminta filter sudah pasti tidak punya baris di
    // `graduates`, jadi `calcPct` sendiri yang mengembalikan null.
    s1: calcPct('S1'),
    s2: calcPct('S2'),
    referenceYear: refYear,
  };
}

/**
 * Format data komposit untuk view kelulusan tepat waktu:
 * [{ cohort, cohortLabel, tahunLulusTepat, fastCount, onTimeCount, lateCount,
 *    unknownCount, rate, total }]
 *
 * `rate` dihitung atas kohort yang lama studinya bisa ditentukan; baris tanpa
 * `periodeMasuk`/`angkatan` dilaporkan sebagai `unknownCount`, tidak dihitung
 * sebagai "tepat waktu" secara diam-diam.
 */
async function getTepatWaktuByYear(whereFilter) {
  const yearRange = getYearRange();
  const graduates = await prisma.graduate.findMany({
    where: { ...whereFilter, tahunLulus: { in: yearRange } },
    select: {
      jenjang: true,
      tahunLulus: true,
      student: { select: { angkatan: true, periodeMasuk: true } },
    },
  });

  const buildCohortData = (jenjang) => {
    const batas = BATAS_STUDI_TEPAT_WAKTU[jenjang];

    return yearRange.map((tahunStr) => {
      const tahunLulusNum = parseInt(tahunStr, 10);
      const filtered = graduates.filter((g) => g.jenjang === jenjang && g.tahunLulus === tahunStr);

      let fastCount = 0;
      let onTimeCount = 0;
      let lateCount = 0;
      let unknownCount = 0;

      filtered.forEach((g) => {
        const duration = lamaStudi(g, tahunLulusNum);
        if (duration === null) unknownCount++;
        else if (duration < batas) fastCount++;
        else if (duration === batas) onTimeCount++;
        else lateCount++;
      });

      const total = fastCount + onTimeCount + lateCount;
      const cohortRate = rate(fastCount + onTimeCount, total, null);

      return {
        cohort: tahunLulusNum - batas,
        cohortLabel: `Angkatan ${tahunLulusNum - batas}`,
        tahunLulusTepat: tahunLulusNum,
        rate: cohortRate,
        fastCount,
        onTimeCount,
        lateCount,
        unknownCount,
        total,
      };
    });
  };

  return {
    s1: buildCohortData('S1'),
    s2: buildCohortData('S2'),
    batasS1: BATAS_STUDI_TEPAT_WAKTU.S1,
    batasS2: BATAS_STUDI_TEPAT_WAKTU.S2,
  };
}

module.exports = { getTepatWaktu, getTepatWaktuByYear, BATAS_STUDI_TEPAT_WAKTU };
