import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/** Reuses a summary resource when present, otherwise lazily loads its detail. */
export function useDetailResource({
  namespace,
  service,
  isOpen,
  resourceKey,
  filters,
  fetcher,
  errorMessage,
  summaryData,
  summaryKey,
}) {
  const filterKey = useMemo(() => service.toQueryString(filters), [service, filters]);
  const summaryResource = summaryKey ? summaryData?.summary?.[summaryKey] : undefined;
  const hasSummaryData = Boolean(summaryData?.success && summaryResource !== undefined);
  const query = useQuery({
    queryKey: [namespace, 'detail', resourceKey, filterKey],
    queryFn: ({ signal }) => fetcher(signal),
    enabled: Boolean(isOpen && resourceKey && typeof fetcher === 'function' && !hasSummaryData),
    staleTime: 30_000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });

  if (hasSummaryData)
    return { data: { success: true, data: summaryResource }, isLoading: false, error: null };
  // `errorMessage` is a fallback *only* when React Query actually failed.
  // Returning it unconditionally made every lazy detail chart appear failed
  // even after a successful HTTP 200 response.
  const error = query.isError
    ? query.error?.message || errorMessage || 'Gagal memuat rincian data.'
    : null;

  return { data: query.data, isLoading: query.isLoading, error };
}
