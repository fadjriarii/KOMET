/**
 * Mem-build Prisma where clause untuk query mbkm_activities
 * berdasarkan query parameters dari request.
 */

const prisma = require('../../config/prisma');
const { getAcademicYearStart } = require('../../utils/academicUtils');
const { addInFilter, hasFilters } = require('@komet/shared/filterUtils');

function buildMbkmFilter(query) {
  const {
    search,
    fakultas,
    programStudi,
    jenisAktivitas,
    angkatan,
    statusAktivitas,
    jenjang,
    periode,
  } = query;

  const where = {};

  // Filter langsung di tabel mbkm_activities. Array = satu tahun ajaran
  // (Ganjil + Genap); string = satu periode.
  if (Array.isArray(periode)) where.periode = { in: periode };
  else if (periode) where.periode = periode;

  addInFilter(where, 'statusAktivitas', statusAktivitas);
  addInFilter(where, 'jenjang', jenjang);
  addInFilter(where, 'fakultas', fakultas);
  addInFilter(where, 'programStudi', programStudi);
  addInFilter(where, 'jenisAktivitas', jenisAktivitas);

  // Filter via relasi ke student
  const studentFilter = {};

  addInFilter(studentFilter, 'angkatan', angkatan);

  if (hasFilters(studentFilter)) {
    where.student = studentFilter;
  }

  // Pencarian mencakup mitra, bukan filter mitra terpisah; daftar mitra bisa
  // sangat panjang sehingga tidak layak dimuat sebagai opsi di client.
  const term = typeof search === 'string' ? search.trim().slice(0, 100) : '';
  if (term) {
    where.OR = [
      { student: { nim: { contains: term } } },
      { student: { nama: { contains: term } } },
      { mitra: { contains: term } },
    ];
  }

  return where;
}

/** Nilai `statusAktivitas` yang dikenal, satu sumber untuk seluruh service MBKM. */
const MBKM_STATUS = {
  DISSETUJUI: 'Disetujui',
  SELESAI: 'Selesai',
  DIAJUKAN: 'Diajukan',
  DITOLAK: 'Ditolak',
  DIBATALKAN: 'Dibatalkan',
};
/**
 * Status yang dihitung sebagai "partisipan MBKM": `Disetujui` = kegiatan
 * berjalan, `Selesai` = selesai, `Diajukan` = padanan "Evaluasi" di requirement.
 */
const MBKM_ACTIVE_STATUSES = [MBKM_STATUS.DISSETUJUI, MBKM_STATUS.SELESAI, MBKM_STATUS.DIAJUKAN];
/** Status yang masih menunggu verifikasi/evaluasi akademik. */
const MBKM_EVALUATION_STATUSES = [MBKM_STATUS.DIAJUKAN];

/**
 * Where clause agregasi aktivitas MBKM untuk seluruh kartu dalam satu modal,
 * supaya penyebut (`total`) antar tab berasal dari satu definisi.
 *
 * `allowedStatuses` = null berarti tidak ada pembatasan status (dipakai tab
 * status verifikasi). Filter status dari client selalu diiris terhadap scope,
 * bukan ditimpa diam-diam: memilih 'Ditolak' menghasilkan populasi kosong,
 * bukan angka yang menyamar sebagai "semua status".
 */
function buildActivityWhere(
  whereFilter = {},
  selectedPeriods,
  allowedStatuses = MBKM_ACTIVE_STATUSES,
) {
  const periods = Array.isArray(selectedPeriods)
    ? selectedPeriods.filter(Boolean)
    : selectedPeriods
      ? [selectedPeriods]
      : [];
  const where = {
    ...whereFilter,
    ...(periods.length === 1 ? { periode: periods[0] } : {}),
    ...(periods.length > 1 ? { periode: { in: periods } } : {}),
  };

  if (allowedStatuses) {
    const requested = where.statusAktivitas?.in;
    where.statusAktivitas = {
      in: requested
        ? requested.filter((status) => allowedStatuses.includes(status))
        : allowedStatuses,
    };
  }

  return where;
}

// Helper untuk mendapatkan periode terbaru dari database
async function getDefaultPeriode() {
  const latest = await prisma.mbkmActivity.findFirst({
    orderBy: { periode: 'desc' },
    select: { periode: true },
  });
  return latest?.periode || null;
}

/**
 * Satu tahun ajaran selalu berisi dua periode: `YYYY1` (Ganjil) dan `YYYY2`
 * (Genap). Tabel dan kartu menampilkan total keduanya saat user hanya memilih
 * tahun ajaran; filter periode eksplisit tetap memenangkan salah satunya.
 */
function getAcademicYearPeriods(tahunAjaran) {
  const start = getAcademicYearStart(tahunAjaran);
  return start === null ? [] : [`${start}1`, `${start}2`];
}

/** Daftar periode efektif: periode eksplisit > dua periode tahun ajaran > terbaru. */
async function resolvePeriods(query = {}) {
  if (query.periode) return [query.periode];

  const yearPeriods = getAcademicYearPeriods(query.tahunAjaran);
  if (yearPeriods.length) return yearPeriods;

  const latest = await getDefaultPeriode();
  return latest ? [latest] : [];
}

/** Daftar tabel: tanpa tahun ajaran tetap menampilkan semua periode seperti sebelumnya. */
async function resolveMbkmListFilter(query = {}) {
  if (query.periode || getAcademicYearStart(query.tahunAjaran) === null) {
    return buildMbkmFilter(query);
  }
  return buildMbkmFilter({ ...query, periode: await resolvePeriods(query) });
}

/**
 * Periode terpilih + where clause aktivitasnya — dua baris yang sebelumnya
 * ditulis ulang di setiap handler analisis MBKM.
 */
async function resolveMbkmQuery(query = {}) {
  const selectedPeriods = await resolvePeriods(query);
  return {
    selectedPeriode: selectedPeriods[0] ?? null,
    selectedPeriods,
    whereFilter: buildMbkmFilter({ ...query, periode: selectedPeriods }),
  };
}

/**
 * Build student where clause dari query params MBKM
 * (untuk endpoint yang query ke tabel students, seperti eligible students dan rate)
 */
function buildStudentFilterFromMbkmQuery(query) {
  const studentFilter = {};
  addInFilter(studentFilter, 'angkatan', query.angkatan);
  addInFilter(studentFilter, 'fakultas', query.fakultas);
  addInFilter(studentFilter, 'programStudi', query.programStudi);
  addInFilter(studentFilter, 'jenjang', query.jenjang);
  return studentFilter;
}

module.exports = {
  buildMbkmFilter,
  buildActivityWhere,
  getDefaultPeriode,
  resolvePeriods,
  resolveMbkmQuery,
  resolveMbkmListFilter,
  buildStudentFilterFromMbkmQuery,
  MBKM_STATUS,
  MBKM_ACTIVE_STATUSES,
  MBKM_EVALUATION_STATUSES,
};
