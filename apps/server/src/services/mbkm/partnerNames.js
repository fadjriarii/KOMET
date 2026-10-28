/**
 * partnerNames.js
 *
 * Menggabungkan ejaan nama mitra MBKM yang berbeda menjadi satu mitra:
 *
 * 1. Aturan otomatis yang aman: huruf besar/kecil, tanda baca, dan kata badan
 *    usaha (PT, CV, Tbk, Persero) diabaikan, dan nama yang hanya berupa
 *    singkatan bergabung dengan nama yang memuat singkatan itu dalam kurung
 *    ("I3L" dengan "... Life-Sciences (i3L)").
 * 2. Tabel `mbkm_partner_aliases` untuk ejaan yang tidak bisa ditebak aturan
 *    ("i3L University"). Alias baru berlaku tanpa mengubah kode.
 *
 * Nama tampil = `canonical` dari alias bila ada, selain itu ejaan terpanjang
 * di grupnya (biasanya yang paling lengkap).
 */
const prisma = require('../../config/prisma');

const CACHE_TTL_MS = 5 * 60 * 1000;
const LEGAL_WORDS = new Set(['pt', 'cv', 'tbk', 'persero']);

/** Kunci perbandingan: huruf kecil, tanpa kata badan usaha dan tanda baca. */
function partnerKey(name) {
  return String(name ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !LEGAL_WORDS.has(word))
    .join('');
}

/** Singkatan dalam kurung di akhir nama: "... Life-Sciences (i3L)" → "i3l". */
const parenAcronym = (name) => partnerKey(String(name ?? '').match(/\(([^)]+)\)\s*$/)?.[1]);

/**
 * @param {string[]} names semua ejaan mitra yang tersimpan
 * @param {{ alias: string, canonical: string }[]} aliases isi tabel alias
 * @returns {((name: string) => { key: string, name: string } | null) & {
 *   spellingsMatching: (term: string) => string[],
 * }}
 */
function buildPartnerIndex(names, aliases = []) {
  const parent = new Map();
  const find = (key) => {
    while (parent.get(key) !== key) {
      parent.set(key, parent.get(parent.get(key)));
      key = parent.get(key);
    }
    return key;
  };
  const add = (key) => key && !parent.has(key) && parent.set(key, key);
  const union = (a, b) => {
    if (!a || !b) return;
    add(a);
    add(b);
    parent.set(find(a), find(b));
  };

  const spellings = new Map();
  const remember = (name) => {
    const key = partnerKey(name);
    if (!key) return;
    add(key);
    if (!spellings.has(key)) spellings.set(key, new Set());
    spellings.get(key).add(String(name).trim());
  };

  names.forEach(remember);
  const canonicalKeys = new Map();
  for (const { alias, canonical } of aliases) {
    remember(alias);
    remember(canonical);
    union(partnerKey(alias), partnerKey(canonical));
    canonicalKeys.set(partnerKey(canonical), String(canonical).trim());
  }
  // Singkatan hanya bergabung bila ada nama yang benar-benar ditulis sebagai singkatan itu.
  for (const name of names) {
    const acronym = parenAcronym(name);
    if (acronym && parent.has(acronym)) union(acronym, partnerKey(name));
  }

  const display = new Map();
  for (const key of parent.keys()) {
    const root = find(key);
    const current = display.get(root);
    const canonical = canonicalKeys.get(key);
    const longest = [...(spellings.get(key) || [])].sort((a, b) => b.length - a.length)[0];
    if (canonical) display.set(root, { name: canonical, fixed: true });
    else if (longest && !current?.fixed && (!current || longest.length > current.name.length)) {
      display.set(root, { name: longest, fixed: false });
    }
  }

  // Ejaan tersimpan per grup: pencarian satu ejaan harus menemukan semua ejaan mitra itu.
  const stored = new Map();
  for (const name of names) {
    const key = partnerKey(name);
    if (!key) continue;
    const root = find(key);
    if (!stored.has(root)) stored.set(root, new Set());
    stored.get(root).add(name);
  }

  const partnerOf = (name) => {
    const key = partnerKey(name);
    if (!key) return null;
    if (!parent.has(key)) return { key, name: String(name).trim() };
    const root = find(key);
    return { key: root, name: display.get(root)?.name ?? String(name).trim() };
  };

  /** Semua ejaan tersimpan dari mitra yang nama tampil atau salah satu ejaannya memuat `term`. */
  partnerOf.spellingsMatching = (term) => {
    const needle = String(term ?? '')
      .trim()
      .toLowerCase();
    if (!needle) return [];
    const result = [];
    for (const [root, spellingSet] of stored) {
      const candidates = [display.get(root)?.name ?? '', ...spellingSet];
      if (candidates.some((candidate) => candidate.toLowerCase().includes(needle))) {
        result.push(...spellingSet);
      }
    }
    return result;
  };
  return partnerOf;
}

let cache = null;

/** Indeks dari seluruh ejaan mitra + tabel alias, di-cache 5 menit dan dibuang setelah sync. */
async function getPartnerIndex() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.index;
  const [groups, aliases] = await Promise.all([
    prisma.mbkmActivity.groupBy({ by: ['mitra'], where: { mitra: { not: '' } } }),
    prisma.mbkmPartnerAlias.findMany({ select: { alias: true, canonical: true } }),
  ]);
  const index = buildPartnerIndex(
    groups.map((group) => group.mitra),
    aliases,
  );
  cache = { at: Date.now(), index };
  return index;
}

const clearPartnerIndex = () => {
  cache = null;
};

module.exports = { partnerKey, buildPartnerIndex, getPartnerIndex, clearPartnerIndex };
