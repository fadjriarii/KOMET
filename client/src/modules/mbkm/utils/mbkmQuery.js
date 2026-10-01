/**
 * Menghitung jumlah filter aktif pada form MbkmFilterContainer.
 */
export function getMbkmActiveFilterCount(values = {}) {
  return [
    values.search,
    values.faculty?.length,
    values.prodi?.length,
    values.jenjang?.length,
    values.angkatan?.length,
    values.statusAktivitas?.length,
    values.periode,
  ].filter(Boolean).length;
}

/**
 * Menentukan KPI mana yang dipengaruhi oleh filter aktif.
 */
export function getMbkmKpiFilterScope(values = {}) {
  const hasFilter = Boolean(
    values.search ||
    values.faculty?.length ||
    values.prodi?.length ||
    values.jenjang?.length ||
    values.angkatan?.length ||
    values.statusAktivitas?.length ||
    values.periode
  );

  return {
    rate: hasFilter,
    participants: hasFilter,
    eligible: hasFilter,
    mitra: hasFilter,
  };
}

export function toggleYear(selected = [], year) {
  const value = String(year);
  return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];
}

export function getYearDisplayText(selected = [], placeholder = 'Pilih Tahun') {
  return selected.length ? selected.join(', ') : placeholder;
}
