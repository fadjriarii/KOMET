const { sanitizeProdiName, normalizeOptionalText, normalizeJenjang } = require('./text');
const { formatTahunLulus } = require('./academicPeriod');
const { STUDENT_STATUS } = require('@komet/shared/constants');

/**
 * Satu baris `/kelulusan` → baris graduate siap tulis (belum resolusi NIM).
 * Mengembalikan null bila NIM kosong.
 *
 * /kelulusan hanya memuat wisudawan: status diambil dari status keaktifan
 * sumber, predikat diambil apa adanya dari SK yudisium. Keduanya dulu
 * bertukar tempat — `nama_predikat` tersimpan di kolom status dan ikut
 * muncul sebagai pilihan di filter Status.
 */
function mapGraduateRow(attr) {
  if (!attr.nim) return null;

  const prodiName = sanitizeProdiName(attr.program_studi || '');

  // Ekstrak Tahun Lulus sebagai label ajaran ("2025" -> "2025/2026"):
  // nilai kanonis kolom `tahunLulus`, dihitung sekali di sini.
  let tahunLulus = '';
  if (attr.id_periode_akademik && attr.id_periode_akademik.length >= 4) {
    tahunLulus = formatTahunLulus(attr.id_periode_akademik.substring(0, 4));
  } else if (attr.tanggal_keluar) {
    tahunLulus = formatTahunLulus(attr.tanggal_keluar.substring(0, 4));
  } else if (attr.tanggal_sk_yudisium) {
    tahunLulus = formatTahunLulus(attr.tanggal_sk_yudisium.substring(0, 4));
  }

  const sourceStatus = normalizeOptionalText(attr.nama_status_mahasiswa);
  const statusKelulusan =
    sourceStatus && sourceStatus !== STUDENT_STATUS.AKTIF ? sourceStatus : STUDENT_STATUS.LULUS;

  return {
    nim: attr.nim,
    nama: attr.nama || '',
    jenjang: normalizeJenjang(attr.id_jenjang || 'S1'),
    id_periode_akademik: attr.id_periode_akademik || '',
    programStudi: prodiName,
    statusKelulusan,
    predikatLulus: normalizeOptionalText(attr.nama_predikat),
    tahunLulus,
    ipk: parseFloat(attr.ipk_lulusan) || 0,
    sksLulus: parseInt(attr.sks_total) || 0,
  };
}

/** Baris graduate siap bulk (NIM hasil resolusi). */
function toGraduateBulkRow(item, nim) {
  return {
    nim,
    jenjang: item.jenjang,
    statusKelulusan: item.statusKelulusan,
    predikatLulus: item.predikatLulus || '',
    tahunLulus: item.tahunLulus,
    periodeWisuda: item.id_periode_akademik || '',
    ipk: item.ipk,
    sksLulus: item.sksLulus,
    periodeTerakhir: item.id_periode_akademik || '',
  };
}

module.exports = { mapGraduateRow, toGraduateBulkRow };
