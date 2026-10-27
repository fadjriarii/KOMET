/**
 * Tabel MBKM Data: populasi dan periode yang sama dengan kartu (ADR 0005).
 * Setiap baris membawa tanda `counted` beserta alasannya, supaya total tabel
 * bisa dicocokkan dengan kartu. Filter `statusPartisipasi` hanya berlaku di sini;
 * `notParticipating` mengembalikan mahasiswa eligible tanpa aktivitas terhitung.
 */
const { TABLE_LIMIT } = require('@komet/shared/constants');
const { resolvePeriods } = require('./filterBuilder');
const { loadMbkmPopulation, periodeLabel, searchTerm, sksGroupOf } = require('./population');

const NO_ACTIVITY_REASON = 'Belum ada aktivitas terhitung';

function activityRow(activity, participants) {
  const student = activity.student || {};
  return {
    id: activity.id,
    nim: activity.nim,
    nama: student.nama || '',
    periode: activity.periode,
    periodeLabel: periodeLabel(activity.periode),
    angkatan: student.angkatan || '',
    programStudi: student.programStudi || activity.programStudi,
    fakultas: student.fakultas || activity.fakultas,
    jenjang: student.jenjang || '',
    statusKeaktifan: student.statusKeaktifan || '',
    jenisAktivitas: activity.jenisAktivitas,
    judulAktivitas: activity.judulAktivitas,
    mitra: activity.mitra,
    statusAktivitas: activity.statusAktivitas,
    statusCategory: activity.rule.category,
    sksKonversi: activity.sksKonversi,
    totalSks: participants.get(activity.nim)?.sksKnown ? participants.get(activity.nim).sks : null,
    tanggalMulai: activity.tanggalMulai,
    tanggalSelesai: activity.tanggalSelesai,
    counted: activity.counted,
    countedReason: activity.countedReason,
  };
}

/** Baris mahasiswa eligible tanpa aktivitas: kolom aktivitas kosong. */
function studentRow(student) {
  return {
    id: `eligible-${student.nim}`,
    nim: student.nim,
    nama: student.nama || '',
    periode: '',
    periodeLabel: '',
    angkatan: student.angkatan || '',
    programStudi: student.programStudi || '',
    fakultas: student.fakultas || '',
    jenjang: student.jenjang || '',
    statusKeaktifan: student.statusKeaktifan || '',
    jenisAktivitas: '',
    judulAktivitas: '',
    mitra: '',
    statusAktivitas: '',
    statusCategory: '',
    sksKonversi: null,
    totalSks: null,
    tanggalMulai: '',
    tanggalSelesai: '',
    counted: false,
    countedReason: NO_ACTIVITY_REASON,
  };
}

function selectRows(population, query) {
  const { activities, eligible, participants, pendingNims } = population;
  const toRow = (activity) => activityRow(activity, participants);

  switch (query.statusPartisipasi) {
    case 'participating':
      return activities.filter((a) => a.counted).map(toRow);
    case 'pending':
      return activities.filter((a) => pendingNims.has(a.nim)).map(toRow);
    case 'belowSks':
      return activities
        .filter((a) => a.counted && sksGroupOf(participants.get(a.nim)) !== 'met')
        .map(toRow);
    case 'notParticipating': {
      // Search pada mode ini hanya NIM/nama: mahasiswa tanpa aktivitas tidak punya mitra.
      const term = searchTerm(query).toLowerCase();
      return eligible
        .filter((student) => !participants.has(student.nim))
        .filter(
          (student) =>
            !term ||
            student.nim.toLowerCase().includes(term) ||
            String(student.nama || '')
              .toLowerCase()
              .includes(term),
        )
        .map(studentRow);
    }
    default:
      return activities.map(toRow);
  }
}

async function getMbkmList(query = {}, page = 1, limit = TABLE_LIMIT) {
  const periods = await resolvePeriods(query);
  const rows = selectRows(await loadMbkmPopulation(query, periods), query).sort(
    (a, b) =>
      b.periode.localeCompare(a.periode) ||
      a.nama.localeCompare(b.nama) ||
      a.nim.localeCompare(b.nim),
  );
  const total = rows.length;
  return {
    selectedPeriods: periods,
    data: rows.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

module.exports = { getMbkmList };
