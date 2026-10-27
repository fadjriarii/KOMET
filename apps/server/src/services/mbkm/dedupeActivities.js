const { statusRuleOf } = require('./statusRules');

const AKUN_LAMA_TEST = /akun\s*lama/i;
const AKUN_LAMA_TEXT = /\(?\s*(?:keterangan\s+)?akun\s+lama\s*\)?/gi;
const COMPLETENESS_FIELDS = [
  'idAktivitas',
  'periode',
  'programStudi',
  'fakultas',
  'jenjang',
  'statusKeaktifan',
  'jenisAktivitas',
  'idJenisKegiatan',
  'judulAktivitas',
  'mitra',
  'statusAktivitas',
  'idStatusAktivitas',
  'tanggalMulai',
  'tanggalSelesai',
  'sksKonversi',
];

const cleanNim = (value) =>
  String(value ?? '')
    .trim()
    .replace(/x{2,}/gi, '');
const isFilled = (value) => value !== null && value !== undefined && String(value).trim() !== '';

function containsAkunLama(value) {
  if (typeof value === 'string') return AKUN_LAMA_TEST.test(value);
  if (Array.isArray(value)) return value.some(containsAkunLama);
  if (value && typeof value === 'object') return Object.values(value).some(containsAkunLama);
  return false;
}

function stripAkunLama(value) {
  if (typeof value === 'string') {
    return value
      .replace(AKUN_LAMA_TEXT, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  if (Array.isArray(value)) return value.map(stripAkunLama);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, stripAkunLama(child)]),
    );
  }
  return value;
}

const completeness = (row) =>
  COMPLETENESS_FIELDS.reduce((total, key) => total + (isFilled(row[key]) ? 1 : 0), 0);

/** Timestamp aktivitas diutamakan, lalu id SEVIMA dan rank status. */
function newestFirst(a, b) {
  const aKey = [a.tanggalSelesai || '', a.tanggalMulai || '', Number(a.idAktivitas) || 0];
  const bKey = [b.tanggalSelesai || '', b.tanggalMulai || '', Number(b.idAktivitas) || 0];
  for (let i = 0; i < aKey.length; i += 1) {
    if (aKey[i] !== bKey[i]) return aKey[i] > bKey[i] ? -1 : 1;
  }
  return statusRuleOf(b).rank - statusRuleOf(a).rank;
}

function bestOf(rows) {
  return [...rows].sort((a, b) => completeness(b) - completeness(a) || newestFirst(a, b))[0];
}

/**
 * Dedup identitas MBKM sebelum/sesudah relink:
 * - NIM dibersihkan dari "xx";
 * - teks "akun lama" dibuang dari semua kolom (termasuk raw);
 * - satu NIM hanya menyisakan satu baris untuk setiap pasangan BKP + Mitra.
 * BKP = jenis_kegiatan (`jenisAktivitas`), Mitra = `nama_mitra` (`mitra`).
 */
function dedupeMbkmByIdentity(rows) {
  const total = rows.length;
  const oldAccountRows = rows.filter(containsAkunLama).length;
  const byNim = new Map();

  for (const row of rows) {
    const nim = cleanNim(row.nim);
    if (!nim) continue;
    const clean = stripAkunLama({ ...row, nim });
    if (!byNim.has(nim)) byNim.set(nim, []);
    byNim.get(nim).push(clean);
  }

  const kept = [];
  for (const group of byNim.values()) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }

    const byIdentity = new Map();
    for (const row of group) {
      const key = `${row.jenisAktivitas ?? ''}\u0000${row.mitra ?? ''}`;
      if (!byIdentity.has(key)) byIdentity.set(key, []);
      byIdentity.get(key).push(row);
    }
    for (const subGroup of byIdentity.values()) kept.push(bestOf(subGroup));
  }

  return {
    rows: kept,
    total,
    kept: kept.length,
    discarded: total - kept.length,
    oldAccountRows,
  };
}

module.exports = { dedupeMbkmByIdentity };
