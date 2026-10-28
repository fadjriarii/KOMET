/**
 * masaStudi.js
 *
 * Rata-rata masa studi lulusan per jenjang (requirements/FORMULA.md §7):
 * semester kalender dari awal di i3L sampai lulus (`studyPeriodRange`, ADR 0004),
 * dikurangi semester cuti di rentang itu paling banyak 2 (batas cuti i3L).
 * Cuti ke-3 dan seterusnya tetap dihitung sebagai masa studi. Riwayat cuti dari
 * `student_cuti_periods` (`/perwalian`). Pengurangan ini hanya untuk kartu ini;
 * Tepat Waktu dan Keberhasilan Studi tetap memakai semester kalender.
 *
 * ponytail: dikelompokkan di Node atas baris dalam scope kartu, seperti
 * `tepatWaktu.js`, supaya aturan masa studi tetap satu implementasi.
 */
const prisma = require('../../config/prisma');
const { studyPeriodRange } = require('../../utils/academicUtils');
const { getScopeJenjangs } = require('./filterBuilder');
const {
  resolveTahunAjaranScope,
  valuesByYearAndJenjang,
  windowGraduateTrend,
} = require('./yearJenjangSeries');
const { jenjangTabs, seriesJenjangs } = require('./graduateCards');

/** Semester cuti yang boleh dikurangkan dari masa studi (batas cuti di i3L). */
const MAX_CUTI_DEDUCTED = 2;

const STUDY_SELECT = {
  jenjang: true,
  programStudi: true,
  periodeMasuk: true,
  periodeMasukAwal: true,
  periodeTerakhir: true,
  angkatan: true,
  cutiPeriods: { select: { periode: true } },
  graduate: { select: { tahunLulus: true, periodeWisuda: true } },
};

/**
 * Masa studi satu lulusan dalam semester, atau null bila datanya tidak lengkap.
 * `deducted` = semester cuti yang dikurangkan (0–2).
 */
function masaStudiOf(student) {
  const range = studyPeriodRange(student, student.graduate);
  if (!range) return null;
  const cuti = (student.cutiPeriods || []).filter(
    ({ periode }) => periode >= range.start && periode <= range.end,
  ).length;
  const deducted = Math.min(cuti, MAX_CUTI_DEDUCTED);
  return { semesters: Math.max(1, range.semesters - deducted), deducted };
}

const round2 = (value) => Math.round(value * 100) / 100;

/** Rata-rata semester + jumlah lulusan terhitung; tanpa data = `average: null`. */
function averageOf(students) {
  const values = students.map(masaStudiOf).filter(Boolean);
  if (!values.length) return { average: null, count: 0, cutiAdjusted: 0 };
  const total = values.reduce((sum, { semesters }) => sum + semesters, 0);
  return {
    average: round2(total / values.length),
    count: values.length,
    cutiAdjusted: values.filter(({ deducted }) => deducted > 0).length,
  };
}

/** Kartu: rata-rata per jenjang dalam scope kartu (Tahun Lulus terpilih). */
async function getMasaStudi(whereFilter) {
  const { where, tahunScope } = await resolveTahunAjaranScope(whereFilter);
  const [jenjangs, students] = await Promise.all([
    getScopeJenjangs(where),
    prisma.student.findMany({ where, select: STUDY_SELECT }),
  ]);
  const result = { tahunScope };
  for (const jenjang of jenjangs) {
    result[jenjang.toLowerCase()] = averageOf(students.filter((s) => s.jenjang === jenjang));
  }
  return result;
}

/**
 * Popup: sebaran jumlah semester per jenjang, rata-rata per prodi, dan tren
 * per Tahun Lulus (jendela 5 tahun, kecuali Tahun Lulus dipilih eksplisit).
 */
async function getMasaStudiDetail(whereFilter, trendFilter) {
  const { where } = await resolveTahunAjaranScope(whereFilter);
  const [students, series] = await Promise.all([
    prisma.student.findMany({ where, select: STUDY_SELECT }),
    valuesByYearAndJenjang(trendFilter, {
      valueOf: ({ items }) => averageOf(items).average,
      missing: null,
      select: STUDY_SELECT,
    }),
  ]);

  const distribution = {};
  for (const student of students) {
    const masa = masaStudiOf(student);
    if (!masa) continue;
    const key = student.jenjang.toLowerCase();
    const counts = (distribution[key] ??= new Map());
    counts.set(masa.semesters, (counts.get(masa.semesters) || 0) + 1);
  }
  const bySemester = Object.fromEntries(
    Object.entries(distribution).map(([key, counts]) => [
      key,
      [...counts]
        .sort(([a], [b]) => a - b)
        .map(([semester, count]) => ({ name: `${semester} semester`, semester, count })),
    ]),
  );

  const prodi = new Map();
  for (const student of students) {
    const name = student.programStudi || 'Tidak diketahui';
    if (!prodi.has(name)) prodi.set(name, []);
    prodi.get(name).push(student);
  }
  const byProdi = [...prodi]
    .map(([name, items]) => ({ name, ...averageOf(items) }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const byYear = windowGraduateTrend(series, trendFilter).map(({ tahun, ...averages }) => {
    const entry = { tahun };
    for (const [key, value] of Object.entries(averages)) entry[`${key}AvgSemester`] = value;
    return entry;
  });

  return {
    bySemester,
    jenjangs: jenjangTabs(bySemester),
    byProdi,
    byYear,
    trendJenjangs: seriesJenjangs(byYear, 'AvgSemester'),
  };
}

module.exports = { MAX_CUTI_DEDUCTED, masaStudiOf, getMasaStudi, getMasaStudiDetail };
