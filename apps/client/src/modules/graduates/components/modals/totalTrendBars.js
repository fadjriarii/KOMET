import { DIGITAL_BLUE } from '../../../../utils/theme';

// Warna bar per jenjang — S1/S2 tetap seperti semula, jenjang tambahan (Profesi,
// S3, …) memakai warna berikutnya dari palet yang sama.
export const JENJANG_COLORS = [
  DIGITAL_BLUE[600],
  DIGITAL_BLUE[400],
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
];

const JENJANG_LABEL = { s1: 'S1', s2: 'S2' };
export const jenjangName = (key) => JENJANG_LABEL[key] ?? key.toUpperCase();

/**
 * Satu batang per jenjang, berdampingan dalam kelompok tahun ajaran yang sama.
 * Kunci dinamis sehingga jenjang baru otomatis jadi batang berikutnya. S1 selalu
 * dulu, sisanya alfabetis. Label di atas batang, total di tooltip + tab Tabel.
 */
export function trendBars(rows) {
  const jenjangKeys = Object.keys(rows[0] ?? {})
    .filter((key) => key !== 'tahun' && key !== 'total' && key.endsWith('Count'))
    .filter((key) => rows.some((row) => Number(row?.[key]) > 0))
    .sort((a, b) => (a === 's1Count' ? -1 : b === 's1Count' ? 1 : a.localeCompare(b)));
  return jenjangKeys.map((key, index) => ({
    dataKey: key,
    name: `Lulusan ${jenjangName(key.replace(/Count$/, ''))}`,
    color: JENJANG_COLORS[index % JENJANG_COLORS.length],
    labelKey: key,
    labelPosition: 'top',
  }));
}
