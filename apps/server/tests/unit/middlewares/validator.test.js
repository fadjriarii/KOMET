import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  studentQuerySchema,
  graduateQuerySchema,
  mbkmQuerySchema,
  validateQuery,
} = require('../../../src/middlewares/validator');

describe('student query validation', () => {
  it('rejects invalid pagination and accepts combined filters', () => {
    expect(studentQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    const result = studentQuerySchema.safeParse({
      page: '2',
      limit: '50',
      fakultas: ['FIK', 'FEB'],
      semester: ['1', '2'],
      cursor: 'nim-1',
    });
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
    expect(
      studentQuerySchema.safeParse({
        kewarganegaraan: 'Unknown',
        periodeMasuk: 'Musim Panas',
        periode: 'invalid',
        selectedPeriode: '2025',
      }).success,
    ).toBe(false);
    expect(
      studentQuerySchema.safeParse({
        kewarganegaraan: 'WNA',
        periodeMasuk: 'Genap',
        periode: '2025/2026',
        selectedPeriode: '2025/2026',
      }).success,
    ).toBe(true);
  });

  it('bounds graduate and MBKM filter fields to their accepted formats', () => {
    expect(
      graduateQuerySchema.safeParse({ periodeMasuk: '20251', jenjang: ['S1', 'S2'] }).success,
    ).toBe(true);
    expect(graduateQuerySchema.safeParse({ periodeMasuk: '2025/2026' }).success).toBe(false);
    expect(mbkmQuerySchema.safeParse({ periode: '20252', topN: '10' }).success).toBe(true);
    expect(mbkmQuerySchema.safeParse({ periode: '2025/2026', topN: '-1' }).success).toBe(false);
  });
});

describe('batas parameter & bentuk respons validasi', () => {
  function fakeRes() {
    const res = { statusCode: 0, body: undefined };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.body = body;
      return res;
    };
    return res;
  }

  it('menolak halaman yang menghasilkan OFFSET jutaan baris', () => {
    expect(studentQuerySchema.safeParse({ page: '1001' }).success).toBe(false);
    expect(studentQuerySchema.safeParse({ page: '1000' }).success).toBe(true);
  });

  it('membatasi topN di schema, bukan clamp per controller', () => {
    expect(mbkmQuerySchema.safeParse({ topN: '101' }).success).toBe(false);
    expect(mbkmQuerySchema.safeParse({ topN: '20' }).success).toBe(true);
    // Nilai yang lolos berubah menjadi number, sehingga handler tidak clamp ulang.
    expect(mbkmQuerySchema.parse({ topN: '20' }).topN).toBe(20);
  });

  it('menolak search bertipe array', () => {
    expect(studentQuerySchema.safeParse({ search: ['a', 'b'] }).success).toBe(false);
  });

  it('menolak nama parameter bracket (fakultas[], fakultas[0])', () => {
    for (const query of [{ 'fakultas[]': ['FIK'] }, { 'fakultas[0]': 'FIK' }]) {
      const res = fakeRes();
      const next = vi.fn();
      validateQuery(studentQuerySchema)({ query }, res, next);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('INVALID_PARAMETER_NAME');
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('tidak membocorkan pesan Zod internals, hanya nama field', () => {
    const res = fakeRes();
    validateQuery(studentQuerySchema)(
      { query: { page: '0', semester: 'x'.repeat(200) } },
      res,
      vi.fn(),
    );

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Query parameter tidak valid.');
    expect(res.body.fields).toEqual(['page', 'semester']);
    expect(JSON.stringify(res.body)).not.toMatch(/Expected|received|Invalid input/);
  });
});
