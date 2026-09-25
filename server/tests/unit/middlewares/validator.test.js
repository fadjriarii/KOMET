import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { studentQuerySchema, validateQuery } = require('../../../src/middlewares/validator');

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
});
