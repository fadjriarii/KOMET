/**
 * Menghitung total lulusan dari data kelulusan.
 * Menghitung panjang array kelulusanData yang valid.
 * 
 * @param {Array<Object>} data - Data array kelulusan dari KomatQAmit_DB_DataDump
 * @returns {number} Jumlah total lulusan
 */
export const calculateTotalGraduates = (data) => {
  if (!Array.isArray(data)) return 0;
  return data.length;
};
