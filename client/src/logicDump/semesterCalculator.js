/**
 * semesterCalculator.js
 * Modul utilitas terisolasi untuk menghitung semester mahasiswa secara presisi
 * berbasis 'angkatan' (Tahun Masuk) dan 'tahun_lulus' (Tahun Kelulusan).
 *
 * Catatan Penting Perubahan:
 * Field 'updated_at' / 'updatedAt' tidak lagi digunakan untuk kalkulasi kelulusan karena
 * merupakan stempel waktu sinkronisasi database (misal: 2026), bukan tanggal kelulusan riil.
 * Sebagai gantinya, perhitungan memanfaatkan atribut asli 'angkatan' dan 'tahun_lulus'.
 *
 * File ini dirancang terisolasi dan modular sehingga mudah dihapus saat backend resmi telah siap.
 */

import { kelulusanData } from '@/data/KomatQAmit_DB_DataDump';

// Baseline periode akademik acuan saat ini (September 2026 = Semester Ganjil 2026/2027)
export const CURRENT_YEAR = 2026;
export const CURRENT_TERM = 1; // 1: Ganjil, 2: Genap
export const CURRENT_PERIOD = `${CURRENT_YEAR}-${CURRENT_TERM}`;

/**
 * Cache lookup map NIM -> tahun_lulus dari dataset kelulusanData.
 * Memastikan mahasiswa yang berada di dataset mahasiswaData tetap memperoleh
 * data tahun_lulus yang akurat meskipun field di objeknya tidak terisi langsung.
 */
const graduateYearMap = new Map();
if (Array.isArray(kelulusanData)) {
  kelulusanData.forEach((grad) => {
    const nim = String(grad.nim || '').trim();
    const yr = Number(grad.tahun_lulus);
    if (nim && !isNaN(yr) && yr > 0) {
      graduateYearMap.set(nim, yr);
    }
  });
}

/**
 * Mengurai string periode (misal: "semester ganjil 2023/2024", "2024-1", "2024_2")
 * menjadi tahun dan term semester.
 *
 * @param {string|number} rawPeriod - String periode yang akan diparse
 * @param {number|string} [rawAngkatan] - Tahun angkatan sebagai fallback
 * @returns {{ entryYear: number, entryTerm: number }} Objek berisi tahun dan term (1: Ganjil, 2: Genap)
 */
export const parseEntryPeriod = (rawPeriod, rawAngkatan) => {
  const str = String(rawPeriod || '').trim().toLowerCase();

  // Pola format ringkas: "2024-1", "2024-2", "2024_1", "20241", "20242"
  const dashMatch = str.match(/^(\d{4})[-_]?([12])$/);
  if (dashMatch) {
    return {
      entryYear: parseInt(dashMatch[1], 10),
      entryTerm: parseInt(dashMatch[2], 10),
    };
  }

  // Pola teks: "semester ganjil 2024/2025" atau "semester genap 2024/2025"
  const textMatch = str.match(/semester\s+(ganjil|genap)\s+(\d{4})/i);
  if (textMatch) {
    const isGenap = textMatch[1].toLowerCase() === 'genap';
    return {
      entryYear: parseInt(textMatch[2], 10),
      entryTerm: isGenap ? 2 : 1,
    };
  }

  // Pola tahun 4 digit umum dalam string periode
  const yearMatch = str.match(/(\d{4})/);
  if (yearMatch) {
    const isGenap = str.includes('genap') || str.includes('-2') || str.includes('_2');
    return {
      entryYear: parseInt(yearMatch[1], 10),
      entryTerm: isGenap ? 2 : 1,
    };
  }

  // Fallback ke angkatan jika string periode tidak berisi format tahun
  const angkatanNum = parseInt(String(rawAngkatan || ''), 10);
  if (!isNaN(angkatanNum) && angkatanNum > 2000) {
    return {
      entryYear: angkatanNum,
      entryTerm: 1, // Angkatan baru diasumsikan masuk pada Semester Ganjil (Term 1)
    };
  }

  // Fallback default aman
  return {
    entryYear: CURRENT_YEAR,
    entryTerm: CURRENT_TERM,
  };
};

