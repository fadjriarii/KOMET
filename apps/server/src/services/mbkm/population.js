/**
 * population.js
 *
 * Satu populasi MBKM (ADR 0005) untuk kartu, popup, dan tabel: periode
 * terpilih P, mahasiswa eligible E, aktivitas dengan tanda `counted`,
 * partisipan semester 7, dan mahasiswa MBKM semua semester. Fakultas, prodi,
 * jenjang, dan angkatan selalu dibaca dari kolom Student, baik untuk pembilang
 * maupun penyebut.
 *
 * shortcut: seluruh populasi dimuat ke memori (±2 ribu mahasiswa, ±600
 * aktivitas). Bila data tumbuh puluhan ribu baris, pindahkan agregasi ke SQL.
 */
const prisma = require('../../config/prisma');
const { addInFilter, hasFilters } = require('@komet/shared/filterUtils');
const { parsePeriode } = require('../../utils/academicUtils');
const { buildStudentFilterFromMbkmQuery } = require('./filterBuilder');
const {
  getEligibleStudentsAtPeriodes,
  getStartPeriode,
  semesterAtPeriode,
} = require('./mbkmEligibility');
const { statusRuleOf } = require('./statusRules');
const { getPartnerIndex } = require('./partnerNames');

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
      periodeMasuk: true,
      periodeMasukAwal: true,
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

function activityWhere(query, periods, partnerOf) {
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
    // Ejaan lain dari mitra yang sama: "Indonesia International Institute for
    // Life-Sciences (i3L)" juga menemukan baris yang ditulis "I3L".
    const spellings = partnerOf?.spellingsMatching(term) ?? [];
    if (spellings.length) where.OR.push({ mitra: { in: spellings } });
  }
  return where;
}

/** Aktivitas sah: kategori `participating` dan jenis terisi, semester berapa pun. */
const isParticipating = (activity, rule) =>
  rule.category === 'participating' && Boolean(String(activity.jenisAktivitas ?? '').trim());

/**
 * @param {object} query query MBKM yang sudah divalidasi
 * @param {string[]} periods periode terpilih (hasil `resolvePeriods`)
 * @returns {Promise<{
 *   periods: string[],
 *   eligible: object[],
 *   activities: object[],
 *   participants: Map<string, object>,
 *   allParticipants: Map<string, { student: object, activities: object[] }>,
 *   pendingNims: Set<string>,
 * }>}
 */
async function loadMbkmPopulation(query, periods) {
  // Indeks mitra dulu: pencarian memakai ejaan gabungannya (di-cache, murah).
  const partnerOf = await getPartnerIndex();
  const [eligible, rawActivities] = await Promise.all([
    getEligibleStudentsAtPeriodes(buildStudentFilterFromMbkmQuery(query), periods),
    periods.length
      ? prisma.mbkmActivity.findMany({
          where: activityWhere(query, periods, partnerOf),
          select: ACTIVITY_SELECT,
        })
      : [],
  ]);

  const eligibleByNim = new Map(eligible.map((student) => [student.nim, student]));
  const participants = new Map();
  const allParticipants = new Map();
  const pendingNims = new Set();

  const activities = rawActivities.map((activity) => {
    const rule = statusRuleOf(activity);
    const student = eligibleByNim.get(activity.nim);
    const participating = isParticipating(activity, rule);
    const row = {
      ...activity,
      rule,
      counted: participating && Boolean(student),
      partner: partnerOf(activity.mitra),
    };

    if (student && rule.category === 'pending') pendingNims.add(activity.nim);
    if (participating && activity.student) {
      // Semester pada periode aktivitas paling awal di P (satu mahasiswa, satu semester).
      const entry = allParticipants.get(activity.nim) || { student: null, activities: [] };
      if (!entry.student || activity.periode < entry.periode) {
        entry.periode = activity.periode;
        entry.student = {
          ...activity.student,
          nim: activity.nim,
          semester: semesterAtPeriode(getStartPeriode(activity.student), activity.periode),
        };
      }
      entry.activities.push(row);
      allParticipants.set(activity.nim, entry);
    }
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

  return { periods, eligible, activities, participants, allParticipants, pendingNims };
}

module.exports = {
  loadMbkmPopulation,
  periodeLabel,
  periodsLabel,
};
