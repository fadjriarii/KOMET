const prisma = require('../../config/prisma');
const { roundedRate } = require('../../utils/percentageUtils');
const { buildActivityWhere, MBKM_ACTIVE_STATUSES, MBKM_STATUS } = require('./filterBuilder');
const { getEligibleStudentsAtPeriodes } = require('./mbkmEligibility');

/**
 * Analisis partisipasi MBKM vs mahasiswa eligible pada periode terpilih.
 *
 * Satu periode = perilaku lama. Dua periode (tahun ajaran tanpa filter
 * Ganjil/Genap) = gabungan aktivitas Ganjil + Genap, dengan penyebut gabungan
 * kohort semester 7 yang dideduplikasi per NIM.
 *
 * Pembilang = mahasiswa unik di kohort eligible yang punya aktivitas pada
 * periode itu. Membatasi ke kohort yang sama membuat persentase tidak pernah
 * melebihi 100% dan tidak mencampur mahasiswa semester lain.
 */
async function getMbkmRate(whereFilter = {}, selectedPeriods, studentFilter = {}) {
  const eligibleStudents = await getEligibleStudentsAtPeriodes(studentFilter, selectedPeriods);
  const eligibleCount = eligibleStudents.length;
  const eligibleNims = eligibleStudents.map((student) => student.nim);

  let activities = [];
  if (eligibleNims.length) {
    const where = buildActivityWhere(whereFilter, selectedPeriods);
    // Syarat requirement: jenis aktivitas tidak boleh kosong.
    where.jenisAktivitas = { not: '' };
    where.nim = { in: eligibleNims };
    activities = await prisma.mbkmActivity.findMany({
      where,
      select: { nim: true, statusAktivitas: true, fakultas: true },
    });
  }

  const eligibleNimSet = new Set(eligibleNims);
  const activeStatuses = new Set(MBKM_ACTIVE_STATUSES);
  const participants = new Set();
  const facultyParticipants = new Map();
  const byStatus = new Map();

  for (const activity of activities) {
    // Penjaga yang sama dengan where: DB boleh mengembalikan baris lama, angka
    // tidak boleh ikut naik hanya karena query berubah.
    if (!eligibleNimSet.has(activity.nim) || !activeStatuses.has(activity.statusAktivitas)) {
      continue;
    }
    participants.add(activity.nim);
    byStatus.set(activity.statusAktivitas, (byStatus.get(activity.statusAktivitas) || 0) + 1);
    const faculty = activity.fakultas || 'Tidak diketahui';
    if (!facultyParticipants.has(faculty)) facultyParticipants.set(faculty, new Set());
    facultyParticipants.get(faculty).add(activity.nim);
  }

  const count = participants.size;
  const countStatus = (status) => byStatus.get(status) || 0;
  const facultyData = [...facultyParticipants]
    .map(([name, nims]) => ({
      name,
      count: nims.size,
      percentage: roundedRate(nims.size, count, 0),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    participantStats: {
      count,
      disetujuiCount: countStatus(MBKM_STATUS.DISSETUJUI),
      selesaiCount: countStatus(MBKM_STATUS.SELESAI),
      evaluasiCount: countStatus(MBKM_STATUS.DIAJUKAN),
    },
    eligibleCount,
    // null = tidak ada penyebut; client menampilkannya sebagai "-", bukan 0%.
    eligibleRate: { numPercentage: roundedRate(count, eligibleCount, null) },
    facultyData,
  };
}

module.exports = { getMbkmRate };
