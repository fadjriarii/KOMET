/**
 * Posisi satu batang dalam kelompok kategori: batang bernilai 0 tidak memakai
 * slot, lalu batang yang tersisa dirapatkan dan ditengahkan dalam lebar
 * kelompok asli. `barGap` chart harus 0 agar jarak antar-slot sama dengan `width`.
 */
export function compactBarLayout({ bars, payload, dataKey, x, width }) {
  if (!(Number(payload?.[dataKey]) > 0)) return null;

  const visible = bars.filter((bar) => Number(payload?.[bar.dataKey]) > 0);
  const index = bars.findIndex((bar) => bar.dataKey === dataKey);
  const compactIndex = visible.findIndex((bar) => bar.dataKey === dataKey);
  if (index < 0 || compactIndex < 0) return null;

  const offset = ((bars.length - visible.length) * width) / 2;
  const inset = width >= 4 ? 1 : 0;

  return {
    x: x - (index - compactIndex) * width + offset + inset,
    width: Math.max(0, width - inset * 2),
  };
}
