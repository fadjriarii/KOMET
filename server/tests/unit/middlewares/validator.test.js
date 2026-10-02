import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { studentQuerySchema, graduateQuerySchema, mbkmQuerySchema, validateQuery } = require('../../../src/middlewares/validator');

describe('student query validation', () => {
  it('rejects invalid pagination and accepts combined filters', () => {
    expect(studentQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    const result = studentQuerySchema.safeParse({ page: '2', limit: '50', fakultas: ['FIK', 'FEB'], semester: ['1', '2'], cursor: 'nim-1' });
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(2);
    expect(result.data.limit).toBe(50);
  });

  it('writes the parsed query to the request', () => {
    const req = { query: { page: '3' } };
    const next = vi.fn();
    validateQuery(studentQuerySchema)(req, {}, next);
    expect(req.query.page).toBe(3);
    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid student filter values and accepts the UI filter contract', () => {
    expect(studentQuerySchema.safeParse({
      kewarganegaraan: 'Unknown',
      periodeMasuk: 'Musim Panas',
      periode: 'invalid',
      selectedPeriode: '2025',
    }).success).toBe(false);
    expect(studentQuerySchema.safeParse({
      kewarganegaraan: 'WNA',
      periodeMasuk: 'Genap',
      periode: '2025/2026',
      selectedPeriode: '2025/2026',
    }).success).toBe(true);
  });

  it('bounds graduate and MBKM filter fields to their accepted formats', () => {
    expect(graduateQuerySchema.safeParse({ periodeMasuk: '20251', jenjang: ['S1', 'S2'] }).success).toBe(true);
    expect(graduateQuerySchema.safeParse({ periodeMasuk: '2025/2026' }).success).toBe(false);
    expect(mbkmQuerySchema.safeParse({ periode: '20252', topN: '10' }).success).toBe(true);
    expect(mbkmQuerySchema.safeParse({ periode: '2025/2026', topN: '-1' }).success).toBe(false);
  });
});
