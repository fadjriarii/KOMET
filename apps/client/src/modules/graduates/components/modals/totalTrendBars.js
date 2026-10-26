import { DIGITAL_BLUE } from '../../../../utils/theme';

// Warna bar per jenjang mengikuti urutan dari server (jenjangs); jenjang tambahan (Profesi,
// S3, …) memakai warna berikutnya dari palet yang sama.
export const JENJANG_COLORS = [
  DIGITAL_BLUE[600],
  DIGITAL_BLUE[400],
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
];

// Urutan warna kategori mengikuti urutan palet chart jenjang: biru, biru
// muda, hijau. Jadi seri pertama di semua chart memakai warna yang sama.
export const OUTCOME_COLORS = {
  onTime: JENJANG_COLORS[0],
  fast: JENJANG_COLORS[1],
  late: JENJANG_COLORS[2],
};

/**
 * Satu batang per jenjang dari daftar server (`jenjangs`: urutan + label +
 * `dataKey`), berdampingan dalam kelompok tahun ajaran. Warna mengikuti urutan.
 */
export function trendBars(jenjangs = [], namePrefix = 'Lulusan') {
  return jenjangs.map((entry, index) => ({
    dataKey: entry.dataKey,
    name: `${namePrefix} ${entry.label}`,
    color: JENJANG_COLORS[index % JENJANG_COLORS.length],
    labelKey: entry.dataKey,
    labelPosition: 'top',
  }));
}
