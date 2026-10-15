const { Prisma } = require('@prisma/client');
const { bulkUpsert, sqlIdent, prisma, toStr, toNum } = require('./bulk');
const { STUDENT_STATUS } = require('@komet/shared/constants');

const GRADUATE_COLUMNS = [
  'nim',
  'jenjang',
  'statusKelulusan',
  'predikatLulus',
  'tahunLulus',
  'periodeWisuda',
  'ipk',
  'sksLulus',
];

/**
 * Tulis kelulusan secara massal, lalu tandai mahasiswa terkait sebagai Lulus.
 * periodeTerakhir dikelompokkan per nilainya agar satu UPDATE menutupi banyak NIM.
 */
async function bulkUpsertGraduates(rows) {
  if (!rows || rows.length === 0) return 0;

  async function markStudentsGraduated(chunk) {
    const nims = chunk.map((row) => toStr(row.nim));
    await prisma.$executeRaw(Prisma.sql`
      UPDATE ${sqlIdent('students')}
      SET ${sqlIdent('statusKeaktifan')} = ${STUDENT_STATUS.LULUS}
      WHERE ${sqlIdent('nim')} IN (${Prisma.join(nims)})
    `);

    const nimsByPeriode = new Map();
    chunk.forEach((row, index) => {
      const periode = toStr(row.periodeTerakhir);
      if (!periode) return;
      if (!nimsByPeriode.has(periode)) nimsByPeriode.set(periode, []);
      nimsByPeriode.get(periode).push(nims[index]);
    });
    for (const [periode, subset] of nimsByPeriode) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE ${sqlIdent('students')}
        SET ${sqlIdent('periodeTerakhir')} = ${periode}
        WHERE ${sqlIdent('nim')} IN (${Prisma.join(subset)})
      `);
    }
  }

  return bulkUpsert({
    table: 'graduates',
    columns: GRADUATE_COLUMNS,
    keyColumn: 'nim',
    rows,
    valuesOf: (row) => Prisma.sql`(
      ${toStr(row.nim)}, ${toStr(row.jenjang)}, ${toStr(row.statusKelulusan)},
      ${toStr(row.predikatLulus)}, ${toStr(row.tahunLulus)},
      ${toStr(row.periodeWisuda)}, ${toNum(row.ipk)}, ${toNum(row.sksLulus)}
    )`,
    afterChunk: markStudentsGraduated,
  });
}

module.exports = { bulkUpsertGraduates };
