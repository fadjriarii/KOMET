/**
 * Menghitung jumlah filter aktif pada form GraduateFilterContainer.
 * Scope tiap kartu tidak dihitung di sini lagi — server yang mendaftar param mana
 * yang dibacanya lewat `kpiFilterScope`.
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
