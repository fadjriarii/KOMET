const { sanitizeProdiName, normalizeOptionalText, normalizeJenjang } = require('./text');
const { resolveFakultas } = require('./sevimaLookup');

const trimmed = (value) => String(value ?? '').trim();
// SEVIMA mengirim `YYYY-MM-DD` (kadang dengan jam); kolom menyimpan tanggalnya saja.
const dateOnly = (value) => trimmed(value).slice(0, 10);

/**
 * Satu baris API → baris aktivitas siap tulis (belum resolusi NIM/status).
 * Mengembalikan null bila baris dilewati. Aktivitas tanpa jenis bukan
 * aktivitas MBKM — dibuang di ETL, bukan disaring saat baca. `raw` menyimpan
 * baris SEVIMA apa adanya supaya field baru tidak hilang (ADR 0005).
 */
function mapMbkmRow(attr, prodiFakultasMap) {
  const jenisAktivitas = normalizeOptionalText(attr.jenis_kegiatan);
  if (!attr.nim || !jenisAktivitas) return null;

  const prodiName = sanitizeProdiName(attr.program_studi || '');
  const idAktivitas = Number(attr.id_aktivitas);

  return {
    idAktivitas: Number.isInteger(idAktivitas) && idAktivitas > 0 ? idAktivitas : null,
    nim: attr.nim,
    nama_mahasiswa: attr.nama_mahasiswa || '',
    jenjang: normalizeJenjang(attr.id_jenjang_program_studi || ''),
    periode: trimmed(attr.id_periode),
    programStudi: prodiName,
    fakultas: resolveFakultas(attr, prodiName, prodiFakultasMap),
    jenisAktivitas,
    idJenisKegiatan: trimmed(attr.id_jenis_kegiatan),
    judulAktivitas: normalizeOptionalText(attr.judul_aktivitas),
    mitra: normalizeOptionalText(attr.nama_mitra),
    statusAktivitas: trimmed(attr.status_aktivitas),
    idStatusAktivitas: trimmed(attr.id_status_aktivitas),
    tanggalMulai: dateOnly(attr.tanggal_mulai),
    tanggalSelesai: dateOnly(attr.tanggal_selesai),
    raw: attr,
  };
}

/**
 * Feed SEVIMA bisa mengirim baris yang sama dua kali (terukur: 603 baris, 570
 * aktivitas unik). Satu baris per (idAktivitas, nim); baris tanpa id tetap
 * dipertahankan dan diserahkan ke dedup berbasis isi.
 *
 * @returns {{ rows: object[], duplicates: number }}
 */
function dedupeMbkmRows(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    if (row.idAktivitas === null) {
      out.push(row);
      continue;
    }
    const key = `${row.idAktivitas}|${row.nim}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return { rows: out, duplicates: rows.length - out.length };
}

/** Total SKS konversi per `id_aktivitas` dari baris `mata-kuliah-konversi-mbkm`. */
function sumSksByActivity(konversiRows) {
  const totals = new Map();
  for (const attr of konversiRows) {
    const id = Number(attr?.id_aktivitas);
    const sks = Number(attr?.sks_mata_kuliah);
    if (!Number.isInteger(id) || !Number.isFinite(sks)) continue;
    totals.set(id, (totals.get(id) || 0) + sks);
  }
  return totals;
}

module.exports = { mapMbkmRow, dedupeMbkmRows, sumSksByActivity };
