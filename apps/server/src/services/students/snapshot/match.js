/**
 * Penilai kondisi Prisma skala kecil untuk SATU baris mahasiswa. Operator yang
 * belum dikenali melempar error — diam-diam mengembalikan `true`/`false` akan
 * membuat kondisi baru terlihat cocok padahal tidak.
 */
function matchesFieldValue(value, rule) {
  const actual = String(value ?? '');
  if (rule === null || typeof rule === 'string' || typeof rule === 'number') {
    return actual === String(rule);
  }
  return Object.entries(rule).every(([operator, operand]) => {
    switch (operator) {
      case 'equals':
        return actual === String(operand);
      // Perbandingan string murni seperti MariaDB; nilai kosong sengaja TIDAK
      // dikecualikan di sini — kondisi yang butuh "harus terisi" menyatakan
      // `{ not: '' }` sendiri, sama seperti di SQL.
      case 'lt':
        return actual < String(operand);
      case 'lte':
        return actual <= String(operand);
      case 'gt':
        return actual > String(operand);
      case 'gte':
        return actual >= String(operand);
      case 'not':
        return actual !== String(operand);
      case 'in':
        return operand.map(String).includes(actual);
      case 'notIn':
        return !operand.map(String).includes(actual);
      case 'endsWith':
        return actual.endsWith(String(operand));
      case 'startsWith':
        return actual.startsWith(String(operand));
      default:
        throw new Error(`matchesFieldValue: operator "${operator}" belum didukung`);
    }
  });
}

function matchesStudentCondition(row = {}, condition = {}) {
  return Object.entries(condition).every(([key, rule]) => {
    if (key === 'AND') return rule.every((nested) => matchesStudentCondition(row, nested));
    if (key === 'OR') return rule.some((nested) => matchesStudentCondition(row, nested));
    if (key === 'NOT') return !matchesStudentCondition(row, rule);
    return matchesFieldValue(row[key], rule);
  });
}

module.exports = { matchesFieldValue, matchesStudentCondition };
