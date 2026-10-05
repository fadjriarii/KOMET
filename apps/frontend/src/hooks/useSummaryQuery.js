import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

/** A consistent cache and error contract for all dashboard summary endpoints. */
export function useSummaryQuery({ namespace, service, queryParams, enabled = true }) {
  const queryString = useMemo(() => service.toQueryString(queryParams), [service, queryParams]);
  const query = useQuery({
    queryKey: [namespace, 'summary', queryString],
    queryFn: ({ signal }) => service.getSummary(queryParams, { signal }),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });

  return { ...query, error: query.error?.message || null };
}
