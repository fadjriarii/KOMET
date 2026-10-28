const prisma = require('../../../config/prisma');

/**
 * Ganti riwayat cuti satu periode. NIM `xx` (akun lama) dipetakan ke NIM bersih
 * yang ada di `students`; NIM yang tetap tidak dikenal tidak disimpan dan tidak
 * boleh menggagalkan sync.
 */
async function replaceCutiPeriods(periode, nims) {
  const candidates = [...(nims || [])];
  const cleaned = candidates.map((nim) => nim.replace(/x/gi, ''));
  const known = candidates.length
    ? await prisma.student.findMany({
        where: { nim: { in: [...new Set([...candidates, ...cleaned])] } },
        select: { nim: true },
      })
    : [];
  const knownNims = new Set(known.map((student) => student.nim));
  const byNim = new Map();
  for (const rawNim of candidates) {
    const nim = knownNims.has(rawNim) ? rawNim : rawNim.replace(/x/gi, '');
    if (knownNims.has(nim)) byNim.set(nim, { nim, periode });
  }
  const data = [...byNim.values()];

  await prisma.$transaction(async (tx) => {
    await tx.studentCutiPeriod.deleteMany({ where: { periode } });
    if (data.length) {
      await tx.studentCutiPeriod.createMany({ data, skipDuplicates: true });
    }
  });
  return data.length;
}

module.exports = { replaceCutiPeriods };
