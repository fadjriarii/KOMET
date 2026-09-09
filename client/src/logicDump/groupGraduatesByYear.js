/**
 * Mengelompokkan data kelulusan berdasarkan tahun_lulus.
 * Mengabaikan entri dengan tahun 0 atau nilai tidak valid.
 * 
 * @param {Array<Object>} data - Data array kelulusan dari KomatQAmit_DB_DataDump
 * @returns {Array<{ year: number, graduates: number }>} Array data tren kelulusan terurut tahun menaik
 */
export const groupGraduatesByYear = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const map = new Map();

  for (const student of data) {
    const year = Number(student.tahun_lulus);
    if (!Number.isFinite(year) || year <= 0) continue;

    map.set(year, (map.get(year) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([year, graduates]) => ({ year, graduates }))
    .sort((a, b) => a.year - b.year);
};
