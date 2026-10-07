/** Aggregates international-student trends directly in MySQL. */
const prisma = require('../../config/prisma');
const { toAcademicYear, get5YearRollingAcademicYears } = require('../../utils/academicUtils');
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
  // Dua populasi, dua scope — dinyatakan saat filter dibangun, bukan dengan
  // membuang kondisi dari filter yang sudah jadi.
  const populationFilter = buildStudentFilter(query);
  const windowFilter = buildStudentFilter(query, { scope: FILTER_SCOPES.ALL_YEARS });

  // Jendela 5 tahun hanya butuh tahun akademik terbaru: cukup satu agregat,
  // bukan `distinct periodeMasuk` atas seluruh tabel pada setiap request.
  const latestPeriode = await prisma.student.aggregate({
    where: ensurePopulationFilter(windowFilter),
    _max: { periodeMasuk: true },
  });
  const availableAcademicYears = [toAcademicYear(latestPeriode._max.periodeMasuk)].filter(Boolean);
  const rollingYears = get5YearRollingAcademicYears(availableAcademicYears);

  const trendData = await Promise.all(
    rollingYears.map(async (academicYear) => {
      const ayObj = getAcademicYear(academicYear);
      if (!ayObj) return toTrendRow(academicYear, { total: 0, foreign: 0 });

      const academicConditions = buildAcademicYearFilter(ayObj, query.statusKeaktifan);
      const yearBaseFilter = {
        ...windowFilter,
        AND: [...(windowFilter.AND || []), ...academicConditions],
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
  // di sini supaya klien tidak perlu mencari barisnya sendiri.
  const selectedAcademicYear = getSelectedAcademicYear(query);
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
