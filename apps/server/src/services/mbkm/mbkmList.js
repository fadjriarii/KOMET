/**
 * Tabel MBKM Data: populasi dan periode yang sama dengan kartu (ADR 0005).
 */
const { TABLE_LIMIT } = require('@komet/shared/constants');
const { resolvePeriods } = require('./filterBuilder');
const { loadMbkmPopulation, periodeLabel } = require('./population');

function activityRow(activity, participants) {
  const student = activity.student || {};
  const participant = participants.get(activity.nim);
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
    // Nama mitra yang sudah digabung, sama dengan kartu Mitra.
    mitra: activity.partner?.name ?? activity.mitra,
    statusAktivitas: activity.statusAktivitas,
    statusCategory: activity.rule.category,
    sksKonversi: activity.sksKonversi,
    totalSks: participant?.sksKnown ? participant.sks : null,
  };
}

async function getMbkmList(query = {}, page = 1, limit = TABLE_LIMIT) {
  const periods = await resolvePeriods(query);
  const { activities, participants } = await loadMbkmPopulation(query, periods);
  const rows = activities
    .map((activity) => activityRow(activity, participants))
    .sort(
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
