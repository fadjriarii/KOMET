/** Aggregates international-student trends directly in MySQL. */
const prisma = require('../../config/prisma');
const {
  toAcademicYear,
  getBounded5YearRollingAcademicYears,
} = require('../../utils/academicUtils');
const { roundedRate } = require('../../utils/percentageUtils');
const {
  FILTER_SCOPES,
  buildStudentFilter,
  ensurePopulationFilter,
  getAcademicYear,
  getSelectedAcademicYear,
} = require('./filterBuilder');
const { buildAcademicYearFilter } = require('./snapshotConditions');

function appendNot(where, condition) {
  const { NOT: existingNot, AND: existingAnd, ...rest } = where;
  return {
    ...rest,
    AND: [
      ...(existingAnd || []),
      ...(existingNot ? [{ NOT: existingNot }] : []),
      { NOT: condition },
    ],
  };
}

function getInternationalWhere(baseFilter = {}) {
  const where = appendNot(ensurePopulationFilter(baseFilter), {
    kewarganegaraan: 'Indonesia',
  });
  // Preserve the pre-groupBy business rule: a missing nationality is
  // unknown, not an international student.
  return {
    ...where,
    AND: [...(where.AND || []), { kewarganegaraan: { not: '' } }],
  };
}

const WNI_NATIONALITY = 'indonesia';

/**
 * Satu agregat `groupBy` menghasilkan pembilang dan penyebut sekaligus, jadi
 * tren per tahun butuh 1 query, bukan 2 `count`. Perbandingan nama negara
 * di-normalisasi seperti collation MySQL (case-insensitive).
 */
function sumNationalityRows(rows) {
  let total = 0;
  let foreign = 0;
  for (const row of rows) {
    const count = row._count.kewarganegaraan;
    total += count;
    const nationality = String(row.kewarganegaraan || '')
      .trim()
      .toLowerCase();
    // Kewarganegaraan kosong = tidak diketahui, bukan mahasiswa internasional.
    if (nationality && nationality !== WNI_NATIONALITY) foreign += count;
  }
  return { total, foreign };
}

function countByNationality(where) {
  return prisma.student.groupBy({
    by: ['kewarganegaraan'],
    where,
    _count: { kewarganegaraan: true },
  });
}

/**
 * Satu nama untuk satu nilai. Dahulu baris ini mengirim `foreignActive`/
 * `foreignCount`, `totalActive`/`totalCount`/`rawTotal`, dan `percentage`/`rate`/
 * `rawRate` sekaligus — hanya supaya tebakan alias di client selalu cocok. Bentuk
 * itu membuat kontrak tidak bisa diverifikasi: client tidak pernah tahu mana yang
 * berubah, dan server tidak pernah bisa menghapus salah satunya.
 */
function toTrendRow(academicYear, { total, foreign }) {
  return {
    academicYear,
    foreignCount: foreign,
    totalCount: total,
    percentage: roundedRate(foreign, total),
  };
}

async function getInternationalStudentsTrend(query = {}) {
  // Filter kewarganegaraan dari UI (mis. WNI) tidak boleh mempersempit kartu
  // mahasiswa internasional (WNA) menjadi 0: kartu ini khusus mengukur WNA
  // di dalam populasi demografis yang dipilih.
  const baseQuery = { ...query };
  delete baseQuery.kewarganegaraan;

  // Dua populasi, dua scope — dinyatakan saat filter dibangun, bukan dengan
  // membuang kondisi dari filter yang sudah jadi.
  const populationFilter = buildStudentFilter(baseQuery);
  const windowFilter = buildStudentFilter(baseQuery, { scope: FILTER_SCOPES.ALL_YEARS });

  // Jendela 5 tahun mengikuti tahun ajaran yang dipilih user (mis. pilih
  // 2021/2022 → 2017/2018 s.d. 2021/2022). Tanpa pilihan, ikut data terbaru
  // di DB seperti sebelumnya. Awal jendela dijepit di tahun berdiri kampus
  // (2014/2015): filter 2016/2017 menghasilkan 3 titik, bukan 5 titik berisi
  // tahun kosong. Satu agregat `_max` hanya dibutuhkan untuk mode tanpa
  // pilihan — bukan `distinct periodeMasuk` tiap request.
  const selectedAcademicYear = getSelectedAcademicYear(query);
  let rollingYears;
  if (selectedAcademicYear) {
    rollingYears = getBounded5YearRollingAcademicYears([selectedAcademicYear]);
  } else {
    const latestPeriode = await prisma.student.aggregate({
      where: ensurePopulationFilter(windowFilter),
      _max: { periodeMasuk: true },
    });
    const availableAcademicYears = [toAcademicYear(latestPeriode._max.periodeMasuk)].filter(
      Boolean,
    );
    rollingYears = getBounded5YearRollingAcademicYears(availableAcademicYears);
  }

  // Filter lintas tahun (ALL_YEARS) masih membawa `statusKeaktifan` berjalan
  // (mis. 'Aktif' default). Untuk deret historis, status harus diganti oleh
  // proyeksi snapshot per tahun di bawah — bukan di-AND-kan dengannya. Kalau
  // tidak dibuang, lulusan 2024/2025 ikut tersaring `status = Aktif saat ini`
  // sehingga tahun-tahun sebelumnya undercount (hanya yang masih aktif hari
  // ini dan masuk sebelum tahun itu). Sama seperti filter Tahun Ajaran:
  // lulusan tahun depan tetap terhitung aktif pada snapshot tahun lama.
  const windowWithoutStatus = { ...windowFilter };
  delete windowWithoutStatus.statusKeaktifan;

  const trendData = await Promise.all(
    rollingYears.map(async (academicYear) => {
      const ayObj = getAcademicYear(academicYear);
      if (!ayObj) return toTrendRow(academicYear, { total: 0, foreign: 0 });

      const academicConditions = buildAcademicYearFilter(ayObj, baseQuery.statusKeaktifan);
      const yearBaseFilter = {
        ...windowWithoutStatus,
        AND: [...(windowWithoutStatus.AND || []), ...academicConditions],
      };

      return toTrendRow(academicYear, sumNationalityRows(await countByNationality(yearBaseFilter)));
    }),
  );

  // `getInternationalWhere` sudah membuang WNI dan nilai kosong, jadi total WNA
  // adalah jumlah baris pemetaaan negara — tidak perlu `count` terpisah.
  const wnaCountryRows = await countByNationality(getInternationalWhere(populationFilter));

  const countryMap = wnaCountryRows.map((row) => ({
    kewarganegaraan: row.kewarganegaraan || 'WNA',
    count: row._count.kewarganegaraan,
  }));

  // Baris yang mewakili tahun terpilih di banner kartu: tahun ajaran yang diminta
  // bila ada di jendela tren, kalau tidak tahun terakhir. Aturan pilih dinyatakan
  // di sini supaya klien tidak perlu mencari barisnya sendiri. Saat filter tahun
  // aktif, jendela sudah berakhir di tahun itu sehingga `selected` = baris terakhir.
  const selected =
    trendData.find((row) => row.academicYear === selectedAcademicYear) ||
    trendData[trendData.length - 1] ||
    null;

  return {
    total: countryMap.reduce((sum, row) => sum + row.count, 0),
    byCountry: countryMap,
    trendData,
    selected,
  };
}

module.exports = {
  getInternationalStudentsTrend,
};
