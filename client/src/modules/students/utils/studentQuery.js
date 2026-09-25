export function getStudentActiveFilterCount(values = {}) {
  return [values.search, values.faculty?.length, values.prodi?.length, values.jenjang?.length, values.selectedYears?.length, values.semester?.length, values.nationality, Array.isArray(values.status) ? values.status.join() !== 'Aktif' : values.status !== 'Aktif', values.periode].filter(Boolean).length;
}
export function toggleAngkatanYear(selected = [], year) { const value = String(year); return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]; }
export function getAngkatanDisplayText(selected = [], placeholder = 'Pilih Tahun') { return selected.length ? selected.join(', ') : placeholder; }
