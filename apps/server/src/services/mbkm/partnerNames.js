/**
 * partnerNames.js
 *
 * Menggabungkan ejaan nama mitra MBKM yang berbeda menjadi satu mitra, dengan
 * aturan umum yang dibaca dari data (tanpa nama mitra di kode):
 *
 * 1. Huruf besar/kecil, tanda baca, kata badan usaha (PT, CV, Tbk, Persero),
 *    dan akhiran jamak "-s" diabaikan ("Semen Indonesia" = "PT. Semen Indonesia").
 * 2. Isian berkode mata kuliah ("BM41932 - Research Internship") digabung per
 *    kode, karena MBKM mata kuliah memakai kode sebagai mitranya.
 * 3. Singkatan bergabung dengan nama yang memuatnya dalam kurung ("I3L" dengan
 *    "... Life-Sciences (i3L)").
 * 4. Nama pendek bergabung dengan satu-satunya nama yang diawali kata-katanya
 *    ("Osaka University" dengan "Osaka University, Japan"). Bila ada dua nama
 *    panjang yang cocok, tidak digabung: tidak jelas yang mana.
 * 5. Salah ketik satu huruf pada nama panjang ("Indoneisia" vs "Indonesia").
 * 6. Tabel `mbkm_partner_aliases` untuk ejaan yang tidak bisa ditebak aturan
 *    ("MBKM - BRIN"). Alias baru berlaku tanpa mengubah kode.
 *
 * Nama tampil = `canonical` dari alias bila ada, selain itu ejaan paling
 * lengkap di grupnya: kata terbanyak, lalu paling sering dipakai (supaya salah
 * ketik tidak menang), lalu terpanjang.
 */
const prisma = require('../../config/prisma');

const CACHE_TTL_MS = 5 * 60 * 1000;
const LEGAL_WORDS = new Set(['pt', 'cv', 'tbk', 'persero']);
/** Kode mata kuliah di awal isian atau dalam kurung di akhir: "BM41932 - ...", "Internship (FT4191)". */
const COURSE_CODE = /^\s*([a-z]{2,4}\d{3,6})(?![a-z0-9])|\(([a-z]{2,4}\d{3,6})\)\s*$/i;
/** Panjang kunci minimal agar salah ketik satu huruf dianggap ejaan yang sama. */
const TYPO_MIN_LENGTH = 12;

const singular = (word) => (word.length > 3 && /[^s]s$/.test(word) ? word.slice(0, -1) : word);

/** Kata pembanding: huruf kecil, tanpa tanda baca, kata badan usaha, dan akhiran jamak. */
const partnerWords = (name) =>
  String(name ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !LEGAL_WORDS.has(word))
    .map(singular);

const courseCode = (name) => {
  const match = String(name ?? '').match(COURSE_CODE);
  return match ? (match[1] || match[2]).toLowerCase() : null;
};

/** Kunci perbandingan satu ejaan: kode mata kuliah bila ada, selain itu kata-katanya. */
function partnerKey(name) {
  const code = courseCode(name);
  return code ? `kode:${code}` : partnerWords(name).join('');
}

/** Singkatan dalam kurung di akhir nama: "... Life-Sciences (i3L)" → "i3l". */
const parenAcronym = (name) => partnerKey(String(name ?? '').match(/\(([^)]+)\)\s*$/)?.[1]);

/** Benar bila `a` dan `b` berbeda tepat satu huruf (ganti, sisip, atau hapus), bukan angka. */
function oneLetterApart(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const differs = [a[i], b[i]].filter(Boolean);
  if (differs.some((char) => /\d/.test(char))) return false;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/** Nama yang kata-katanya diawali `short` (kata utuh; satu kata boleh awalan huruf, min. 5). */
function startsWithWords(long, short) {
  if (long.length < short.length) return false;
  if (long.length === short.length) {
    return (
      short.length === 1 &&
      short[0].length >= 5 &&
      long[0] !== short[0] &&
      long[0].startsWith(short[0])
    );
  }
  return short.every((word, index) => long[index] === word);
}

/**
 * @param {string[]} names semua ejaan mitra yang tersimpan
 * @param {{ alias: string, canonical: string }[]} aliases isi tabel alias
 * @param {Map<string, number>} [counts] jumlah aktivitas per ejaan, penentu nama tampil
 * @returns {((name: string) => { key: string, name: string } | null) & {
 *   spellingsMatching: (term: string) => string[],
 * }}
 */
function buildPartnerIndex(names, aliases = [], counts = new Map()) {
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
  // Aturan 3: singkatan hanya bergabung bila ada nama yang ditulis sebagai singkatan itu.
  for (const name of names) {
    const acronym = parenAcronym(name);
    if (acronym && parent.has(acronym)) union(acronym, partnerKey(name));
  }

  // Aturan 4 dan 5 membandingkan nama tersimpan, bukan kode mata kuliah.
  const wordsByKey = new Map();
  for (const name of names) {
    const key = partnerKey(name);
    if (key && !key.startsWith('kode:')) wordsByKey.set(key, partnerWords(name));
  }
  const entries = [...wordsByKey];
  for (const [key, words] of entries) {
    if (key.length < 4) continue;
    const longer = entries.filter(
      ([other, otherWords]) => other !== key && startsWithWords(otherWords, words),
    );
    if (longer.length === 1) union(key, longer[0][0]);
  }
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const [a] = entries[i];
      const [b] = entries[j];
      if (Math.min(a.length, b.length) >= TYPO_MIN_LENGTH && oneLetterApart(a, b)) union(a, b);
    }
  }

  const wordCount = (name) => name.split(/[^A-Za-z0-9]+/).filter(Boolean).length;
  const moreComplete = (a, b) =>
    wordCount(b) - wordCount(a) ||
    (counts.get(b) || 0) - (counts.get(a) || 0) ||
    b.length - a.length ||
    a.localeCompare(b);

  const display = new Map();
  for (const key of parent.keys()) {
    const root = find(key);
    const canonical = canonicalKeys.get(key);
    if (canonical) {
      display.set(root, { name: canonical, fixed: true });
      continue;
    }
    const current = display.get(root);
    if (current?.fixed) continue;
    const best = [...(spellings.get(key) || []), ...(current ? [current.name] : [])].sort(
      moreComplete,
    )[0];
    if (best) display.set(root, { name: best, fixed: false });
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
    prisma.mbkmActivity.groupBy({ by: ['mitra'], _count: true, where: { mitra: { not: '' } } }),
    prisma.mbkmPartnerAlias.findMany({ select: { alias: true, canonical: true } }),
  ]);
  const index = buildPartnerIndex(
    groups.map((group) => group.mitra),
    aliases,
    new Map(groups.map((group) => [group.mitra.trim(), group._count])),
  );
  cache = { at: Date.now(), index };
  return index;
}

const clearPartnerIndex = () => {
  cache = null;
};

module.exports = { partnerKey, buildPartnerIndex, getPartnerIndex, clearPartnerIndex };
