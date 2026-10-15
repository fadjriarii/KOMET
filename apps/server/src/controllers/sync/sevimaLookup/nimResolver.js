const prisma = require('../../../config/prisma');
const { STUDENT_STATUS } = require('@komet/shared/constants');
const { cleanText, sanitizeProdiName, normalizeJenjang } = require('../text');
const { formatAngkatan, extractPeriode, hitungSemester } = require('../academicPeriod');
const { getProdiFakultasMap } = require('./prodiMap');

// Helper Resolver NIM Bulk (Pre-fetch In-Memory Map) untuk Batch Sync tanpa N+1 Query
async function resolveTargetNimBatch(items, extractNimFn, extractNamaFn, extraDataFn = () => ({})) {
  if (!items || items.length === 0) return new Map();

  const prodiFakultasMap = await getProdiFakultasMap();

  const nimsToLookup = new Set();
  items.forEach((item) => {
    const rawNim = extractNimFn(item);
    if (rawNim) {
      nimsToLookup.add(rawNim);
      const cleanNim = rawNim.replace(/x/gi, '');
      if (cleanNim) nimsToLookup.add(cleanNim);
    }
  });

  const existingStudents = await prisma.student.findMany({
    where: { nim: { in: Array.from(nimsToLookup) } },
    select: { nim: true },
  });

  const existingNimSet = new Set(existingStudents.map((s) => s.nim));
  const resolvedMap = new Map();
  const studentsToCreate = [];

  for (const item of items) {
    const rawNim = extractNimFn(item);
    if (!rawNim) continue;

    const cleanNim = rawNim.replace(/x/gi, '');

    if (existingNimSet.has(rawNim)) {
      resolvedMap.set(item, rawNim);
    } else if (cleanNim && existingNimSet.has(cleanNim)) {
      resolvedMap.set(item, cleanNim);
    } else {
      const targetNim = cleanNim || rawNim;
      resolvedMap.set(item, targetNim);

      if (!existingNimSet.has(targetNim)) {
        existingNimSet.add(targetNim); // Hindari duplikat create dalam batch yang sama
        const extraData = extraDataFn(item) || {};
        const idPeriode = extraData.id_periode_akademik || extraData.id_periode || '';
        const rawProdi = extraData.programStudi || extraData.prodiName || '';
        const prodi = sanitizeProdiName(rawProdi);
        const jenjang = normalizeJenjang(
          extraData.jenjang || extraData.id_jenjang_program_studi || 'S1',
        );
        const statusKeaktifan = extraData.defaultStatusKeaktifan || STUDENT_STATUS.AKTIF;
        const fakultas =
          extraData.fakultas ||
          prodiFakultasMap.get(cleanText(rawProdi)) ||
          prodiFakultasMap.get(cleanText(prodi)) ||
          '';
        const semester =
          extraData.defaultSemester ||
          (statusKeaktifan === STUDENT_STATUS.LULUS ? hitungSemester(idPeriode, idPeriode) : 1);

        studentsToCreate.push({
          nim: targetNim,
          nama: extractNamaFn(item) || '',
          jenjang,
          periodeMasuk: idPeriode,
          periodeTerakhir: statusKeaktifan === STUDENT_STATUS.LULUS ? idPeriode : '',
          angkatan: formatAngkatan(idPeriode),
          periode: extractPeriode(idPeriode),
          programStudi: prodi,
          fakultas,
          statusKeaktifan,
          semester,
          kewarganegaraan: 'Indonesia',
        });
      }
    }
  }

  if (studentsToCreate.length > 0) {
    await prisma.student.createMany({
      data: studentsToCreate,
      skipDuplicates: true,
    });
  }

  return resolvedMap;
}

module.exports = { resolveTargetNimBatch };
