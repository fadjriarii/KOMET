/**
 * Menghitung jumlah filter aktif pada form MbkmFilterContainer.
 * Kartu mana yang ikut mempersempit angka bukan urusan file ini: server mengirim
 * `kpiFilterScope` pada respons summary.
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
