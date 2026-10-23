import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { clearSummaryCaches, getOrLoad } = require('../../../src/services/summaryCache');

describe('cache ringkasan', () => {
  it('menggabungkan pemuat bersamaan dan memakai hasil cache', async () => {
    clearSummaryCaches();
    const load = vi.fn(async () => ({ total: 3 }));

    const [first, second] = await Promise.all([
      getOrLoad('test', { tahunAjaran: '2025/2026', fakultas: ['B', 'A'] }, load),
      getOrLoad('test', { fakultas: ['A', 'B'], tahunAjaran: '2025/2026' }, load),
    ]);

    expect(first).toEqual({ total: 3 });
    expect(second).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);

    await expect(
      getOrLoad('test', { tahunAjaran: '2025/2026', fakultas: ['A', 'B'] }, load),
    ).resolves.toBe(first);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('membedakan query dan membuang cache setelah dibersihkan', async () => {
    clearSummaryCaches();
    const load = vi.fn(async (value) => ({ value }));

    await getOrLoad('test', { tahunLulus: '2024/2025' }, () => load('lama'));
    await getOrLoad('test', { tahunLulus: '2025/2026' }, () => load('baru'));
    expect(load).toHaveBeenCalledTimes(2);

    clearSummaryCaches();
    await getOrLoad('test', { tahunLulus: '2024/2025' }, () => load('lama'));
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('tidak menyimpan kegagalan', async () => {
    clearSummaryCaches();
    const load = vi.fn().mockRejectedValueOnce(new Error('gagal')).mockResolvedValue({ ok: true });

    await expect(getOrLoad('test', {}, load)).rejects.toThrow('gagal');
    await expect(getOrLoad('test', {}, load)).resolves.toEqual({ ok: true });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
