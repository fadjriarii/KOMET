import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const controller = require('../../../src/controllers/studentsController');

describe('students controller contract', () => {
  it('returns an empty-result and cursor pagination contract', async () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const req = {
      query: { cursor: 'nim-1' },
      studentDataServices: {
        buildStudentFilter: vi.fn(() => ({ statusKeaktifan: 'Aktif' })),
        getPaginationParams: vi.fn(() => ({ page: 1, limit: 10 })),
        getStudentList: vi.fn(async () => ({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          nextCursor: null,
          hasNextPage: false,
        })),
      },
    };

    await controller.getStudents(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [],
      nextCursor: null,
      hasNextPage: false,
    }));
  });
});
