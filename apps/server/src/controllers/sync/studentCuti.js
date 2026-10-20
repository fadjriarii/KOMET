const { paginateSevimaPages } = require('./sevimaLookup');
const { getCurrentAcademicPeriode } = require('./academicPeriod');

/**
 * NIM berstatus Cuti pada periode berjalan. Status Cuti tidak ada di endpoint
 * `/mahasiswa` (di sana tetap `A / Aktif`); satu-satunya sumbernya `/perwalian`.
 * Perwalian bisa mengembalikan baris ganda untuk satu NIM, jadi hasilnya Set.
 */
async function fetchCutiNims(periode = getCurrentAcademicPeriode()) {
  const nims = new Set();
  await paginateSevimaPages({
    endpoint: '/siakadcloud/v1/perwalian',
    params: { 'f-id_periode': periode, 'f-id_status_mahasiswa': 'C' },
    onPage: (listData) => {
      for (const item of listData) {
        const attr = item.attributes || {};
        const nim = String(attr.nim || '').trim();
        const status = String(attr.id_status_mahasiswa || '')
          .trim()
          .toUpperCase();
        if (nim && status === 'C') nims.add(nim);
      }
    },
  });
  return nims;
}

module.exports = { fetchCutiNims };
