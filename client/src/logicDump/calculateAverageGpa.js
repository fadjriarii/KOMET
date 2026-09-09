/**
 * Menghitung rata-rata IPK dari data kelulusan.
 * Mengabaikan record yang tidak memiliki nilai IPK valid (numerik).
 * Mendukung filter opsional berdasarkan jenjang ("S1" / "S2").
 * 
 * @param {Array<Object>} data - Data array kelulusan dari KomatQAmit_DB_DataDump
 * @param {string} [jenjang] - Filter jenjang opsional (contoh: 'S1', 'S2')
 * @returns {string} Rata-rata IPK dalam format 2 angka desimal (string)
 */
export const calculateAverageGpa = (data, jenjang) => {
  if (!Array.isArray(data) || data.length === 0) return '0.00';

  const scoped = jenjang
    ? data.filter((student) => student.jenjang === jenjang)
    : data;

  const validData = scoped.filter(
    (student) => typeof student.ipk === 'number' && !Number.isNaN(student.ipk) && student.ipk > 0
  );

  if (validData.length === 0) return '0.00';

  const totalIpk = validData.reduce((sum, student) => sum + student.ipk, 0);
  const average = totalIpk / validData.length;

  return average.toFixed(2);
};
