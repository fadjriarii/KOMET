const prisma = require('../../config/prisma');
const { bulkUpsertGraduates } = require('./bulkWrite');
const { selectManualGraduates } = require('./manualGraduates');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/** Insert baris `graduate` untuk NIM yang tidak ada di API (manual seed). */
async function insertManualGraduates(syncedNims) {
  const pending = selectManualGraduates(syncedNims);
  if (pending.length === 0) return 0;
  const students = await prisma.student.findMany({
    where: { nim: { in: pending.map((row) => row.nim) } },
    select: { nim: true, jenjang: true },
  });
  const jenjangByNim = new Map(students.map((s) => [s.nim, s.jenjang]));
  const rows = pending
    .filter((row) => jenjangByNim.has(row.nim))
    .map((row) => ({
      nim: row.nim,
      jenjang: jenjangByNim.get(row.nim),
      statusKelulusan: STUDENT_STATUS.LULUS,
      predikatLulus: '',
      tahunLulus: row.tahunLulus,
      periodeWisuda: row.periodeWisuda,
      ipk: row.ipk,
      sksLulus: row.sksLulus,
      periodeTerakhir: row.periodeWisuda,
    }));
  if (rows.length === 0) return 0;
  await bulkUpsertGraduates(rows);
  return rows.length;
}

module.exports = { insertManualGraduates };
