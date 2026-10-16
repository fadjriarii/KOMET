const prisma = require('../../config/prisma');
const logger = require('../../utils/logger');
const { hitungSemester } = require('./academicPeriod');
const { personKeys, isStatusPindah } = require('../../services/studentDeduplicationService');

const PERIODE_RE = /^(\d{4})([12])$/;

/** Paruh periode tepat setelah `code` (`20212` → `20221`), null bila bukan kode valid. */
function expectedNext(code) {
  const m = PERIODE_RE.exec((code || '').trim());
  if (!m) return null;
  return m[2] === '1' ? `${m[1]}2` : `${Number(m[1]) + 1}1`;
}

function sameJenjang(a, b) {
  return (a?.jenjang || '').toLowerCase().trim() === (b?.jenjang || '').toLowerCase().trim();
}

/**
 * Peta nim → periodeMasuk paling awal dari rantai transfer yang bersambung.
 * Syarat sambungan (semua harus cocok, kalau tidak enrollment dihitung sendiri):
 * - orang yang sama (NIK valid atau nama + tgl lahir) dan jenjang sama
 *   (S1 → S2 adalah studi baru, bukan sambungan; dua enrollment paralel yang
 *   tumpang-tindih juga bukan sambungan),
 * - pendahulu berstatus pindahan (Transfer/Mutasi) dengan periodeTerakhir terisi,
 * - periode masuk tepat satu paruh setelah periodeTerakhir pendahulu (studi
 *   kontinu — jeda bertahun-tahun tidak ikut tersambung).
 */
function buildAwalMap(rows) {
  const byNim = new Map(rows.map((r) => [r.nim, r]));
  const keyIndex = new Map();
  for (const r of rows) {
    for (const key of personKeys(r)) {
      if (!keyIndex.has(key)) keyIndex.set(key, []);
      keyIndex.get(key).push(r);
    }
  }

  const validMasuk = (r) =>
    PERIODE_RE.test((r.periodeMasuk || '').trim()) ? r.periodeMasuk.trim() : null;
  const awalMemo = new Map();

  function predecessor(row) {
    const masuk = validMasuk(row);
    if (!masuk) return null;
    const seen = new Set();
    for (const key of personKeys(row)) {
      for (const cand of keyIndex.get(key) || []) {
        if (cand.nim !== row.nim) seen.add(cand.nim);
      }
    }
    let best = null;
    for (const nim of seen) {
      const cand = byNim.get(nim);
      if (!sameJenjang(cand, row)) continue;
      const candMasuk = validMasuk(cand);
      const candAkhir = (cand.periodeTerakhir || '').trim();
      if (!candMasuk || candMasuk >= masuk) continue;
      if (!PERIODE_RE.test(candAkhir)) continue;
      if (!isStatusPindah(cand.statusKeaktifan)) continue;
      if (expectedNext(candAkhir) !== masuk) continue;
      if (!best || candMasuk > validMasuk(best)) best = cand;
    }
    return best;
  }

  function awalOf(row) {
    if (awalMemo.has(row.nim)) return awalMemo.get(row.nim);
    const pred = predecessor(row);
    // Masuk strictly menurun di sepanjang rantai, jadi rekursi pasti berhenti.
    const awal = pred ? awalOf(pred) || validMasuk(pred) : null;
    awalMemo.set(row.nim, awal);
    return awal;
  }

  const out = new Map();
  for (const row of rows) {
    const masuk = validMasuk(row);
    const awal = awalOf(row);
    if (masuk && awal && awal < masuk) out.set(row.nim, awal);
  }
  return out;
}

/**
 * Tulis ulang semester enrollment hasil transfer dari periode masuk paling
 * awal rantainya. Dijalankan tiap sync sesudah upsert (dan menutup baris lama
 * yang API-nya tidak berubah — aturannya dihitung dari data DB, bukan API).
 */
async function applyTransferSemester(db = prisma) {
  const rows = await db.student.findMany({
    select: {
      nim: true,
      jenjang: true,
      periodeMasuk: true,
      periodeMasukAwal: true,
      periodeTerakhir: true,
      statusKeaktifan: true,
      semester: true,
      nik: true,
      nama: true,
      tanggalLahir: true,
    },
  });
  const awalMap = buildAwalMap(rows);
  let updated = 0;
  let awalFilled = 0;
  const details = [];
  for (const row of rows) {
    // Awal rantai dipersisten agar jalur baca bisa memproyeksikan semester ke
    // tahun ajaran mana pun tanpa memindai ulang seluruh tabel.
    const awal = awalMap.get(row.nim) || '';
    const fixed =
      awal && awal < (row.periodeMasuk || '').trim()
        ? hitungSemester(row.periodeMasuk, row.periodeTerakhir || null, awal)
        : row.semester;
    if (fixed !== row.semester || awal !== (row.periodeMasukAwal || '')) {
      await db.student.update({
        where: { nim: row.nim },
        data: { semester: fixed, periodeMasukAwal: awal },
      });
      if (awal !== (row.periodeMasukAwal || '')) awalFilled++;
      if (fixed !== row.semester) {
        updated++;
        details.push({ nim: row.nim, nama: row.nama, dari: row.semester, ke: fixed, awal });
      }
    }
  }
  if (updated > 0) {
    logger.success(`🎓 Semester transfer dikoreksi dari awal masuk: ${updated} enrollment.`);
  } else {
    logger.info('🎓 Tidak ada semester transfer yang perlu dikoreksi.');
  }
  if (awalFilled > 0) {
    logger.info(`🎓 Awal rantai transfer dipersisten: ${awalFilled} enrollment.`);
  }
  return { checked: rows.length, chained: awalMap.size, updated, awalFilled, details };
}

module.exports = { buildAwalMap, applyTransferSemester };
