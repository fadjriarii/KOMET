/**
 * Mem-build Prisma where clause untuk query mbkm_activities
 * berdasarkan query parameters dari request.
 */

const prisma = require('../../config/prisma');
const { getAcademicYearStart, parsePeriode } = require('../../utils/academicUtils');
const { addInFilter, addSearchFilter, hasFilters } = require('@komet/shared/filterUtils');

function buildMbkmFilter(query) {
  const { search, fakultas, programStudi, angkatan, statusAktivitas, jenjang, periode } = query;

  const where = {};

  // Filter langsung di tabel mbkm_activities
  if (periode) where.periode = periode;

  addInFilter(where, 'statusAktivitas', statusAktivitas);
  addInFilter(where, 'jenjang', jenjang);
  addInFilter(where, 'fakultas', fakultas);
  addInFilter(where, 'programStudi', programStudi);

  // Filter via relasi ke student
  const studentFilter = {};

  addInFilter(studentFilter, 'angkatan', angkatan);
  addSearchFilter(studentFilter, search);

  if (hasFilters(studentFilter)) {
    where.student = studentFilter;
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
  selectedPeriode,
  allowedStatuses = MBKM_ACTIVE_STATUSES,
) {
  const where = {
    ...whereFilter,
    ...(selectedPeriode ? { periode: selectedPeriode } : {}),
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
 * Periode efektif: periode eksplisit menang. Tahun ajaran dipetakan ke periode
 * Ganjil-nya karena kohort eligible MBKM adalah semester 7; bila Ganjil belum
 * ada, pakai periode pertama yang tersedia di tahun itu.
 */
async function resolvePeriode(query = {}) {
  if (query.periode) return query.periode;

  const academicYearStart = getAcademicYearStart(query.tahunAjaran);
  if (academicYearStart !== null) {
    const earliest = await prisma.mbkmActivity.findFirst({
      where: { periode: { startsWith: String(academicYearStart) } },
      orderBy: { periode: 'asc' },
      select: { periode: true },
    });
    return earliest?.periode || `${academicYearStart}1`;
  }

  return getDefaultPeriode();
}

/** Daftar tabel: tanpa tahun ajaran tetap menampilkan semua periode seperti sebelumnya. */
async function resolveMbkmListFilter(query = {}) {
  if (query.periode || getAcademicYearStart(query.tahunAjaran) === null) {
    return buildMbkmFilter(query);
  }
  return buildMbkmFilter({ ...query, periode: await resolvePeriode(query) });
}

/**
 * Periode terpilih + where clause aktivitasnya — dua baris yang sebelumnya
 * ditulis ulang di setiap handler analisis MBKM.
 */
async function resolveMbkmQuery(query = {}) {
  const selectedPeriode = await resolvePeriode(query);
  return {
    selectedPeriode,
    whereFilter: buildMbkmFilter({ ...query, periode: selectedPeriode }),
  };
}

/** Card mitra memakai periode sebelumnya sebagai basis perbandingan. */
async function resolveMitraPeriode(query = {}) {
  if (query.periode) return query.periode;
  if (getAcademicYearStart(query.tahunAjaran) !== null) {
    return getPreviousPeriode(await resolvePeriode(query));
  }
  return getPreviousPeriode(await getDefaultPeriode());
}

/** Periode Ganjil (`YYYY1`) sebelum `currentPeriode`, memakai parsing periode tunggal. */
function getPreviousPeriode(currentPeriode) {
  const periode = typeof currentPeriode === 'string' ? parsePeriode(currentPeriode) : null;
  if (!periode) return null;
  return periode.isGanjil ? `${periode.year - 1}2` : `${periode.year}1`;
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
  getPreviousPeriode,
  resolvePeriode,
  resolveMbkmQuery,
  resolveMbkmListFilter,
  resolveMitraPeriode,
  buildStudentFilterFromMbkmQuery,
  MBKM_STATUS,
  MBKM_ACTIVE_STATUSES,
  MBKM_EVALUATION_STATUSES,
};
