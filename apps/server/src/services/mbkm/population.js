/**
 * population.js
 *
 * Satu populasi MBKM (ADR 0005) untuk kartu, popup, dan tabel: periode
 * terpilih P, mahasiswa eligible E, aktivitas dengan tanda `counted`, dan
 * partisipan. Fakultas, prodi, jenjang, dan
 * angkatan selalu dibaca dari kolom Student, baik untuk pembilang maupun
 * penyebut.
 *
 * shortcut: seluruh populasi dimuat ke memori (±2 ribu mahasiswa, ±600
 * aktivitas). Bila data tumbuh puluhan ribu baris, pindahkan agregasi ke SQL.
 */
const prisma = require('../../config/prisma');
const { addInFilter, hasFilters } = require('@komet/shared/filterUtils');
const { parsePeriode } = require('../../utils/academicUtils');
const { buildStudentFilterFromMbkmQuery } = require('./filterBuilder');
const { getEligibleStudentsAtPeriodes } = require('./mbkmEligibility');
const { statusRuleOf } = require('./statusRules');

const ACTIVITY_SELECT = {
  id: true,
  idAktivitas: true,
  nim: true,
  periode: true,
  jenisAktivitas: true,
  judulAktivitas: true,
  mitra: true,
  statusAktivitas: true,
  idStatusAktivitas: true,
  sksKonversi: true,
  programStudi: true,
  fakultas: true,
  student: {
    select: {
      nama: true,
      angkatan: true,
      jenjang: true,
      programStudi: true,
      fakultas: true,
      statusKeaktifan: true,
    },
  },
};

const searchTerm = (query) =>
  typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';

/** "Ganjil 2025/2026" dari `20251`; kode tak valid dikembalikan apa adanya. */
function periodeLabel(code) {
  const parsed = parsePeriode(code);
  return parsed ? `${parsed.isGanjil ? 'Ganjil' : 'Genap'} ${parsed.academicYear}` : code || '';
}

/** Label periode terpilih: satu periode, atau "Tahun Ajaran 2025/2026" untuk Ganjil + Genap. */
function periodsLabel(periods = []) {
  if (periods.length === 1) return periodeLabel(periods[0]);
  const years = [...new Set(periods.map((code) => parsePeriode(code)?.academicYear))];
  return years.length === 1 && years[0]
    ? `Tahun Ajaran ${years[0]}`
    : periods.map(periodeLabel).join(', ');
}

/** Kunci nama mitra: huruf kecil, tanpa tanda baca/spasi, supaya ejaan kembar bergabung. */
const mitraKey = (name) =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

function activityWhere(query, periods) {
  const where = { periode: { in: periods } };
  const student = buildStudentFilterFromMbkmQuery(query);
  if (hasFilters(student)) where.student = student;
  addInFilter(where, 'jenisAktivitas', query.jenisAktivitas);
  addInFilter(where, 'statusAktivitas', query.statusAktivitas);
  const term = searchTerm(query);
  if (term) {
    where.OR = [
      { nim: { contains: term } },
      { student: { nama: { contains: term } } },
      { mitra: { contains: term } },
    ];
  }
  return where;
}

/** Terhitung = mahasiswa eligible, kategori `participating`, dan jenis terisi. */
const isCounted = (activity, rule, isEligible) =>
  isEligible &&
  rule.category === 'participating' &&
  Boolean(String(activity.jenisAktivitas ?? '').trim());

/**
 * @param {object} query query MBKM yang sudah divalidasi
 * @param {string[]} periods periode terpilih (hasil `resolvePeriods`)
 * @returns {Promise<{
 *   periods: string[],
 *   eligible: object[],
 *   activities: object[],
 *   participants: Map<string, object>,
 *   pendingNims: Set<string>,
 * }>}
 */
async function loadMbkmPopulation(query, periods) {
  const [eligible, rawActivities] = await Promise.all([
    getEligibleStudentsAtPeriodes(buildStudentFilterFromMbkmQuery(query), periods),
    periods.length
      ? prisma.mbkmActivity.findMany({
          where: activityWhere(query, periods),
          select: ACTIVITY_SELECT,
        })
      : [],
  ]);

  const eligibleByNim = new Map(eligible.map((student) => [student.nim, student]));
  const participants = new Map();
  const pendingNims = new Set();

  const activities = rawActivities.map((activity) => {
    const rule = statusRuleOf(activity);
    const student = eligibleByNim.get(activity.nim);
    const row = { ...activity, rule, counted: isCounted(activity, rule, Boolean(student)) };

    if (student && rule.category === 'pending') pendingNims.add(activity.nim);
    if (row.counted) {
      const entry = participants.get(activity.nim) || {
        student,
        activities: [],
        best: rule,
        sks: 0,
        sksKnown: false,
      };
      entry.activities.push(row);
      if (rule.rank > entry.best.rank) entry.best = rule;
      if (activity.sksKonversi !== null && activity.sksKonversi !== undefined) {
        entry.sks += activity.sksKonversi;
        entry.sksKnown = true;
      }
      participants.set(activity.nim, entry);
    }
    return row;
  });

  // "Menunggu persetujuan" = eligible yang hanya punya aktivitas Diajukan.
  for (const nim of participants.keys()) pendingNims.delete(nim);

  return { periods, eligible, activities, participants, pendingNims };
}

module.exports = {
  loadMbkmPopulation,
  periodeLabel,
  periodsLabel,
  mitraKey,
};
