/**
 * mbkmBreakdowns.js
 *
 * Isi popup kartu MBKM sebagai `breakdowns: [{ key, label, kind, items }]`.
 * `kind = 'share'`: `percentage` = porsi dari total kartu. `kind = 'rate'`:
 * `percentage` = `count` ÷ `total` di grup itu sendiri (mis. partisipan ÷
 * eligible per fakultas), jadi tidak pernah melebihi 100%. Client merender tab
 * secara generik; pengelompokan baru cukup ditambah di sini.
 */
const { roundedRate } = require('../../utils/percentageUtils');
const { RECOGNITION_SKS, mitraKey, sksGroupOf } = require('./population');

const UNKNOWN = 'Tidak diketahui';
const DEFAULT_MITRA_TOP_N = 10;

const nameOf = (value) => String(value ?? '').trim() || UNKNOWN;

const byCount = (a, b) => b.count - a.count || a.name.localeCompare(b.name);

/** Porsi: satu mahasiswa dihitung sekali per nama grup. */
function shareItems(groups, total) {
  return [...groups]
    .map(([name, nims]) => ({
      name,
      count: nims.size,
      percentage: roundedRate(nims.size, total, null),
    }))
    .sort(byCount);
}

function addTo(groups, name, nim) {
  if (!groups.has(name)) groups.set(name, new Set());
  groups.get(name).add(nim);
}

/** Grup mahasiswa berdasarkan satu kolom Student. */
function groupStudents(students, field) {
  const groups = new Map();
  for (const student of students) addTo(groups, nameOf(student[field]), student.nim);
  return groups;
}

/** Tingkat per grup: anggota `numerator` ÷ anggota `denominator` di grup yang sama. */
function rateItems(denominator, isCounted) {
  return [...denominator]
    .map(([name, nims]) => {
      const count = [...nims].filter(isCounted).length;
      return { name, count, total: nims.size, percentage: roundedRate(count, nims.size, null) };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

const breakdown = (key, label, kind, items) => ({ key, label, kind, items });

function rateBreakdowns({ eligible, participants }) {
  const isParticipant = (nim) => participants.has(nim);
  return [
    breakdown(
      'fakultas',
      'Per Fakultas',
      'rate',
      rateItems(groupStudents(eligible, 'fakultas'), isParticipant),
    ),
    breakdown(
      'prodi',
      'Per Program Studi',
      'rate',
      rateItems(groupStudents(eligible, 'programStudi'), isParticipant),
    ),
  ];
}

/**
 * Mitra teratas berdasarkan jumlah partisipan; ejaan kembar digabung lewat
 * `mitraKey` dan diberi nama ejaan yang paling sering. Sisanya jadi "Lainnya".
 */
function mitraItems(participants, topN) {
  const groups = new Map();
  for (const [nim, { activities }] of participants) {
    for (const { mitra } of activities) {
      const key = mitraKey(mitra);
      if (!key) continue;
      const entry = groups.get(key) || { nims: new Set(), spellings: new Map() };
      entry.nims.add(nim);
      entry.spellings.set(mitra.trim(), (entry.spellings.get(mitra.trim()) || 0) + 1);
      groups.set(key, entry);
    }
  }
  const ranked = [...groups.values()]
    .map(({ nims, spellings }) => ({
      name: [...spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      nims,
    }))
    .sort((a, b) => b.nims.size - a.nims.size || a.name.localeCompare(b.name));

  const total = participants.size;
  const items = ranked.slice(0, topN).map(({ name, nims }) => ({
    name,
    count: nims.size,
    percentage: roundedRate(nims.size, total, null),
  }));
  const rest = new Set(ranked.slice(topN).flatMap(({ nims }) => [...nims]));
  if (rest.size) {
    items.push({
      name: 'Lainnya',
      count: rest.size,
      percentage: roundedRate(rest.size, total, null),
    });
  }
  return { items, totalPartners: ranked.length };
}

function participantBreakdowns({ participants }, topN = DEFAULT_MITRA_TOP_N) {
  const total = participants.size;
  const jenis = new Map();
  const status = new Map();
  for (const [nim, { activities, best }] of participants) {
    for (const activity of activities) addTo(jenis, nameOf(activity.jenisAktivitas), nim);
    addTo(status, best.label, nim);
  }
  const students = [...participants.values()].map(({ student }) => student);
  const mitra = mitraItems(participants, topN);

  return {
    totalPartners: mitra.totalPartners,
    breakdowns: [
      breakdown('jenis', 'Per Jenis Aktivitas', 'share', shareItems(jenis, total)),
      breakdown('status', 'Per Status', 'share', shareItems(status, total)),
      breakdown(
        'prodi',
        'Per Program Studi',
        'share',
        shareItems(groupStudents(students, 'programStudi'), total),
      ),
      breakdown(
        'angkatan',
        'Per Angkatan',
        'share',
        shareItems(groupStudents(students, 'angkatan'), total),
      ),
      breakdown('mitra', 'Per Mitra', 'share', mitra.items),
    ],
  };
}

function eligibleBreakdowns({ eligible, participants }) {
  const withGap = (field) =>
    shareItems(groupStudents(eligible, field), eligible.length).map((item) => ({
      ...item,
      notParticipating: eligible.filter(
        (student) => nameOf(student[field]) === item.name && !participants.has(student.nim),
      ).length,
    }));
  return [
    breakdown('prodi', 'Per Program Studi', 'share', withGap('programStudi')),
    breakdown('fakultas', 'Per Fakultas', 'share', withGap('fakultas')),
    breakdown('angkatan', 'Per Angkatan', 'share', withGap('angkatan')),
  ];
}

const SKS_GROUP_LABELS = {
  met: `≥ ${RECOGNITION_SKS} SKS`,
  below: `< ${RECOGNITION_SKS} SKS`,
  noData: 'Tanpa data SKS',
};

function recognitionBreakdowns({ participants }) {
  const groups = new Map(Object.values(SKS_GROUP_LABELS).map((label) => [label, new Set()]));
  const prodi = new Map();
  const jenis = new Map();
  for (const [nim, participant] of participants) {
    groups.get(SKS_GROUP_LABELS[sksGroupOf(participant)]).add(nim);
    addTo(prodi, nameOf(participant.student.programStudi), nim);
    for (const activity of participant.activities)
      addTo(jenis, nameOf(activity.jenisAktivitas), nim);
  }
  const meets = (nim) => sksGroupOf(participants.get(nim)) === 'met';
  // Urutan kelompok tetap (memenuhi, di bawah, tanpa data), bukan urut jumlah.
  const kelompok = [...groups]
    .map(([name, nims]) => ({
      name,
      count: nims.size,
      percentage: roundedRate(nims.size, participants.size, null),
    }))
    .filter((item) => item.count > 0);
  return [
    breakdown('kelompok', 'Per Kelompok SKS', 'share', kelompok),
    breakdown('prodi', 'Per Program Studi', 'rate', rateItems(prodi, meets)),
    breakdown('jenis', 'Per Jenis Aktivitas', 'rate', rateItems(jenis, meets)),
  ];
}

module.exports = {
  rateBreakdowns,
  participantBreakdowns,
  eligibleBreakdowns,
  recognitionBreakdowns,
  DEFAULT_MITRA_TOP_N,
};
