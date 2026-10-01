import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graduatesService } from '../services/graduatesService';

export function useGraduateSummary(queryParams) {
  const queryString = useMemo(
    () => graduatesService.toQueryString(queryParams),
    [queryParams]
  );

  const query = useQuery({
    queryKey: ['graduates', 'summary', queryString],
    queryFn: ({ signal }) => graduatesService.getSummary(queryParams, { signal }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    select: (response) => (response?.success ? response : null),
  });

  return { ...query, error: query.error?.message || null };
}