/**
 * Mengidentifikasi jenjang studi mahasiswa (S1 vs S2).
 *
 * @param {Object} student - Objek data mahasiswa
 * @returns {'S1' | 'S2'} Jenjang pendidikan
 */
export const inferDegreeLevel = (student = {}) => {
  const rawJenjang = String(student.jenjang || '').trim().toUpperCase();
  if (rawJenjang.includes('S2') || rawJenjang.includes('MAGISTER') || rawJenjang.includes('MASTER')) {
    return 'S2';
  }
  if (rawJenjang.includes('S1') || rawJenjang.includes('SARJANA') || rawJenjang.includes('BACHELOR')) {
    return 'S1';
  }

  const prodi = String(student.program_studi || student.prodi || '').toLowerCase();
  const fakultas = String(student.fakultas || '').toLowerCase();

  const isS2 =
    prodi.includes('magister') ||
    prodi.includes('s2') ||
    prodi.includes('master') ||
    fakultas.includes('magister') ||
    fakultas.includes('s2') ||
    fakultas.includes('master');

  return isS2 ? 'S2' : 'S1';
};

/**
 * Mendapatkan batas maksimal semester masa studi berdasarkan jenjang.
 * - S1 (Sarjana): Maksimal 7 tahun (14 semester)
 * - S2 (Magister): Maksimal 4 tahun (8 semester)
 *
 * @param {'S1' | 'S2' | string} jenjang - Jenjang pendidikan
 * @returns {number} Batas maksimal semester
 */
export const getMaxSemesterLimit = (jenjang = 'S1') => {
  return String(jenjang).toUpperCase() === 'S2' ? 8 : 14;
};

/**
 * Menghitung semester mahasiswa secara presisi berdasarkan angkatan dan status keaktifan.
 *
 * Aturan Perhitungan:
 * 1. Start Year selalu ditentukan secara ketat oleh `angkatan` mahasiswa (misal: 2021).
 * 2. Jika `status_keaktifan === 'Lulus'`:
 *    - Menggunakan `tahun_lulus` sebagai End Year.
 *    - Formula: (tahun_lulus - angkatan) * 2. (Contoh: angkatan 2021 lulus 2024 -> (2024 - 2021) * 2 = 6 Semester).
 * 3. Jika `status_keaktifan === 'Aktif'`:
 *    - Menggunakan `CURRENT_YEAR` (2026) sebagai End Year.
 *    - Formula: ((CURRENT_YEAR - angkatan) * 2) + CURRENT_TERM. (Contoh: angkatan 2021 di 2026-1 -> ((2026 - 2021) * 2) + 1 = 11 Semester).
 * 4. Jika status lain (`Cuti`, `Drop Out`, `Mengundurkan Diri`, `Transfer`, dll.):
 *    - Jika memiliki `tahun_lulus`, gunakan `tahun_lulus`.
 *    - Jika tidak, ekstrak tahun akhir dari string `periode` mahasiswa, atau fallback ke angkatan (keadaan beku).
 *
 * @param {Object} student - Objek data mahasiswa
 * @param {number} [currentYear=CURRENT_YEAR] - Tahun berjalan sistem saat ini
 * @param {number} [currentTerm=CURRENT_TERM] - Term berjalan sistem saat ini (1: Ganjil, 2: Genap)
 * @returns {number} Hasil perhitungan semester (minimal 1)
 */
