import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildGraduateFilter } = require('../../../src/services/graduates/filterBuilder');

describe('graduate filter builder', () => {
  it('turns repeated faculty and jenjang query values into Prisma in filters', () => {
    const where = buildGraduateFilter({
      fakultas: ['FIK', 'FEB'],
      jenjang: ['S1', 'S2'],
      programStudi: ['Informatika', 'Akuntansi'],
    });

    expect(where.jenjang).toEqual({ in: ['S1', 'S2'] });
    expect(where.student).toEqual({
      fakultas: { in: ['FIK', 'FEB'] },
      programStudi: { in: ['Informatika', 'Akuntansi'] },
    });
  });
});
