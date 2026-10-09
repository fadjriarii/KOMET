/**
 * Kode periode akademik Sevima (`YYYYT`, T = 1 Ganjil / 2 Genap): membentuk kode
 * dari tanggal, membacanya kembali, dan menghitung semester.
 *
 * Aturan tahun akademik (bulan rollover) tidak ditulis ulang di sini — tahun
 * awal datang dari `@komet/shared/academicYear`, jadi jendela tren server dan
 * label filter client tidak bisa berbeda bulan.
 */
const { ACADEMIC_YEAR_ROLLOVER_MONTH } = require('@komet/shared/constants');
const { getCurrentAcademicYearStart } = require('../../utils/academicUtils');

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

function normalizeAcademicPeriod(value, defaultTerm = '1') {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const compact = raw.replace(/[/\-\s]+/g, '');
  if (/^\d{5}$/.test(compact) && ['1', '2'].includes(compact[4])) return compact;
  if (/^\d{4}$/.test(compact)) return `${compact}${defaultTerm}`;
  const match = raw.match(/^(\d{4}).*?([12])$/);
  return match ? `${match[1]}${match[2]}` : raw;
}

/**
 * Ekstrak field "Periode" dari kode periode Sevima.
 * Digit ke-5: 1 → "Ganjil", 2 → "Genap".
 * @param {string} idPeriode contoh "20251" atau "20252"
 * @returns {"Ganjil"|"Genap"|""}
 */
function extractPeriode(idPeriode) {
  if (!idPeriode || idPeriode.length < 5) return '';
  const digitTerm = idPeriode.substring(4, 5);
  if (digitTerm === '1') return 'Ganjil';
  if (digitTerm === '2') return 'Genap';
  return '';
}

/**
 * Mengembalikan kode periode akademik berjalan saat ini.
 * Tahun awal diambil dari `@komet/shared/academicYear` (satu-satunya tempat bulan
 * rollover disebut); semester adalah 6 bulan pertama tahun akademik = Ganjil,
 * sisanya Genap. Contoh 2026-10 → "20261", 2027-01 → "20261", 2027-03 → "20262".
 * @returns {string} kode periode 5 digit (contoh "20261" atau "20262")
 */
function getCurrentAcademicPeriode(date = new Date()) {
  const bulanSejakRollover =
    (new Date(date).getMonth() + 1 - ACADEMIC_YEAR_ROLLOVER_MONTH + 12) % 12;
  return `${getCurrentAcademicYearStart(date)}${bulanSejakRollover < 6 ? '1' : '2'}`;
}

/**
 * Menghitung semester mahasiswa berdasarkan periode masuk dan periode referensi.
 *
 * - Mahasiswa Aktif / tanpa periodeTerakhir: gunakan periode akademik berjalan saat ini.
 * - Mahasiswa Lulus/Keluar: gunakan periodeTerakhir (periode saat mereka lulus/keluar).
 *
 * Rumus: ((tahunAkhir - tahunMasuk) × 2) + (termAkhir - termMasuk) + 1
 *
 * @param {string} periodeMasuk       kode periode masuk (contoh "20221")
 * @param {string} periodeTerakhir    kode periode akhir; jika kosong/sama = pakai periode berjalan
 * @param {string} periodeMasukAwal   kode periode masuk awal jika mahasiswa transfer
 * @returns {number} semester (minimal 1)
 */
function hitungSemester(periodeMasuk, periodeTerakhir, periodeMasukAwal = null) {
  const startPeriode = periodeMasukAwal || periodeMasuk;
  if (!startPeriode) return 1;

  try {
    const tahunMasuk = parseInt(startPeriode.substring(0, 4));
    const termMasuk = parseInt(startPeriode.substring(4, 5)) || 1;

    if (isNaN(tahunMasuk)) return 1;

    // Tentukan periode referensi untuk kalkulasi
    const refPeriode =
      periodeTerakhir && periodeTerakhir.length >= 5
        ? periodeTerakhir
        : getCurrentAcademicPeriode();

    const tahunAkhir = parseInt(refPeriode.substring(0, 4));
    const termAkhir = parseInt(refPeriode.substring(4, 5)) || 1;

    if (isNaN(tahunAkhir)) return 1;

    const totalSemester = (tahunAkhir - tahunMasuk) * 2 + (termAkhir - termMasuk) + 1;
    return totalSemester > 0 ? totalSemester : 1;
  } catch {
    return 1;
  }
}

module.exports = {
  getPeriodeFromTanggalTransfer,
  formatAngkatan,
  formatTahunLulus,
  normalizeAcademicPeriod,
  extractPeriode,
  getCurrentAcademicPeriode,
  hitungSemester,
};
