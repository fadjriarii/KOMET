import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mbkmService } from '../services/mbkmService';

export function useMbkmSummary(queryParams) {
  const queryString = useMemo(
    () => mbkmService.toQueryString(queryParams),
    [queryParams]
  );

  const query = useQuery({
    queryKey: ['mbkm', 'summary', queryString],
    queryFn: ({ signal }) => mbkmService.getSummary(queryParams, { signal }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });

  return { ...query, error: query.error?.message || null };
}
