/**
 * Gaya badge MBKM dari data server, bukan tebakan kata kunci. Status memakai
 * `statusCategory` (aturan di `services/mbkm/statusRules.js`); jenis memakai
 * urutan opsi `jenisAktivitas` dari server, jadi jenis baru tetap mendapat warna.
 */
export const BADGE_BY_CATEGORY = {
  participating: 'success',
  pending: 'warning',
  rejected: 'danger',
  cancelled: 'default',
};

export const badgeVariantForCategory = (category) => BADGE_BY_CATEGORY[category] ?? 'default';

const JENIS_VARIANTS = ['primary', 'success', 'warning', 'default'];

export function badgeVariantForJenis(jenis, order = []) {
  const index = order.indexOf(jenis);
  return index < 0 ? 'default' : JENIS_VARIANTS[index % JENIS_VARIANTS.length];
}
