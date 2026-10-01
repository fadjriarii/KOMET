/**
 * Menghitung jumlah filter aktif pada form GraduateFilterContainer.
 */
export function getGraduateActiveFilterCount(values = {}) {
  return [
    values.search,
    values.faculty?.length,
    values.prodi?.length,
    values.jenjang?.length,
    values.tahunLulus?.length,
    values.periodeWisuda?.length,
    values.statusKelulusan?.length,
    values.periodeMasuk,
  ].filter(Boolean).length;
}

/**
 * Menentukan KPI mana yang dipengaruhi oleh filter aktif.
 */
export function getGraduateKpiFilterScope(values = {}) {
  const hasFilter = Boolean(
    values.search ||
    values.faculty?.length ||
    values.prodi?.length ||
    values.jenjang?.length ||
    values.tahunLulus?.length ||
    values.periodeWisuda?.length ||
    values.statusKelulusan?.length ||
    values.periodeMasuk
  );

  return {
    total: hasFilter,
    gpa: hasFilter,
    onTime: hasFilter,
    studySuccess: hasFilter,
  };
}

export function toggleYear(selected = [], year) {
  const value = String(year);
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

export function getYearDisplayText(selected = [], placeholder = 'Pilih Tahun') {
  return selected.length ? selected.join(', ') : placeholder;
}
