/**
 * Menghitung total mahasiswa aktif dari data mahasiswa.
 * 
 * @param {Array<Object>} data - Data array mahasiswa dari KomatQAmit_DB_DataDump
 * @returns {number} Jumlah mahasiswa berstatus aktif
 */
export const calculateActiveStudents = (data) => {
  if (!Array.isArray(data)) return 0;
  return data.filter((m) => String(m.status_keaktifan || '').toLowerCase() === 'aktif').length;
};
