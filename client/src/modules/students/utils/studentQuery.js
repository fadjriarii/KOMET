/**
 * Menghitung jumlah filter aktif pada form StudentFilterContainer.
 *
 * Filter yang dihitung adalah filter spesifik kontainer mahasiswa:
 * - Search query
 * - Fakultas
 * - Program Studi
 * - Jenjang
 * - Angkatan (tahun rolling)
 * - Semester
 * - Kewarganegaraan
 * - Status Keaktifan (jika selain default 'Aktif')
 * - Periode Masuk (Ganjil/Genap)
 */
export function getStudentActiveFilterCount(values = {}) {
  return [
    values.search,
    values.faculty?.length,
    values.prodi?.length,
    values.jenjang?.length,
    values.selectedYears?.length,
    values.semester?.length,
    values.nationality,
    Array.isArray(values.status) ? values.status.join() !== 'Aktif' : values.status !== 'Aktif',
    values.periode,
  ].filter(Boolean).length;
}

/**
 * Menentukan KPI yang benar-benar dipengaruhi oleh filter aktif.
 * Tren intake dan penurunan selalu menghitung riwayat penerimaan, sehingga
 * keduanya sengaja tidak memakai status keaktifan saat ini.
 */
export function getStudentKpiFilterScope(values = {}) {
  const hasStatusFilter = Array.isArray(values.status)
    ? values.status.join() !== 'Aktif'
    : Boolean(values.status && values.status !== 'Aktif');
  const hasNonStatusFilter = Boolean(
    values.search
    || values.faculty?.length
    || values.prodi?.length
    || values.jenjang?.length
    || values.selectedYears?.length
    || values.semester?.length
    || values.nationality
    || values.periode
  );
  const affectsPopulation = hasStatusFilter || hasNonStatusFilter;

  return {
    active: affectsPopulation,
    foreign: affectsPopulation,
    intake: hasNonStatusFilter,
    decline: hasNonStatusFilter,
  };
}

export function toggleAngkatanYear(selected = [], year) {
  const value = String(year);
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

export function getAngkatanDisplayText(selected = [], placeholder = 'Pilih Tahun') {
  return selected.length ? selected.join(', ') : placeholder;
}
