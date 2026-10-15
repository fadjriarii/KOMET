const { getCurrentAcademicPeriode } = require('./codes');

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

module.exports = { hitungSemester };
