const { sanitizeProdiName, normalizeOptionalText, normalizeJenjang } = require('./text');
const { resolveFakultas } = require('./sevimaLookup');

/**
 * Satu baris API → baris aktivitas siap tulis (belum resolusi NIM/status).
 * Mengembalikan null bila baris dilewati. Aktivitas tanpa jenis bukan
 * aktivitas MBKM — dibuang di ETL, bukan disaring saat baca.
 */
function mapMbkmRow(attr, prodiFakultasMap) {
  const jenisAktivitas = normalizeOptionalText(attr.jenis_kegiatan);
  if (!attr.nim || !jenisAktivitas) return null;

  const prodiName = sanitizeProdiName(attr.program_studi || '');

  return {
    nim: attr.nim,
    nama_mahasiswa: attr.nama_mahasiswa || '',
    jenjang: normalizeJenjang(attr.id_jenjang_program_studi || 'S1'),
    periode: attr.id_periode || '',
    programStudi: prodiName,
    fakultas: resolveFakultas(attr, prodiName, prodiFakultasMap),
    jenisAktivitas,
    judulAktivitas: normalizeOptionalText(attr.judul_aktivitas),
    mitra: normalizeOptionalText(attr.nama_mitra),
    statusAktivitas: attr.status_aktivitas || '',
  };
}

module.exports = { mapMbkmRow };
