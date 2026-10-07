/**
 * filterBuilder.js
 *
 * Mengkonversi query parameters dari HTTP request menjadi Prisma where clause
 * untuk tabel graduates (dan relasi student).
 */

const { getPaginationParams } = require('../../utils/paginationUtils');
const { addInFilter, addSearchFilter, hasFilters, toArray } = require('../shared/filterUtils');
const { JENJANGS } = require('@komet/shared/constants');

/**
 * Jenjang yang benar-benar diminta sebuah filter graduate.
 *
 * `buildGraduateFilter()` membangun `{ in: [...] }`, sehingga perbandingan string
 * seperti `whereFilter.jenjang === 'S2'` selalu false: service lalu menghitung
 * kedua jenjang dari populasi filter yang sama dan melaporkannya dua kali
 * (terukur: `?jenjang=S1` menghasilkan `totalGraduates` 1514 = 757 dihitung dua
 * kali). Semua service lulusan menanyakan "level ini diminta?" lewat sini.
 */
function getRequestedJenjang(whereFilter = {}) {
  const requested = toArray(whereFilter.jenjang?.in ?? whereFilter.jenjang) || [];
  const known = requested.filter((jenjang) => JENJANGS.includes(jenjang));
  return known.length ? known : JENJANGS;
}

function includesJenjang(whereFilter, jenjang) {
  return getRequestedJenjang(whereFilter).includes(jenjang);
}

function buildGraduateFilter(query) {
  const {
    programStudi,
    tahunLulus,
    periodeWisuda,
    statusKelulusan,
    fakultas,
    periodeMasuk,
    jenjang,
    search,
  } = query;

  const where = {};

  // Populasi tab lulusan = JENJANGS, dipilih di query bukan disaring setelah hasil.
  // Tanpa paksaan ini `/graduates/list` menampilkan baris yang tidak pernah dihitung
  // kartu (terukur pada data nyata: 37 lulusan berjenjang `Prof` ada di daftar,
  // tidak di summary).
  where.jenjang = { in: getRequestedJenjang({ jenjang }) };
  addInFilter(where, 'tahunLulus', tahunLulus);
  addInFilter(where, 'periodeWisuda', periodeWisuda);
  addInFilter(where, 'statusKelulusan', statusKelulusan);

  // Filter lewat relasi ke student
  const studentFilter = {};
  addInFilter(studentFilter, 'programStudi', programStudi);
  addInFilter(studentFilter, 'fakultas', fakultas);
  if (periodeMasuk) studentFilter.periodeMasuk = periodeMasuk;
  addSearchFilter(studentFilter, search);

  if (hasFilters(studentFilter)) {
    where.student = studentFilter;
  }

  return where;
}

module.exports = {
  buildGraduateFilter,
  getPaginationParams,
  getRequestedJenjang,
  includesJenjang,
};