export const calculatePreciseSemester = (
  student,
  currentYear = CURRENT_YEAR,
  currentTerm = CURRENT_TERM
) => {
  if (!student) return 1;

  // 1. Tentukan Tahun Masuk (Start Year) secara ketat dari field angkatan
  let startYear = Number(student.angkatan);
  if (isNaN(startYear) || startYear <= 2000) {
    const parsed = parseEntryPeriod(student.periode, student.angkatan);
    startYear = parsed.entryYear;
  }

  const rawStatus = String(student.status_keaktifan || '').trim().toLowerCase();

  // 2. Kalkulasi khusus Mahasiswa Lulus
  if (rawStatus === 'lulus') {
    // Ambil tahun_lulus dari objek mahasiswa, atau dari kelulusanData via NIM lookup
    const nim = String(student.nim || '').trim();
    let gradYear = Number(student.tahun_lulus);

    if (isNaN(gradYear) || gradYear <= 0) {
      if (graduateYearMap.has(nim)) {
        gradYear = graduateYearMap.get(nim);
      }
    }

    // Jika tahun_lulus ditemukan, hitung durasi riil kelulusan: (tahun_lulus - angkatan) * 2
    if (!isNaN(gradYear) && gradYear >= startYear) {
      const sem = (gradYear - startYear) * 2;
      return sem < 1 ? 1 : sem;
    }

    // Fallback jika tahun_lulus tidak tercatat: ekstrak tahun dari string periode
    const parsedPeriode = parseEntryPeriod(student.periode, startYear);
    const endYear = parsedPeriode.entryYear >= startYear ? parsedPeriode.entryYear : startYear + 4;
    const sem = (endYear - startYear) * 2;
    return sem < 1 ? 1 : sem;
  }

  // 3. Kalkulasi khusus Mahasiswa Aktif
  if (rawStatus === 'aktif') {
    const sem = (currentYear - startYear) * 2 + currentTerm;
    return sem < 1 ? 1 : sem;
  }

  // 4. Kalkulasi untuk Mahasiswa Non-Aktif Lainnya (Cuti, Drop Out, Keluar/Mengundurkan Diri, Transfer)
  let gradYear = Number(student.tahun_lulus);
  if (isNaN(gradYear) || gradYear <= 0) {
    const nim = String(student.nim || '').trim();
    if (graduateYearMap.has(nim)) {
      gradYear = graduateYearMap.get(nim);
    }
  }

  if (!isNaN(gradYear) && gradYear >= startYear) {
    const sem = (gradYear - startYear) * 2;
    return sem < 1 ? 1 : sem;
  }

  // Ekstrak tahun dari field periode untuk membekukan semester di titik berhenti
  const parsedPeriode = parseEntryPeriod(student.periode, startYear);
  const frozenYear = parsedPeriode.entryYear;
  const frozenTerm = parsedPeriode.entryTerm;

  const sem = (frozenYear - startYear) * 2 + (frozenTerm - 1) + 1;
  return sem < 1 ? 1 : sem;
};

/**
 * Fungsi utama untuk memperkaya dataset mahasiswa (Enrichment Pipeline):
 * 1. Menghitung `semester` menggunakan `calculatePreciseSemester` (berbasis `angkatan` dan `tahun_lulus`).
 * 2. Mengidentifikasi jenjang `S1` atau `S2`.
 * 3. Menegakkan aturan batas masa studi (S1 > 14, S2 > 8) HANYA untuk mahasiswa yang berstatus 'Aktif'.
 *    Mahasiswa yang sudah 'Lulus' dipertahankan statusnya.
 *
 * @param {Array<Object>} rawStudentsData - Array dataset mentah data mahasiswa
 * @param {string} [currentPeriod=CURRENT_PERIOD] - Periode acuan sistem saat ini
 * @returns {Array<Object>} Array dataset mahasiswa baru yang telah diperkaya
 */
export const enrichStudentData = (rawStudentsData = [], currentPeriod = CURRENT_PERIOD) => {
  if (!Array.isArray(rawStudentsData)) return [];

  const { entryYear: currentYear, entryTerm: currentTerm } = parseEntryPeriod(
    currentPeriod,
    CURRENT_YEAR
  );

  return rawStudentsData.map((student) => {
    // 1. Hitung semester berbasis angkatan dan tahun_lulus
    const calculatedSemester = calculatePreciseSemester(student, currentYear, currentTerm);

    // 2. Tentukan jenjang studi
    const jenjang = inferDegreeLevel(student);

    // 3. Penegakan aturan batas maksimal masa studi (HANYA untuk mahasiswa yang masih 'Aktif')
    const maxLimit = getMaxSemesterLimit(jenjang);
    const rawStatus = String(student.status_keaktifan || '').trim();
    const isAktif = rawStatus.toLowerCase() === 'aktif';

    let updatedStatus = rawStatus;
    if (isAktif && calculatedSemester > maxLimit) {
      updatedStatus = 'Drop Out';
    }

    return {
      ...student,
      jenjang,
      semester: calculatedSemester,
      status_keaktifan: updatedStatus,
    };
  });
};

export default enrichStudentData;
