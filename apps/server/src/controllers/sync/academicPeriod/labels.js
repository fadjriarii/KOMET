const { getCurrentAcademicPeriode } = require('./codes');

/**
 * Kode periode akademik (YYYY1 / YYYY2) dari tanggal transfer, mis. "2024-09-02".
 *
 * Satu aturan untuk seluruh aplikasi — sama dengan getCurrentAcademicPeriode():
 * - Ganjil: September tahun Y s.d. Februari tahun Y+1 -> kode tahun Y.
 *   2024-09-02 -> 20241, 2025-02-10 -> 20241
 * - Genap: Maret s.d. Agustus tahun Y -> kode tahun Y-1.
 *   2025-03-01 -> 20242, 2024-04-10 -> 20232
 * Tanggal kosong/invalid menghasilkan '' supaya caller memakai fallback id_periode.
 */
function getPeriodeFromTanggalTransfer(tanggalTransferStr) {
  if (!tanggalTransferStr) return '';
  const date = new Date(tanggalTransferStr);
  return Number.isNaN(date.getTime()) ? '' : getCurrentAcademicPeriode(date);
}

/**
 * Helper untuk memformat Angkatan dari kode periode Sevima sebagai label tahun
 * ajaran (misal: "20261" -> "2026/2027"). Label ajaran adalah nilai kanonis
 * kolom `angkatan`: ditulis sekali saat sync, dibaca verbatim setelahnya.
 */
function formatAngkatan(idPeriode) {
  if (!idPeriode || idPeriode.length < 4) return '';
  const start = Number(idPeriode.substring(0, 4));
  if (!Number.isInteger(start) || start < 1900) return '';
  return `${start}/${start + 1}`;
}

/**
 * Label tahun ajaran dari tahun lulus mentah saat ETL kelulusan
 * (misal: "2025" -> "2025/2026"). Nilai kanonis kolom `tahunLulus`.
 */
function formatTahunLulus(rawYear) {
  const start = Number(String(rawYear ?? '').trim());
  if (!Number.isInteger(start) || start < 1900) return '';
  return `${start}/${start + 1}`;
}

module.exports = { getPeriodeFromTanggalTransfer, formatAngkatan, formatTahunLulus };
