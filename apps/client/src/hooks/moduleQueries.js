import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PAGE_PARAM } from './useDashboardFilters';
import { DASHBOARD_STALE_TIME_MS } from '../constants/cachePolicy';
import { DEFAULT_PAGE, TABLE_LIMIT } from '@komet/shared/constants';

/**
 * Satu bentuk query key untuk semua modul: `[namespace, kind, ...pembeda]`.
 * Prefix `[namespace]` adalah yang di-invalidate `useSyncJob` setelah sync, jadi
 * bentuknya tidak boleh berubah diam-diam di satu tempat saja.
 */
export function queryKey(namespace, kind, ...parts) {
  return [namespace, kind, ...parts];
}

/** Baris kosong bersama; array baru tiap render membatalkan memo tabel. */
const NO_ROWS = [];

// Query di sini sengaja tidak memasang `retry` lokal: default di `main.jsx`
// mengulang hanya error yang layak diulang (`isRetryableError`), dan satu angka
// `retry: n` di sini akan mengganti kebijakan itu diam-diam.

/** Halaman aktif dibaca dari URL; nilai acak atau < 1 jatuh ke halaman pertama. */
function readPage(searchParams) {
  const raw = Number(searchParams.get(PAGE_PARAM));
  return Number.isInteger(raw) && raw > DEFAULT_PAGE ? raw : DEFAULT_PAGE;
}

function useModuleSummary({ namespace, service, queryParams, enabled }) {
  const queryString = useMemo(() => service.toQueryString(queryParams), [service, queryParams]);
  const query = useQuery({
    queryKey: queryKey(namespace, 'summary', queryString),
    queryFn: ({ signal }) => service.getSummary(queryParams, { signal }),
    enabled,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  return { ...query, error: query.error?.message || null };
}

/**
 * Server-side pagination whose current page lives in the URL (`?page=`), so a
 * page is deep-linkable and follows Back/Forward like the filters beside it.
 * `useDashboardFilters` drops `page` whenever a filter changes, which is why no
 * local "reset on filter change" bookkeeping is needed here.
 */
function useModuleList({ namespace, service, queryParams, limit = TABLE_LIMIT }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterKey = useMemo(() => service.toQueryString(queryParams), [service, queryParams]);
  const page = readPage(searchParams);

  const setPage = useCallback(
    (nextPage) =>
      setSearchParams(
        (previous) => {
          const current = readPage(previous);
          const requested = typeof nextPage === 'function' ? nextPage(current) : nextPage;
          const resolved = Math.max(DEFAULT_PAGE, Math.trunc(Number(requested)) || DEFAULT_PAGE);
          const params = new URLSearchParams(previous);
          if (resolved === DEFAULT_PAGE) params.delete(PAGE_PARAM);
          else params.set(PAGE_PARAM, String(resolved));
          return params;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const query = useQuery({
    queryKey: queryKey(namespace, 'list', filterKey, page, limit),
    queryFn: ({ signal }) => service.getList({ filters: queryParams, page, limit }, { signal }),
    // Penanda eksplisit, bukan posisi indeks di queryKey: baris lama tetap dipakai
    // selama filter-nya sama, supaya tabel tidak berkedip saat pindah halaman.
    meta: { filterKey },
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.meta?.filterKey === filterKey ? previousData : undefined,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  const fallbackPagination = useMemo(
    // Identitas stabil selama limit tidak berubah: DataTable dimemo dan tidak boleh
    // kehilangan memo hanya karena objek cadangan baru tiap render.
    () => ({ page: DEFAULT_PAGE, limit, total: 0, totalPages: 1 }),
    [limit],
  );

  return {
    rows: Array.isArray(query.data?.data) ? query.data.data : NO_ROWS,
    pagination: query.data?.pagination || fallbackPagination,
    setPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}

/**
 * Rincian sebuah kartu: dimuat dari endpoint detailnya, kecuali summary sudah
 * mengirim bentuk yang identik (maka tidak ada request kedua).
 */
function useModuleDetail({
  namespace,
  service,
  isOpen,
  resourceKey,
  method,
  filters,
  errorMessage,
  summaryData,
  summaryKey,
}) {
  const filterKey = useMemo(() => service.toQueryString(filters), [service, filters]);
  // Bentuknya sengaja identik dengan payload endpoint detail, jadi pemakai membaca
  // satu bentuk saja (`data.trend`, bukan `data.data.trend`).
  const summaryResource = summaryKey ? summaryData?.summary?.[summaryKey] : undefined;
  const query = useQuery({
    queryKey: queryKey(namespace, 'detail', resourceKey, filterKey),
    queryFn: ({ signal }) => service[method](filters, { signal }),
    enabled: Boolean(isOpen && resourceKey && method && summaryResource === undefined),
    staleTime: DASHBOARD_STALE_TIME_MS,
  });
  // `errorMessage` is a fallback *only* when React Query actually failed.
  // Returning it unconditionally made every lazy detail chart appear failed
  // even after a successful HTTP 200 response.
  const error = query.isError
    ? query.error?.message || errorMessage || 'Gagal memuat rincian data.'
    : null;

  return {
    data: query.data?.data ?? summaryResource ?? null,
    isLoading: query.isLoading,
    error,
  };
}

/**
 * Mengikat namespace + service sebuah modul menjadi tiga hook datanya, supaya
 * satu modul tidak perlu menyalin pembungkus `useXSummary`/`useXList`/
 * `useXDetailResource` yang hanya berbeda nama.
 */
export function createModuleQueries({ namespace, service, summaryEnabled }) {
  function useSummary(queryParams) {
    return useModuleSummary({
      namespace,
      service,
      queryParams,
      enabled: summaryEnabled ? summaryEnabled(queryParams) : true,
    });
  }

  function useList(queryParams, { limit } = {}) {
    return useModuleList({ namespace, service, queryParams, limit });
  }

  function useDetail(args) {
    return useModuleDetail({ namespace, service, ...args });
  }

  return { useSummary, useList, useDetail };
}
