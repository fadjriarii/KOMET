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
const { mitraKey } = require('./population');

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

/** Popup Partisipasi Semester 7: tingkat per grup, status, dan yang belum ikut per prodi. */
function participationBreakdowns({ eligible, participants }) {
  const isParticipant = (nim) => participants.has(nim);
  const status = new Map();
  for (const [nim, { best }] of participants) addTo(status, best.label, nim);
  const notParticipating = eligible.filter((student) => !participants.has(student.nim));
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
    breakdown('status', 'Per Status', 'share', shareItems(status, participants.size)),
    breakdown(
      'belum',
      'Belum Berpartisipasi',
      'share',
      shareItems(groupStudents(notParticipating, 'programStudi'), notParticipating.length),
    ),
  ];
}

/** Popup Total Mahasiswa MBKM (semua semester): per semester, prodi, dan angkatan. */
function totalBreakdowns({ allParticipants }) {
  const students = [...allParticipants.values()].map(({ student }) => student);
  const total = students.length;
  const semester = new Map();
  for (const student of students) {
    addTo(semester, student.semester ? `Semester ${student.semester}` : UNKNOWN, student.nim);
  }
  return [
    breakdown('semester', 'Per Semester', 'share', shareItems(semester, total)),
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
  ];
}

/** Mahasiswa per jenis aktivitas; satu mahasiswa bisa masuk dua jenis. */
function jenisItems(allParticipants) {
  const jenis = new Map();
  for (const [nim, { activities }] of allParticipants) {
    for (const activity of activities) addTo(jenis, nameOf(activity.jenisAktivitas), nim);
  }
  return shareItems(jenis, allParticipants.size);
}

/** Popup Bentuk Kegiatan MBKM. */
const jenisBreakdowns = ({ allParticipants }) => [
  breakdown('jenis', 'Per Jenis Aktivitas', 'share', jenisItems(allParticipants)),
];

/**
 * Mitra unik dari aktivitas sah, urut jumlah mahasiswa. Ejaan kembar
 * digabung lewat `mitraKey` dan diberi nama ejaan yang paling sering.
 */
function rankPartners(participants) {
  const groups = new Map();
  for (const [nim, { activities }] of participants) {
    for (const { mitra, jenisAktivitas } of activities) {
      const key = mitraKey(mitra);
      if (!key) continue;
      const entry = groups.get(key) || { nims: new Set(), spellings: new Map(), jenis: new Set() };
      entry.nims.add(nim);
      entry.jenis.add(nameOf(jenisAktivitas));
      entry.spellings.set(mitra.trim(), (entry.spellings.get(mitra.trim()) || 0) + 1);
      groups.set(key, entry);
    }
  }
  return [...groups.values()]
    .map(({ nims, spellings, jenis }) => ({
      name: [...spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      nims,
      jenis,
    }))
    .sort((a, b) => b.nims.size - a.nims.size || a.name.localeCompare(b.name));
}

/** Angka kartu Mitra: jumlah mitra, mahasiswa bermitra, dan mitra teratas. */
function partnerSummary(participants) {
  const ranked = rankPartners(participants);
  const withPartner = new Set(ranked.flatMap(({ nims }) => [...nims])).size;
  const top = ranked[0] ? { name: ranked[0].name, count: ranked[0].nims.size } : null;
  return { totalPartners: ranked.length, withPartner, top };
}

/** Mitra teratas (top N dari server) dan sisanya digabung menjadi "Lainnya". */
function mitraItems(ranked, total, topN) {
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
  return items;
}

/** Popup Mitra: mitra teratas dan jumlah mitra per jenis aktivitas (semua semester). */
function mitraBreakdowns({ allParticipants }, topN = DEFAULT_MITRA_TOP_N) {
  const ranked = rankPartners(allParticipants);
  const jenis = new Map();
  ranked.forEach(({ jenis: names }, index) => names.forEach((name) => addTo(jenis, name, index)));
  return [
    breakdown('mitra', 'Mitra Teratas', 'share', mitraItems(ranked, allParticipants.size, topN)),
    breakdown('jenis', 'Mitra per Jenis Aktivitas', 'share', shareItems(jenis, ranked.length)),
  ];
}

module.exports = {
  participationBreakdowns,
  totalBreakdowns,
  jenisBreakdowns,
  jenisItems,
  mitraBreakdowns,
  partnerSummary,
  DEFAULT_MITRA_TOP_N,
};
