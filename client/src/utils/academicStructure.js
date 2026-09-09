/**
 * Peta relasi Program Studi ke Fakultas di lingkungan i3L (Indonesia International Institute for Life Sciences).
 * Digunakan untuk menormalkan data dump di mana field 'fakultas' sebelumnya terduplikasi dari 'program_studi'.
 */
export const PRODI_TO_FACULTY_MAP = {
  // School of Life Sciences
  'Bio Informatika': 'School of Life Sciences',
  'Bio Medis dan Rekayasa Hayati': 'School of Life Sciences',
  'Bio Teknologi': 'School of Life Sciences',
  'Pangan dan Nutrisi': 'School of Life Sciences',
  'Teknologi Pangan': 'School of Life Sciences',

  // School of Pharmacy
  'Farmasi': 'School of Pharmacy',
  'Pendidikan Profesi Apoteker': 'School of Pharmacy',

  // School of Business & Management
  'Innovation & Entrepreneurship': 'School of Business & Management',
  'Magister Bio Manajemen': 'School of Business & Management',
  'Manajemen Bisnis Internasional': 'School of Business & Management',
};

/**
 * Daftar Fakultas resmi di institusi
 */
export const FACULTIES = [
  'School of Life Sciences',
  'School of Pharmacy',
  'School of Business & Management',
];

/**
 * Helper untuk mendapatkan nama Fakultas dari Program Studi.
 * Jika tidak ditemukan di pemetaan khusus, mengembalikan nilai fakultas bawaan atau 'Other'.
 *
 * @param {string} prodi - Nama program studi
 * @param {string} [defaultFaculty] - Nilai fakultas cadangan
 * @returns {string} Nama Fakultas yang dinormalisasi
 */
export const getFacultyByProdi = (prodi, defaultFaculty = '') => {
  if (!prodi) return defaultFaculty || '-';
  return PRODI_TO_FACULTY_MAP[prodi] || defaultFaculty || prodi;
};
