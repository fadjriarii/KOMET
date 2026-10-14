/**
 * @komet/shared — Aturan tahun akademik untuk kedua app.
 *
 * Satu implementasi saja: server memakainya untuk memotong jendela tren,
 * client untuk label filter. `ACADEMIC_YEAR_ROLLOVER_MONTH` adalah satu-satunya
 * tempat bulan rollover disebut — salinan kedua di `apps/*` akan membuat
 * jendela tren server dan label filter client bisa berbeda bulan.
 */

import { ACADEMIC_YEAR_ROLLOVER_MONTH } from './constants.js';

const ACADEMIC_YEAR_PATTERN = /^(\d{4})\/\d{4}$/;

/** Tahun awal (YYYY) tahun akademik yang sedang berjalan. */
export function getCurrentAcademicYearStart(date = new Date()) {
  const value = new Date(date);
  const month = value.getMonth() + 1;
  return month >= ACADEMIC_YEAR_ROLLOVER_MONTH ? value.getFullYear() : value.getFullYear() - 1;
}

/** Label tahun akademik berjalan, mis. `2025/2026`. */
export function getCurrentAcademicYear(date = new Date()) {
  const start = getCurrentAcademicYearStart(date);
  return `${start}/${start + 1}`;
}

/** Tahun awal dari label `YYYY/YYYY`; bentuk lain → `null`. */
export function parseAcademicYear(label) {
  const match = ACADEMIC_YEAR_PATTERN.exec(String(label ?? ''));
  return match ? Number(match[1]) : null;
}

/**
 * Label tahun ajaran dari tahun mulai, mis. `2025` → `"2025/2026"`.
 * Satu-satunya pembentuk label: sync writers dan derive opsi filter memakainya,
 * tidak ada yang merangkai string manual di tempat lain.
 */
export function formatAcademicYearLabel(startYear) {
  const start = Number(startYear);
  if (!Number.isInteger(start) || start < 1900) return null;
  return `${start}/${start + 1}`;
}

/**
 * Cek label tahun akademik: bentuk `YYYY/YYYY` dan tahun kedua benar-benar
 * mengikuti tahun pertama. Nilai kosong dianggap "tidak diisi" (valid), karena
 * pemeriksaan ini dipakai untuk menerima input dari URL, bukan mewajibkan isi.
 */
export function isValidAcademicYear(value) {
  if (!value) return true;
  const start = parseAcademicYear(value);
  return start !== null && Number(String(value).slice(5)) === start + 1;
}

/** Jendela `size` tahun akademik yang berakhir di `startYear`, urut menaik. */
export function getAcademicYearWindow(startYear, size = 5) {
  return Array.from({ length: size }, (_, index) => {
    const start = startYear - (size - 1 - index);
    return `${start}/${start + 1}`;
  });
}

/**
 * Tahun awal tahun akademik pertama kampus beroperasi (`2014/2015`).
 * Visualisasi tren tidak pernah menampilkan tahun sebelum ini — satu angka
 * agar semua chart student data memotong jendelanya di titik yang sama.
 */
export const MIN_ACADEMIC_YEAR_START = 2014;

/**
 * Seperti `getAcademicYearWindow`, tapi awal jendela dijepit di
 * `minStartYear` (default tahun berdiri kampus). Mis. jangkar `2016` dengan
 * `size` 5 menghasilkan 3 titik (`2014/2015`–`2016/2017`), bukan 5 titik
 * berisi tahun-tahun kosong sebelum kampus ada. Dijamin minimal 1 titik
 * (tahun jangkarnya sendiri) walau jangkarnya lebih tua dari batas.
 */
export function getBoundedAcademicYearWindow(
  startYear,
  size = 5,
  minStartYear = MIN_ACADEMIC_YEAR_START,
) {
  const first = Math.min(Math.max(startYear - (size - 1), minStartYear), startYear);
  const out = [];
  for (let start = first; start <= startYear; start++) out.push(`${start}/${start + 1}`);
  return out;
}

/** `count` tahun akademik terakhir yang berjalan dari `date`, urut menurun. */
export function getRollingAcademicYears(count = 5, date = new Date()) {
  return getAcademicYearWindow(getCurrentAcademicYearStart(date), count).reverse();
}
