/**
 * kpiLabels.js — peramu label filter untuk subtitle kartu KPI.
 * Murni tata bahasa (prefix, konjungsi "dan", ringkasan "Terpilih"); tidak
 * menghitung apa pun dari data. Satu-satunya sumber label fakultas/prodi/
 * jenjang/angkatan/semester agar tiap hook kartu tidak punya salinannya.
 */

const listFormatter = new Intl.ListFormat('id', { style: 'long', type: 'conjunction' });

const cleanStrings = (values) =>
  (Array.isArray(values) ? values : [values]).filter(
    (item) => typeof item === 'string' && item.trim() !== '',
  );

/**
 * Daftar ber-prefix: "Prodi A dan B", >maxListed menjadi "Prodi Terpilih".
 * `smartPrefix` untuk fakultas yang nilainya kadang sudah berprefix.
 */
export function formatPrefixedList(
  values = [],
  prefix,
  { maxListed = 3, smartPrefix = false } = {},
) {
  const list = cleanStrings(values);
  if (!list.length) return '';
  if (list.length > maxListed) return `${prefix}Terpilih`;
  const joined = listFormatter.format(list);
  if (smartPrefix && joined.startsWith(prefix)) return joined;
  return `${prefix}${joined}`;
}

export const formatFacultyLabel = (values = []) =>
  formatPrefixedList(values, 'Fakultas ', { smartPrefix: true });

export const formatProdiLabel = (values = []) => formatPrefixedList(values, 'Prodi ');

export const formatJenjangLabel = (values = []) => formatPrefixedList(values, 'Jenjang ');

export function formatAngkatanLabel(years = []) {
  const list = cleanStrings(years);
  if (!list.length) return '';
  if (list.length > 1) return 'Angkatan Terpilih';
  return `Angkatan ${list[0]}`;
}

export function formatSemesterLabel(semesters = []) {
  const list = (Array.isArray(semesters) ? semesters : [semesters]).filter(
    (item) => item !== '' && item !== null && item !== undefined,
  );
  if (!list.length) return '';
  if (list.length > 1) return 'Semester Terpilih';
  return `Semester ${list[0]}`;
}

export const joinLabels = (...parts) => parts.filter(Boolean).join(', ');

/**
 * Tiga gabungan yang dipakai kartu (tiap formatter dipanggil sekali):
 * - demographic: fakultas, prodi, jenjang, angkatan, semester (Active & Foreign)
 * - decline: tanpa semester (card Decline kebal semester)
 * - location: fakultas, prodi, jenjang saja (basis label intake)
 */
export function buildFilterLabels(filterValues = {}) {
  const location = joinLabels(
    formatFacultyLabel(filterValues.selectedFaculty),
    formatProdiLabel(filterValues.selectedProdi),
    formatJenjangLabel(filterValues.selectedJenjang),
  );
  const angkatan = formatAngkatanLabel(filterValues.selectedYears);
  const semester = formatSemesterLabel(filterValues.selectedSemester);
  return {
    location,
    angkatan,
    semester,
    demographic: joinLabels(location, angkatan, semester),
    decline: joinLabels(location, angkatan),
  };
}
