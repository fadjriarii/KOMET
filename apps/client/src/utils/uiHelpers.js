/**
 * Helper presentasi murni (label, tinggi chart, paginasi). Angka dan tahun
 * akademik TIDAK dihitung di sini — itu milik `@komet/shared`, supaya server
 * dan client tidak bisa berbeda hasil.
 *
 * File ini hanya barrel: implementasi tinggal di modul fokusnya masing-masing.
 */
export * from './pagination';
export * from './studentText';

export function reverseTrendData(items = []) {
  return Array.isArray(items) ? [...items].reverse() : [];
}
export function getTooltipPayloadItem(payload = []) {
  return payload?.[0]?.payload || null;
}
export function getDistributionChartHeight(count = 0) {
  return Math.max(240, Number(count || 0) * 38);
}
export function formatKpiDisplay(value) {
  return value === '-' || value === null || value === undefined || value === '' ? null : value;
}
export function getModalOriginRectFromEvent(event) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  return rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null;
}
