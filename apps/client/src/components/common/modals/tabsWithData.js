/**
 * Tab rincian yang layak tampil: tab dengan daftar kategori (`itemsByTab[key]`)
 * disembunyikan bila isinya ≤ 1 kategori berdata — satu batang tidak merinci
 * apa pun (mis. Per Prodi saat satu prodi dipilih). Tab tanpa entri di
 * `itemsByTab` (tren, tabel) selalu tampil. Selama data belum ada, semua tab
 * tampil supaya kerangka modal tidak melompat.
 */
export function tabsWithData(tabs, itemsByTab, { isLoading = false } = {}) {
  if (isLoading) return tabs;
  return tabs.filter((tab) => {
    if (!(tab.key in itemsByTab)) return true;
    const items = itemsByTab[tab.key] || [];
    return items.filter((item) => Number(item?.count ?? item?.value) > 0).length > 1;
  });
}
