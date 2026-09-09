/**
 * Mengelompokkan data kelulusan per program studi dan menghitung rata-rata IPK.
 * Membersihkan suffix "(Akun Lama)" agar program studi tergabung secara rapi.
 * 
 * @param {Array<Object>} data - Data array kelulusan dari KomatQAmit_DB_DataDump
 * @returns {Array<{ program: string, gpa: string, gpaValue: number, count: number }>}
 *   Array hasil pengelompokan yang diurutkan menurun berdasarkan rata-rata IPK
 */
export const groupGpaByProgramStudi = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const map = new Map();

  for (const student of data) {
    if (typeof student.ipk !== 'number' || Number.isNaN(student.ipk) || student.ipk <= 0) {
      continue;
    }

    const program = String(student.program_studi || 'Unknown')
      .replace(/\s*\(Akun Lama\)\s*$/i, '')
      .trim();

    const current = map.get(program) || { total: 0, count: 0 };
    current.total += student.ipk;
    current.count += 1;
    map.set(program, current);
  }

  return Array.from(map.entries())
    .map(([program, { total, count }]) => {
      const gpaValue = total / count;
      return {
        program,
        gpa: gpaValue.toFixed(2),
        gpaValue: Number(gpaValue.toFixed(2)),
        count,
      };
    })
    .sort((a, b) => b.gpaValue - a.gpaValue);
};
