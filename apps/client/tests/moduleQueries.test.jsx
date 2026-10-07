import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import graduatesService from '../src/modules/graduates/services/graduatesService';
import { createModuleQueries, queryKey } from '../src/hooks/moduleQueries';
import { calls, resetApi, respondWith } from './apiMock';

vi.mock('../src/services/apiClient', () => import('./apiMock'));

const { useSummary, useList, useDetail } = createModuleQueries({
  namespace: 'graduates',
  service: graduatesService,
});

/** QueryClient harus bertahan antar-rerender, kalau tidak cache-nya tidak diuji. */
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const listRows = (url) => {
  const faculty = new URLSearchParams(url.split('?')[1] || '').get('fakultas');
  return {
    success: true,
    data: [{ nim: 'A1', nama: `Baris ${faculty}` }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };
};

beforeEach(() => {
  resetApi();
  respondWith((url) => (url.startsWith('/graduates/list') ? listRows(url) : { success: true }));
});

describe('queryKey', () => {
  it('berprefix namespace — yang di-invalidate selesai sync', () => {
    expect(queryKey('graduates', 'summary', '')).toEqual(['graduates', 'summary', '']);
  });
});

describe('useList', () => {
  it('tidak menempelkan baris filter lain saat filter berganti', async () => {
    const { result, rerender } = renderHook(({ filters }) => useList(filters), {
      wrapper: createWrapper(),
      initialProps: { filters: { faculty: ['FST'] } },
    });
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0].nama).toBe('Baris FST');

    rerender({ filters: { faculty: ['FHE'] } });
    // placeholderData hanya boleh dipakai bila filterKey-nya sama; baris FST di
    // halaman FHE adalah data yang salah, bukan data yang "masih dimuat".
    expect(result.current.rows).toHaveLength(0);
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0].nama).toBe('Baris FHE');
  });

  it('memakai objek pagination cadangan yang identitasnya stabil', () => {
    const { result, rerender } = renderHook(() => useList({}), { wrapper: createWrapper() });
    const before = result.current.pagination;
    rerender({});
    // Baru di-render, jadi data belum ada; objek cadangan yang baru tiap render
    // membatalkan memo DataTable.
    expect(result.current.pagination).toBe(before);
  });

  it('meneruskan pesan error sebagai string', async () => {
    respondWith((url) =>
      url.startsWith('/graduates/list')
        ? Promise.reject(new Error('Filter ditolak validator.'))
        : listRows(url),
    );
    const { result } = renderHook(() => useList({}), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.error).toBe('Filter ditolak validator.'));
  });
});

describe('useSummary', () => {
  it('meneruskan pesan error sebagai string, bukan objek', async () => {
    respondWith((url) =>
      url.startsWith('/graduates/summary')
        ? Promise.reject(new Error('Query terlalu berat untuk dieksekusi.'))
        : { success: true },
    );
    const { result } = renderHook(() => useSummary({}), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.error).toBe('Query terlalu berat untuk dieksekusi.'));
  });
});

describe('useDetail', () => {
  const base = {
    method: 'getIpkTrendDetail',
    resourceKey: 'ipkTrend',
    filters: {},
    errorMessage: 'Gagal memuat rincian IPK.',
  };

  it('tidak mengklaim gagal hanya karena errorMessage ada', () => {
    const { result } = renderHook(
      () => useDetail({ ...base, isOpen: false, summaryData: null, summaryKey: undefined }),
      { wrapper: createWrapper() },
    );
    // Rincian malas: belum dibuka = belum ada apa pun, termasuk kegagalan.
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('memakai bentuk yang sudah dikirim summary tanpa request kedua', () => {
    const summaryData = { summary: { ipkTrend: { trend: [1, 2] } } };
    const { result } = renderHook(
      () => useDetail({ ...base, isOpen: true, summaryData, summaryKey: 'ipkTrend' }),
      { wrapper: createWrapper() },
    );
    expect(result.current.data).toEqual({ trend: [1, 2] });
    expect(result.current.error).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('membuka endpoint detail dan melepas envelope `data`', async () => {
    respondWith((url) =>
      url.startsWith('/graduates/ipk-trend')
        ? { success: true, data: { trend: [3] } }
        : { success: true },
    );
    const { result } = renderHook(
      () => useDetail({ ...base, isOpen: true, summaryData: null, summaryKey: undefined }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.data).toEqual({ trend: [3] }));
    expect(calls.some((url) => url.startsWith('/graduates/ipk-trend'))).toBe(true);
  });
});
