/** Aggregates international-student trends directly in MySQL. */
const { FILTER_SCOPES, buildStudentFilter, getAcademicYear } = require('./filterBuilder');
const { buildAcademicYearFilter } = require('./snapshotConditions');
const { resolveTrendYears } = require('./international/trendYears');
const {
  getInternationalWhere,
  sumNationalityRows,
  countByNationality,
  toTrendRow,
} = require('./international/nationality');

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

  const { selectedAcademicYear, rollingYears } = await resolveTrendYears(query);

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

  const countryMap = [];
  const countryIndex = new Map();
  for (const row of wnaCountryRows) {
    // Satu negara bisa punya dua ejaan nama (mis. kiriman API vs fallback):
    // gabung per nama tampilan agar daftar tidak ganda.
    const key = row.kewarganegaraan || 'WNA';
    if (!countryIndex.has(key)) {
      countryIndex.set(key, countryMap.length);
      countryMap.push({ kewarganegaraan: key, count: 0 });
    }
    countryMap[countryIndex.get(key)].count += row._count.kewarganegaraan;
  }

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
